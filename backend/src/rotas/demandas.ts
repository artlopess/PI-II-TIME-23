/* Arthur Lopes Santos Silva - Rotas de Cadastro e Edicao de Demanda */

/* POST /demandas  - cadastra uma demanda nova
   PUT  /demandas/:id - edita uma demanda que ja existe

   Toda validacao feita aqui e repetida do lado do servidor de proposito:
   a validacao em JavaScript da tela nao substitui a validacao da API,
   porque a requisicao pode vir de fora do sistema.

   Os dados nao ficam mais em memoria: todas as consultas e escritas passam
   pelos repositorios, que usam oracledb via data/conexao.ts. */

import { Router, Request, Response } from "express";
import { verificarToken, exigirPerfil, podeAcessarProjeto, podeVerDemanda } from "../middleware/autenticacao";
import {
  listarDemandas, buscarDemanda, criarDemanda, atualizarDemanda, Demanda, DadosDemanda
} from "../repostiorios/demandas";
import { listarProjetos, projetoExiste } from "../repostiorios/projetos";
import { listarUsuarios, usuarioExiste } from "../repostiorios/usuarios";
import { registrarHistorico, RegistroHistorico } from "../repostiorios/historico";
import { executarEmTransacao } from "../data/conexao";

/* O Router junta as rotas deste arquivo para o servidor usar depois */
const rotas = Router();


/* ===== VALORES PERMITIDOS ===== */
/* Os unicos tipos e prioridades aceitos, conforme o documento de escopo */
const TIPOS_PERMITIDOS = ["Tarefa", "Defeito", "Melhoria", "Documentação"];
const PRIORIDADES_PERMITIDAS = ["Crítica", "Alta", "Média", "Baixa"];

/* Ciclo de vida do status (item 2.2.4 do documento de escopo).
   Para cada status atual, a lista diz para quais status ele pode mudar.
   Uma demanda Concluida nao muda mais. Uma Cancelada tambem nao. */
const TRANSICOES_PERMITIDAS: { [status: string]: string[] } = {
    "Aberta": ["Em andamento", "Cancelada"],
    "Em andamento": ["Em revisão", "Cancelada"],
    "Em revisão": ["Em andamento", "Concluída", "Cancelada"],
    "Concluída": [],
    "Cancelada": []
};


/* ===== FUNCOES DE APOIO ===== */

/* Confere se o valor recebido e um texto preenchido.
   Usa trim() para que um texto so com espacos conte como vazio. */
function textoPreenchido(valor: any): boolean {
    if (typeof valor !== "string") {
        return false;
    }

    if (valor.trim() === "") {
        return false;
    }

    return true;
}

/* Confere se a data esta no formato AAAA-MM-DD e se existe de verdade.
   A segunda parte evita aceitar datas como 2026-02-31. */
function dataValida(valor: string): boolean {
    /* Confere o formato: 4 numeros, hifen, 2 numeros, hifen, 2 numeros */
    const formato = /^\d{4}-\d{2}-\d{2}$/;

    if (formato.test(valor) === false) {
        return false;
    }

    /* Monta a data e confere se ela continua igual ao que foi enviado.
       Se o dia nao existir, o JavaScript ajusta e os textos ficam diferentes. */
    const data = new Date(valor);

    if (isNaN(data.getTime()) === true) {
        return false;
    }

    return data.toISOString().substring(0, 10) === valor;
}

/* Erro específico para quando a BrasilAPI não pode ser consultada.
   As rotas transformam isso em HTTP 503: sem a consulta não é possível
   garantir que o prazo não cai em feriado, então a gravação é recusada. */
class FeriadosIndisponiveis extends Error {
    constructor(detalhes: string) {
        super("Não foi possível consultar os feriados nacionais (" + detalhes + "). Tente novamente mais tarde.");
        this.name = "FeriadosIndisponiveis";
    }
}

/* Tempo máximo de espera pela API externa. */
const TEMPO_LIMITE_FERIADOS = 5000; // milissegundos

/* Consulta a API externa de feriados nacionais (item 2.2.5 do escopo).
   Devolve o nome do feriado quando a data cair em um, ou null quando nao cair.

   Fail-closed: timeout, erro de rede, HTTP diferente de 2xx ou JSON inválido
   geram FeriadosIndisponiveis. Nesses casos o cadastro/atualização NÃO segue. */
async function nomeDoFeriado(data: string): Promise<string | null> {
    const ano = data.substring(0, 4);
    /* globalThis.Response é a Response do fetch, não a do Express. */
    let resposta: globalThis.Response;

    try {
        resposta = await fetch("https://brasilapi.com.br/api/feriados/v1/" + ano, {
            signal: AbortSignal.timeout(TEMPO_LIMITE_FERIADOS)
        });
    } catch (erro) {
        throw new FeriadosIndisponiveis("serviço fora do ar ou tempo limite excedido");
    }

    if (resposta.ok === false) {
        throw new FeriadosIndisponiveis("resposta HTTP " + resposta.status);
    }

    let feriados: unknown;

    try {
        feriados = await resposta.json();
    } catch (erro) {
        throw new FeriadosIndisponiveis("resposta inválida");
    }

    if (Array.isArray(feriados) === false) {
        throw new FeriadosIndisponiveis("resposta inválida");
    }

    for (const feriado of feriados) {
        if (feriado.date === data) {
            return String(feriado.name);
        }
    }

    return null;
}

/* Data de hoje no horário local do servidor, no formato AAAA-MM-DD.
   Usada para recusar prazos passados sem depender do fuso UTC. */
function hojeComoTexto(): string {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");

    return ano + "-" + mes + "-" + dia;
}


/* ===== LISTAGEM: GET /demandas (itens 2.2.9 e 2.3 do escopo) ===== */

/* Remove acentos para que "em andamento" também encontre "Em andamento". */
function normalizar(texto: string): string {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
}

function textoRecebido(valor: unknown): string {
    return typeof valor === "string" ? valor.trim() : "";
}

/* Devolve o valor canônico da lista ou null quando não confere. */
function valorDaLista(valor: string, lista: string[]): string | null {
    return lista.find(item => normalizar(item) === normalizar(valor)) ?? null;
}

rotas.get("/demandas", verificarToken, async function (req: Request, res: Response) {
    const { status, prioridade, tipo, responsavel, projeto, busca, ordenarPor, direcao } = req.query;

    /* Query repetida chega como array — recusamos para não quebrar os filtros. */
    for (const [nome, valor] of Object.entries({ status, prioridade, tipo, responsavel, projeto, busca, ordenarPor, direcao })) {
        if (valor !== undefined && typeof valor !== "string") {
            return res.status(400).json({ mensagem: `Parâmetro inválido: ${nome}.` });
        }
    }

    const statusValidos = ["Aberta", "Em andamento", "Em revisão", "Concluída", "Cancelada"];
    const prioridadesOrdem = ["Crítica", "Alta", "Média", "Baixa"];
    const tiposValidos = ["Tarefa", "Defeito", "Melhoria", "Documentação"];
    const criterios = ["prioridade", "dataCriacao", "prazo", "prazoFinalizacao", "status"];

    const statusFiltro = textoRecebido(status);
    const prioridadeFiltro = textoRecebido(prioridade);
    const tipoFiltro = textoRecebido(tipo);
    const responsavelFiltro = textoRecebido(responsavel);
    const projetoFiltro = textoRecebido(projeto);
    const buscaFiltro = normalizar(textoRecebido(busca));
    const ordem = textoRecebido(ordenarPor) || "dataCriacao";
    const sentido = textoRecebido(direcao) || "asc";

    let statusCanonico: string | null = null;
    let prioridadeCanonica: string | null = null;
    let tipoCanonico: string | null = null;

    if (statusFiltro !== "") {
        statusCanonico = valorDaLista(statusFiltro, statusValidos);
        if (statusCanonico === null) {
            return res.status(400).json({ mensagem: "Status inválido." });
        }
    }

    if (prioridadeFiltro !== "") {
        prioridadeCanonica = valorDaLista(prioridadeFiltro, prioridadesOrdem);
        if (prioridadeCanonica === null) {
            return res.status(400).json({ mensagem: "Prioridade inválida." });
        }
    }

    if (tipoFiltro !== "") {
        tipoCanonico = valorDaLista(tipoFiltro, tiposValidos);
        if (tipoCanonico === null) {
            return res.status(400).json({ mensagem: "Tipo inválido." });
        }
    }

    for (const [nome, valor] of Object.entries({ responsavel: responsavelFiltro, projeto: projetoFiltro })) {
        if (valor !== "" && /^[1-9]\d*$/.test(valor) === false) {
            return res.status(400).json({ mensagem: `${nome} deve ser um ID numérico válido.` });
        }
    }

    if (criterios.includes(ordem) === false) {
        return res.status(400).json({ mensagem: "Critério de ordenação inválido." });
    }

    if (["asc", "desc"].includes(sentido) === false) {
        return res.status(400).json({ mensagem: "Direção de ordenação inválida." });
    }

    /* Três consultas apenas: as listagens de demanda, projeto e usuário.
       Os nomes são montados em Map para não consultar o banco por linha. */
    const [todas, projetos, usuarios] = await Promise.all([
        listarDemandas(),
        listarProjetos(),
        listarUsuarios()
    ]);

    const nomesProjetos = new Map(projetos.map(p => [p.id, p.nome]));
    const nomesUsuarios = new Map(usuarios.map(u => [u.id, u.nome]));

    const visiveis: Demanda[] = [];

    for (const demanda of todas) {
        /* Admin vê todas; Líder vê as dos seus projetos; Membro só as atribuídas a ele. */
        if (await podeVerDemanda(res.locals.usuario, demanda) === false) {
            continue;
        }

        if (statusCanonico !== null && demanda.status !== statusCanonico) continue;
        if (prioridadeCanonica !== null && demanda.prioridade !== prioridadeCanonica) continue;
        if (tipoCanonico !== null && demanda.tipo !== tipoCanonico) continue;
        if (responsavelFiltro !== "" && demanda.responsavelId !== Number(responsavelFiltro)) continue;
        if (projetoFiltro !== "" && demanda.projetoId !== Number(projetoFiltro)) continue;
        if (buscaFiltro !== "" && normalizar(`${demanda.titulo} ${demanda.descricao}`).includes(buscaFiltro) === false) continue;

        visiveis.push(demanda);
    }

    /* "prazo" e "prazoFinalizacao" são aliases do mesmo campo. */
    const criterio = ordem === "prazoFinalizacao" ? "prazo" : ordem;

    visiveis.sort((a, b) => {
        let comparacao = 0;

        if (criterio === "prioridade") {
            comparacao = prioridadesOrdem.indexOf(a.prioridade) - prioridadesOrdem.indexOf(b.prioridade);
        } else if (criterio === "status") {
            comparacao = statusValidos.indexOf(a.status) - statusValidos.indexOf(b.status);
        } else if (criterio === "dataCriacao") {
            comparacao = a.dataCriacao.localeCompare(b.dataCriacao);
        } else {
            comparacao = (a.prazo ?? "9999-12-31").localeCompare(b.prazo ?? "9999-12-31");
        }

        return sentido === "desc" ? -comparacao : comparacao;
    });

    const resposta = visiveis.map(demanda => ({
        ...demanda,
        projetoNome: nomesProjetos.get(demanda.projetoId) ?? "—",
        responsavelNome: demanda.responsavelId === null
            ? "Sem responsável"
            : (nomesUsuarios.get(demanda.responsavelId) ?? "Sem responsável")
    }));

    return res.status(200).json({ total: resposta.length, demandas: resposta });
});

/* ===== VALIDACAO DOS CAMPOS =====
   Usada pelo POST e pelo PUT, porque os campos sao os mesmos.
   Devolve a lista de erros encontrados (vazia quando esta tudo certo). */
async function validarCampos(corpo: any): Promise<string[]> {

    const erros: string[] = [];

    /* --- Titulo: obrigatorio, de 5 a 120 caracteres --- */
    if (textoPreenchido(corpo.titulo) === false) {
        erros.push("O titulo e obrigatorio.");
    } else if (corpo.titulo.trim().length < 5) {
        erros.push("O titulo precisa ter pelo menos 5 caracteres.");
    } else if (corpo.titulo.trim().length > 120) {
        erros.push("O titulo pode ter no maximo 120 caracteres.");
    }

    /* --- Descricao: obrigatoria, com pelo menos 10 caracteres --- */
    if (textoPreenchido(corpo.descricao) === false) {
        erros.push("A descricao e obrigatoria.");
    } else if (corpo.descricao.trim().length < 10) {
        erros.push("A descricao precisa ter pelo menos 10 caracteres.");
    }

    /* --- Tipo: obrigatorio e precisa ser um dos quatro valores aceitos --- */
    if (textoPreenchido(corpo.tipo) === false) {
        erros.push("O tipo e obrigatorio.");
    } else if (TIPOS_PERMITIDOS.includes(corpo.tipo) === false) {
        erros.push("O tipo precisa ser Tarefa, Defeito, Melhoria ou Documentação.");
    }

    /* --- Prioridade: obrigatoria e precisa ser uma das quatro aceitas --- */
    if (textoPreenchido(corpo.prioridade) === false) {
        erros.push("A prioridade e obrigatoria.");
    } else if (PRIORIDADES_PERMITIDAS.includes(corpo.prioridade) === false) {
        erros.push("A prioridade precisa ser Crítica, Alta, Média ou Baixa.");
    }

    /* --- Projeto: obrigatorio e precisa existir no Oracle --- */
    if (corpo.projetoId === undefined || corpo.projetoId === null || corpo.projetoId === "") {
        erros.push("O projeto e obrigatorio.");
    } else if (await projetoExiste(Number(corpo.projetoId)) === false) {
        erros.push("O projeto informado nao existe.");
    }

    /* --- Responsavel: opcional, mas se vier precisa existir no Oracle --- */
    if (corpo.responsavelId !== undefined && corpo.responsavelId !== null && corpo.responsavelId !== "") {
        if (await usuarioExiste(Number(corpo.responsavelId)) === false) {
            erros.push("O responsavel informado nao existe.");
        }
    }

    /* --- Prazo: opcional. Se vier, confere o formato e se nao e feriado --- */
    if (corpo.prazo !== undefined && corpo.prazo !== null && corpo.prazo !== "") {

        if (dataValida(corpo.prazo) === false) {
            erros.push("O prazo precisa estar no formato AAAA-MM-DD e ser uma data valida.");
        } else if (corpo.prazo < hojeComoTexto()) {
            /* Hoje é permitido; somente datas anteriores são recusadas. */
            erros.push("O prazo nao pode ser uma data passada.");
        } else {
            /* O await espera a resposta da API de feriados antes de continuar.
               Se a API falhar, nomeDoFeriado lança e a rota devolve 503. */
            const feriado = await nomeDoFeriado(corpo.prazo);

            if (feriado !== null) {
                erros.push("O prazo nao pode cair em feriado nacional (" + feriado + ").");
            }
        }
    }

    return erros;
}

/* Envolve a validação para transformar uma falha da BrasilAPI em 503.
   Devolve null quando a resposta de erro já foi enviada ao cliente. */
async function validarComFeriado(corpo: any, res: Response): Promise<string[] | null> {
    try {
        return await validarCampos(corpo);
    } catch (erro) {
        if (erro instanceof FeriadosIndisponiveis) {
            res.status(503).json({
                mensagem: "Não foi possível validar o prazo.",
                erro: erro.message
            });
            return null;
        }

        throw erro;
    }
}


/* ===== POST /demandas ===== */
/* Cadastra uma nova demanda */
rotas.post("/demandas", verificarToken, exigirPerfil("Administrador", "Líder de Projeto"), async function (req: Request, res: Response) {

    /* Valida todos os campos de uma vez. Sem a BrasilAPI, devolve 503. */
    const erros = await validarComFeriado(req.body, res);

    if (erros === null) {
        return;
    }

    /* Se houver qualquer erro, devolve 400 e nao cadastra nada */
    if (erros.length > 0) {
        return res.status(400).json({
            mensagem: "Nao foi possivel cadastrar a demanda.",
            erros: erros
        });
    }

    const corpo = req.body;

    /* Líder só cria demandas nos projetos aos quais está vinculado. */
    if (await podeAcessarProjeto(res.locals.usuario, Number(corpo.projetoId)) === false) {
        return res.status(403).json({
            mensagem: "Você não tem permissão para criar demandas neste projeto."
        });
    }

    /* Status, data de criacao e data de atualizacao sao definidos pelo banco.
       Toda demanda nasce Aberta, mesmo que a requisicao envie outro status. */
    const dados: DadosDemanda = {
        titulo: corpo.titulo.trim(),
        descricao: corpo.descricao.trim(),
        tipo: corpo.tipo,
        prioridade: corpo.prioridade,
        status: "Aberta",
        projetoId: Number(corpo.projetoId),
        responsavelId: (corpo.responsavelId === undefined || corpo.responsavelId === null || corpo.responsavelId === "")
            ? null
            : Number(corpo.responsavelId),
        prazo: (corpo.prazo === undefined || corpo.prazo === null || corpo.prazo === "") ? null : corpo.prazo
    };

    const novaDemanda = await criarDemanda(dados);

    /* 201 significa "registro criado com sucesso" */
    return res.status(201).json({
        mensagem: "Demanda cadastrada com sucesso.",
        demanda: novaDemanda
    });
});


/* Compara um campo recebido com o valor atual, tratando vazio e null como iguais. */
function mesmoValor(recebido: any, atual: any): boolean {
    const vazio = recebido === undefined || recebido === null || recebido === "";

    if (vazio) {
        return atual === null || atual === undefined || atual === "";
    }

    return String(recebido).trim() === String(atual);
}

/* ===== PUT /demandas/:id ===== */
/* Edita uma demanda que ja existe (item 2.2.5 e 2.2.8 do escopo).
   O UPDATE e os INSERTs no historico acontecem na MESMA transacao. */
rotas.put("/demandas/:id", verificarToken, async function (req: Request, res: Response) {

    /* O :id da URL chega como texto, por isso o Number() */
    const id = Number(req.params.id);

    /* 404 quando a demanda nao existe */
    const demanda = await buscarDemanda(id);

    if (demanda === null) {
        return res.status(404).json({
            mensagem: "Demanda nao encontrada."
        });
    }

    /* Demanda concluida nao pode mais ser alterada */
    if (demanda.status === "Concluída") {
        return res.status(400).json({
            mensagem: "Nao foi possivel alterar a demanda.",
            erros: ["Uma demanda concluida nao pode mais ser alterada."]
        });
    }

    /* Cancelada tambem e definitiva. O historico nao e apagado (item 2.2.7). */
    if (demanda.status === "Cancelada") {
        return res.status(400).json({
            mensagem: "Nao foi possivel alterar a demanda.",
            erros: ["Uma demanda cancelada nao pode mais ser alterada."]
        });
    }

    const usuario = res.locals.usuario;

    /* Líder e Membro só mexem com demandas dos projetos aos quais estão vinculados. */
    if (await podeAcessarProjeto(usuario, demanda.projetoId) === false) {
        return res.status(403).json({
            mensagem: "Você não tem permissão para alterar esta demanda."
        });
    }

    /* O Membro não altera dados estruturais: só o status das demandas atribuídas a ele. */
    if (usuario.perfil === "Membro da Equipe") {
        if (demanda.responsavelId !== usuario.id) {
            return res.status(403).json({
                mensagem: "Membro da Equipe só pode alterar demandas atribuídas a ele."
            });
        }

        const corpo = req.body ?? {};
        const camposIndeferidos = [
            mesmoValor(corpo.titulo, demanda.titulo),
            mesmoValor(corpo.descricao, demanda.descricao),
            mesmoValor(corpo.tipo, demanda.tipo),
            mesmoValor(corpo.prioridade, demanda.prioridade),
            mesmoValor(corpo.projetoId, demanda.projetoId),
            mesmoValor(corpo.responsavelId, demanda.responsavelId),
            mesmoValor(corpo.prazo, demanda.prazo)
        ];

        if (camposIndeferidos.includes(false)) {
            return res.status(403).json({
                mensagem: "Membro da Equipe só pode alterar o status da demanda."
            });
        }
    }

    /* Valida os mesmos campos do cadastro. Sem a BrasilAPI, devolve 503. */
    const erros = await validarComFeriado(req.body, res);

    if (erros === null) {
        return;
    }

    const corpo = req.body;

    /* --- Status: confere se a mudanca e permitida pelo ciclo de vida --- */
    /* O status novo e opcional: se nao vier, a demanda mantem o atual */
    let statusNovo = demanda.status;

    if (textoPreenchido(corpo.status) === true && corpo.status !== demanda.status) {

        /* Lista de para onde o status atual pode ir.
           O || [] protege contra um status que nao esteja na tabela. */
        const permitidos = TRANSICOES_PERMITIDAS[demanda.status] || [];

        /* Membro só faz Aberta→Em andamento e Em andamento→Em revisão (item 2.2.4). */
        const permitidosMembro: { [status: string]: string[] } = {
            "Aberta": ["Em andamento"],
            "Em andamento": ["Em revisão"]
        };
        const permitidosParaUsuario = usuario.perfil === "Membro da Equipe"
            ? (permitidosMembro[demanda.status] || [])
            : permitidos;

        /* Primeiro vale o ciclo de vida; depois a restrição do perfil.
           Assim uma transição inválida continua sendo 400, enquanto uma
           transição válida só para Admin/Líder devolve 403. */
        if (permitidos.includes(corpo.status) === false) {
            erros.push(
                "Nao e permitido mudar o status de " + demanda.status +
                " para " + corpo.status + "."
            );
        } else if (permitidosParaUsuario.includes(corpo.status) === false) {
            return res.status(403).json({
                mensagem: "Seu perfil não pode realizar esta transição de status.",
                erros: ["Membro da Equipe só pode mudar de Aberta para Em andamento e de Em andamento para Em revisão."]
            });
        } else {
            statusNovo = corpo.status;
        }
    }

    /* Se houver qualquer erro, devolve 400 e nao altera nada */
    if (erros.length > 0) {
        return res.status(400).json({
            mensagem: "Nao foi possivel alterar a demanda.",
            erros: erros
        });
    }

    /* --- Dados que vao para o UPDATE --- */
    const responsavelNovoId = (corpo.responsavelId === undefined || corpo.responsavelId === null || corpo.responsavelId === "")
        ? null
        : Number(corpo.responsavelId);
    const prazoNovo = (corpo.prazo === undefined || corpo.prazo === null || corpo.prazo === "") ? null : corpo.prazo;

    const dados: DadosDemanda = {
        titulo: corpo.titulo.trim(),
        descricao: corpo.descricao.trim(),
        tipo: corpo.tipo,
        prioridade: corpo.prioridade,
        status: statusNovo,
        projetoId: Number(corpo.projetoId),
        responsavelId: responsavelNovoId,
        prazo: prazoNovo
    };

    /* --- Histórico: uma linha por campo relevante que mudou --- */
    const usuarios = await listarUsuarios();
    const nomeResponsavel = (id: number | null): string =>
        id === null ? "Sem responsável" : (usuarios.find(u => u.id === Number(id))?.nome ?? "Desconhecido");

    const histórico: RegistroHistorico[] = [];

    function registrarSeMudou(campo: string, anterior: string | null, novo: string | null): void {
        if (mesmoValor(novo, anterior) === false) {
            histórico.push({
                demandaId: id,
                usuarioId: Number(usuario.id),
                campo,
                valorAnterior: anterior,
                valorNovo: novo
            });
        }
    }

    registrarSeMudou("status", demanda.status, statusNovo);
    registrarSeMudou("responsavel", nomeResponsavel(demanda.responsavelId), nomeResponsavel(responsavelNovoId));
    registrarSeMudou("prioridade", demanda.prioridade, corpo.prioridade);
    registrarSeMudou("prazo", demanda.prazo, prazoNovo);

    /* UPDATE + INSERTs no histórico: ou tudo é gravado, ou nada é. */
    const demandaAlterada = await executarEmTransacao(async cliente => {
        await atualizarDemanda(id, dados, cliente);
        await registrarHistorico(histórico, cliente);
        return buscarDemanda(id, cliente);
    });

    if (demandaAlterada === null) {
        throw new Error("A demanda alterada não pôde ser lida de volta.");
    }

    /* 200 significa "deu certo" */
    return res.status(200).json({
        mensagem: "Demanda alterada com sucesso.",
        demanda: demandaAlterada
    });
});


export default rotas;
