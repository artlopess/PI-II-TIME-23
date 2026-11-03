/* Arthur Lopes Santos Silva - Rotas de Cadastro e Edicao de Demanda */

/* POST /demandas  - cadastra uma demanda nova
   PUT  /demandas/:id - edita uma demanda que ja existe

   Toda validacao feita aqui e repetida do lado do servidor de proposito:
   a validacao em JavaScript da tela nao substitui a validacao da API,
   porque a requisicao pode vir de fora do sistema. */

import { Router, Request, Response } from "express";
import { demandas, projetos, usuarios, Demanda, proximoIdDemanda } from "../data/dados";

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

/* Consulta a API externa de feriados nacionais (item 2.2.5 do escopo).
   Devolve o nome do feriado quando a data cair em um, ou null quando nao cair.

   Se a API estiver fora do ar, a funcao devolve null e o cadastro segue.
   Isso e proposital: o sistema nao pode parar de funcionar porque um
   servico de fora caiu. */
async function nomeDoFeriado(data: string): Promise<string | null> {
    const ano = data.substring(0, 4);

    try {
        const resposta = await fetch("https://brasilapi.com.br/api/feriados/v1/" + ano);

        if (resposta.ok === false) {
            return null;
        }

        const feriados = await resposta.json();

        for (const feriado of feriados) {
            if (feriado.date === data) {
                return feriado.name;
            }
        }

        return null;

    } catch (erro) {
        /* API inacessivel: registra no terminal e deixa passar */
        console.log("Aviso: nao foi possivel consultar a API de feriados.");
        return null;
    }
}

/* Procura uma demanda pelo id. Devolve a demanda ou undefined. */
function acharDemanda(id: number): Demanda | undefined {
    return demandas.find(function (d) {
        return d.id === id;
    });
}


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

    /* --- Projeto: obrigatorio e precisa existir nos dados cadastrados --- */
    if (corpo.projetoId === undefined || corpo.projetoId === null || corpo.projetoId === "") {
        erros.push("O projeto e obrigatorio.");
    } else {
        const projetoEncontrado = projetos.find(function (p) {
            return p.id === Number(corpo.projetoId);
        });

        if (projetoEncontrado === undefined) {
            erros.push("O projeto informado nao existe.");
        }
    }

    /* --- Responsavel: opcional, mas se vier precisa existir --- */
    if (corpo.responsavelId !== undefined && corpo.responsavelId !== null && corpo.responsavelId !== "") {
        const usuarioEncontrado = usuarios.find(function (u) {
            return u.id === Number(corpo.responsavelId);
        });

        if (usuarioEncontrado === undefined) {
            erros.push("O responsavel informado nao existe.");
        }
    }

    /* --- Prazo: opcional. Se vier, confere o formato e se nao e feriado --- */
    if (corpo.prazo !== undefined && corpo.prazo !== null && corpo.prazo !== "") {

        if (dataValida(corpo.prazo) === false) {
            erros.push("O prazo precisa estar no formato AAAA-MM-DD e ser uma data valida.");
        } else {
            /* O await espera a resposta da API de feriados antes de continuar */
            const feriado = await nomeDoFeriado(corpo.prazo);

            if (feriado !== null) {
                erros.push("O prazo nao pode cair em feriado nacional (" + feriado + ").");
            }
        }
    }

    return erros;
}


/* ===== POST /demandas ===== */
/* Cadastra uma nova demanda */
rotas.post("/demandas", async function (req: Request, res: Response) {

    /* Valida todos os campos de uma vez */
    const erros = await validarCampos(req.body);

    /* Se houver qualquer erro, devolve 400 e nao cadastra nada */
    if (erros.length > 0) {
        return res.status(400).json({
            mensagem: "Nao foi possivel cadastrar a demanda.",
            erros: erros
        });
    }

    /* --- Dados definidos pelo servidor --- */
    /* Status, data de criacao e data de atualizacao sao definidos aqui,
       mesmo que tenham sido enviados na requisicao. Toda demanda nasce Aberta. */
    const agora = new Date().toISOString();
    const corpo = req.body;

    const novaDemanda: Demanda = {
        id: proximoIdDemanda(),
        titulo: corpo.titulo.trim(),
        descricao: corpo.descricao.trim(),
        tipo: corpo.tipo,
        prioridade: corpo.prioridade,
        status: "Aberta",
        projetoId: Number(corpo.projetoId),
        responsavelId: (corpo.responsavelId === undefined || corpo.responsavelId === null || corpo.responsavelId === "")
            ? null
            : Number(corpo.responsavelId),
        dataCriacao: agora,
        dataAtualizacao: agora,
        prazo: (corpo.prazo === undefined || corpo.prazo === null || corpo.prazo === "") ? null : corpo.prazo
    };

    /* Guarda a demanda na lista em memoria */
    demandas.push(novaDemanda);

    /* 201 significa "registro criado com sucesso" */
    return res.status(201).json({
        mensagem: "Demanda cadastrada com sucesso.",
        demanda: novaDemanda
    });
});


/* ===== PUT /demandas/:id ===== */
/* Edita uma demanda que ja existe (item 2.2.5 e 2.2.8 do escopo) */
rotas.put("/demandas/:id", async function (req: Request, res: Response) {

    /* O :id da URL chega como texto, por isso o Number() */
    const id = Number(req.params.id);

    /* 404 quando a demanda nao existe */
    const demanda = acharDemanda(id);

    if (demanda === undefined) {
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

    /* Valida os mesmos campos do cadastro */
    const erros = await validarCampos(req.body);

    const corpo = req.body;

    /* --- Status: confere se a mudanca e permitida pelo ciclo de vida --- */
    /* O status novo e opcional: se nao vier, a demanda mantem o atual */
    let statusNovo = demanda.status;

    if (textoPreenchido(corpo.status) === true && corpo.status !== demanda.status) {

        /* Lista de para onde o status atual pode ir.
           O || [] protege contra um status que nao esteja na tabela. */
        const permitidos = TRANSICOES_PERMITIDAS[demanda.status] || [];

        if (permitidos.includes(corpo.status) === false) {
            erros.push(
                "Nao e permitido mudar o status de " + demanda.status +
                " para " + corpo.status + "."
            );
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

    /* --- Aplica as alteracoes --- */
    /* A data de atualizacao e definida pelo servidor, nunca pela requisicao */
    demanda.titulo = corpo.titulo.trim();
    demanda.descricao = corpo.descricao.trim();
    demanda.tipo = corpo.tipo;
    demanda.prioridade = corpo.prioridade;
    demanda.projetoId = Number(corpo.projetoId);
    demanda.responsavelId = (corpo.responsavelId === undefined || corpo.responsavelId === null || corpo.responsavelId === "")
        ? null
        : Number(corpo.responsavelId);
    demanda.prazo = (corpo.prazo === undefined || corpo.prazo === null || corpo.prazo === "") ? null : corpo.prazo;
    demanda.status = statusNovo;
    demanda.dataAtualizacao = new Date().toISOString();

    /* 200 significa "deu certo" */
    return res.status(200).json({
        mensagem: "Demanda alterada com sucesso.",
        demanda: demanda
    });
});


export default rotas;
