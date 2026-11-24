// Pedro Osti - Listagem de demandas conectada à API (item 2.2.9 do escopo)
// Antes a tabela era fixa no HTML. Agora os dados vêm de GET /demandas, com
// token enviado por chamarApi() (autenticacao.js), e os filtros são enviados
// como query string para o backend — sem recarregar a página.

function el(id) {
    return document.getElementById(id);
}

function usuarioLogado() {
    try {
        return obterUsuario();
    } catch {
        return null;
    }
}

function podeGerenciar() {
    const perfil = usuarioLogado()?.perfil;
    return perfil === "Administrador" || perfil === "Líder de Projeto";
}

function limparErro() {
    el("mensagem-erro").textContent = "";
}

function mostrarErro(mensagem) {
    el("mensagem-erro").textContent = mensagem;
}

function mensagemDaApi(dados, status) {
    let texto = (dados && (dados.mensagem || dados.erro)) || `Erro ${status} na API.`;
    if (dados && Array.isArray(dados.erros) && dados.erros.length > 0) {
        texto += " " + dados.erros.join(" ");
    }
    return texto;
}

// chamarApi() já reenvia o token e desloga quando a sessão expira.
async function buscar(caminho) {
    el("carregando").hidden = false;

    try {
        const resposta = await chamarApi(caminho);
        const dados = await resposta.json().catch(() => null);

        if (!resposta.ok) {
            throw new Error(mensagemDaApi(dados, resposta.status));
        }

        return dados;
    } finally {
        el("carregando").hidden = true;
    }
}

// O prazo e a criação chegam como "AAAA-MM-DD" ou ISO; quebramos o texto
// manualmente para não deslocar um dia por causa do fuso horário.
function formatarData(valor) {
    if (!valor) {
        return "—";
    }

    const partes = String(valor).slice(0, 10).split("-");
    if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    return new Date(valor).toLocaleDateString("pt-BR");
}

function classeCss(texto) {
    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

function criarCelula(texto, classeExtra) {
    const celula = document.createElement("td");
    if (classeExtra) {
        celula.className = classeExtra;
    }
    celula.textContent = texto === null || texto === undefined || texto === "" ? "—" : texto;
    return celula;
}

function linkPara(caminho, texto) {
    const link = document.createElement("a");
    link.href = caminho;
    link.className = "link-acao";
    link.textContent = texto;
    return link;
}

function criarLinha(demanda) {
    const linha = document.createElement("tr");

    // O título é o link principal para os detalhes da demanda.
    const titulo = document.createElement("td");
    titulo.className = "col-titulo";
    titulo.appendChild(linkPara(
        "detalhes.html?id=" + encodeURIComponent(demanda.id),
        `#${demanda.id} · ${demanda.titulo}`
    ));
    linha.appendChild(titulo);

    linha.appendChild(criarCelula(demanda.tipo));
    linha.appendChild(criarCelula(demanda.prioridade, `prioridade-${classeCss(demanda.prioridade)}`));
    linha.appendChild(criarCelula(demanda.status, `status-${classeCss(demanda.status)}`));
    linha.appendChild(criarCelula(demanda.projetoNome));
    linha.appendChild(criarCelula(demanda.responsavelNome || "Sem responsável"));
    linha.appendChild(criarCelula(formatarData(demanda.dataCriacao)));
    linha.appendChild(criarCelula(formatarData(demanda.prazo)));

    const acoes = document.createElement("td");
    acoes.className = "acoes";
    acoes.appendChild(linkPara("detalhes.html?id=" + encodeURIComponent(demanda.id), "Ver"));

    // Membro não tem botão de edição: a API também recusa o acesso.
    if (podeGerenciar()) {
        acoes.appendChild(linkPara("editar-demanda.html?id=" + encodeURIComponent(demanda.id), "Editar"));
    }

    linha.appendChild(acoes);
    return linha;
}

function renderizarDemandas(dados) {
    const lista = (dados && Array.isArray(dados.demandas)) ? dados.demandas : [];

    el("tabela-demandas").hidden = lista.length === 0;
    el("tabela-vazia").hidden = lista.length > 0;
    el("total-demandas").textContent = String(lista.length);
    el("corpo-tabela").replaceChildren(...lista.map(criarLinha));
}

function parametrosDosFiltros() {
    const parametros = new URLSearchParams();

    for (const campo of el("form-filtros").elements) {
        if (!campo.name) {
            continue;
        }

        const valor = String(campo.value || "").trim();
        if (valor !== "") {
            parametros.set(campo.name, valor);
        }
    }

    return parametros;
}

async function carregarDemandas() {
    limparErro();

    try {
        const dados = await buscar("/demandas?" + parametrosDosFiltros().toString());
        renderizarDemandas(dados);
    } catch (erro) {
        mostrarErro(erro.message);
    }
}

function preencherSelect(id, itens, textoVazio) {
    const campo = el(id);

    const vazio = document.createElement("option");
    vazio.value = "";
    vazio.textContent = textoVazio;

    campo.replaceChildren(vazio, ...itens.map(item => {
        const opcao = document.createElement("option");
        opcao.value = String(item.id);
        opcao.textContent = item.nome;
        return opcao;
    }));
}

async function carregarProjetos() {
    const dados = await buscar("/projetos");
    preencherSelect("filtro-projeto", (dados && dados.projetos) || [], "Todos os projetos");
}

async function carregarResponsaveis() {
    // GET /usuarios exige Admin ou Líder; para Membro o filtro fica escondido.
    if (!podeGerenciar()) {
        return;
    }

    const dados = await buscar("/usuarios");
    const usuarios = Array.isArray(dados)
        ? dados
        : ((dados && dados.usuarios) || []);
    preencherSelect("filtro-responsavel", usuarios, "Todos os responsáveis");
}

function aplicarPermissoes() {
    const usuario = usuarioLogado();

    if (usuario) {
        el("saudacao").textContent = `Olá, ${usuario.nome} · ${usuario.perfil}`;
    }

    if (podeGerenciar()) {
        el("btn-nova-demanda").hidden = false;
    } else {
        el("campo-responsavel").hidden = true;
    }
}

function configurarEventos() {
    el("form-filtros").addEventListener("submit", evento => {
        evento.preventDefault();
        carregarDemandas();
    });

    el("btn-limpar").addEventListener("click", () => {
        el("form-filtros").reset();
        carregarDemandas();
    });
}

// Mesma checagem das outras telas protegidas: sem token, volta para o login.
exigirLogin();

if (obterToken()) {
    aplicarPermissoes();
    configurarEventos();

    carregarProjetos().catch(erro => mostrarErro(erro.message));
    carregarResponsaveis().catch(erro => mostrarErro(erro.message));
    carregarDemandas();
}
