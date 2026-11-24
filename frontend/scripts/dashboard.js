// Gabriel Augusto Jorge - Dashboard do Fluxo (reformulação)
// Consome GET /dashboard, GET /demandas, GET /projetos e GET /usuarios.
// Todas as chamadas passam por chamarApi() (autenticacao.js), que reenvia o
// token e devolve o usuário para o login quando a sessão expira.

const PRIORIDADES = ["Crítica", "Alta", "Média", "Baixa"];
const TIPOS = ["Tarefa", "Defeito", "Melhoria", "Documentação"];

let requisicoesAtivas = 0;

/* ===== AUXILIARES ===== */

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

function iniciarCarregamento() {
    requisicoesAtivas++;
    el("carregando").hidden = false;
}

function finalizarCarregamento() {
    requisicoesAtivas = Math.max(0, requisicoesAtivas - 1);
    if (requisicoesAtivas === 0) {
        el("carregando").hidden = true;
    }
}

function mensagemDaApi(dados, status) {
    let texto = (dados && (dados.erro || dados.mensagem)) || `Erro ${status} na API.`;
    if (dados && Array.isArray(dados.erros) && dados.erros.length > 0) {
        texto += " " + dados.erros.join(" ");
    }
    return texto;
}

// chamarApi() já envia o token e trata 401. Aqui só interpretamos a resposta.
async function buscar(caminho) {
    iniciarCarregamento();
    try {
        const resposta = await chamarApi(caminho);
        const dados = await resposta.json().catch(() => null);

        if (!resposta.ok) {
            throw new Error(mensagemDaApi(dados, resposta.status));
        }
        return dados;
    } finally {
        finalizarCarregamento();
    }
}

function formatarData(valor) {
    if (!valor) {
        return "—";
    }
    const [ano, mes, dia] = String(valor).slice(0, 10).split("-");
    return `${dia}/${mes}/${ano}`;
}

function formatarHora() {
    return new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function criarElemento(tag, classe, texto) {
    const elemento = document.createElement(tag);
    if (classe) {
        elemento.className = classe;
    }
    if (texto !== undefined && texto !== null) {
        elemento.textContent = texto;
    }
    return elemento;
}

/* ===== INDICADORES ===== */

function criarKpi(titulo, valor, variante) {
    const cartao = criarElemento("div", `kpi ${variante || ""}`);
    cartao.appendChild(criarElemento("span", "kpi-valor", String(valor ?? 0)));
    cartao.appendChild(criarElemento("span", "kpi-label", titulo));
    return cartao;
}

function renderizarKpis(dados) {
    const quantidade = lista => Array.isArray(lista) ? lista.length : 0;
    const status = dados.porStatus || {};

    const cards = [
        criarKpi("Total de demandas", dados.total, "kpi-destaque"),
        criarKpi("Em aberto", dados.totalEmAberto),
        criarKpi("Abertas", status["Aberta"]),
        criarKpi("Em andamento", status["Em andamento"]),
        criarKpi("Em revisão", status["Em revisão"]),
        criarKpi("Concluídas", status["Concluída"], "kpi-sucesso"),
        criarKpi("Canceladas", status["Cancelada"]),
        criarKpi("Críticas em aberto", quantidade(dados.criticasEmAberto), "kpi-atencao"),
        criarKpi("Próximas do prazo", quantidade(dados.proximasDoPrazo), "kpi-atencao")
    ];

    el("kpis").replaceChildren(...cards);
}

function renderizarDistribuicao(id, contagens, ordem, total, classes) {
    const area = el(id);
    const linhas = ordem.map((nome, indice) => {
        const valor = Number((contagens && contagens[nome]) || 0);
        const percentual = total > 0 ? Math.round((valor / total) * 100) : 0;

        const linha = criarElemento("div", "linha-distribuicao");
        const cabecalho = criarElemento("div", "linha-distribuicao-cabecalho");
        cabecalho.appendChild(criarElemento("span", "", nome));
        cabecalho.appendChild(criarElemento("strong", "", String(valor)));

        const barra = criarElemento("div", "barra");
        const preenchimento = criarElemento("span", classes ? classes[indice] : "");
        preenchimento.style.width = percentual + "%";
        barra.appendChild(preenchimento);

        linha.appendChild(cabecalho);
        linha.appendChild(barra);
        return linha;
    });

    area.replaceChildren(...linhas);
}

/* ===== LISTAS DE ATENÇÃO ===== */

function criarItemLista(demanda, destaque) {
    const link = criarElemento("a", "item-lista" + (destaque ? " item-critico" : ""));
    link.href = "detalhes.html?id=" + encodeURIComponent(demanda.id);

    const titulo = criarElemento("span", "item-titulo", `#${demanda.id} · ${demanda.titulo}`);
    const meta = criarElemento(
        "span",
        "item-meta",
        `${demanda.prioridade} · ${demanda.status} · prazo: ${formatarData(demanda.prazo)}`
    );

    link.appendChild(titulo);
    link.appendChild(meta);
    return link;
}

function renderizarLista(id, demandas, textoVazio, destaque) {
    const area = el(id);
    const itens = Array.isArray(demandas) ? demandas : [];

    if (itens.length === 0) {
        area.replaceChildren(criarElemento("p", "vazio", textoVazio));
        return;
    }

    area.replaceChildren(...itens.map(demanda => criarItemLista(demanda, destaque)));
}

/* ===== TABELA DE DEMANDAS ===== */

function criarAcoes(demanda) {
    const celula = criarElemento("td", "acoes");
    const ver = criarElemento("a", "link-acao", "Ver");
    ver.href = "detalhes.html?id=" + encodeURIComponent(demanda.id);
    celula.appendChild(ver);

    if (podeGerenciar()) {
        const editar = criarElemento("a", "link-acao", "Editar");
        editar.href = "editar-demanda.html?id=" + encodeURIComponent(demanda.id);
        celula.appendChild(editar);

        if (demanda.status === "Em revisão") {
            const finalizar = criarElemento("a", "link-acao", "Finalizar");
            finalizar.href = "finalizacao.html?id=" + encodeURIComponent(demanda.id);
            celula.appendChild(finalizar);
        }
    }

    return celula;
}

function renderizarTabela(demandas) {
    const corpo = el("corpo-tabela");
    const lista = Array.isArray(demandas) ? demandas : [];

    el("tabela-demandas").hidden = lista.length === 0;
    el("tabela-vazia").hidden = lista.length > 0;
    el("total-demandas").textContent = String(lista.length);

    const linhas = lista.map(demanda => {
        const linha = criarElemento("tr");

        const titulo = criarElemento("td", "col-titulo");
        const linkTitulo = criarElemento("a", "", demanda.titulo);
        linkTitulo.href = "detalhes.html?id=" + encodeURIComponent(demanda.id);
        titulo.appendChild(linkTitulo);
        linha.appendChild(titulo);

        linha.appendChild(criarElemento("td", "", demanda.tipo));
        linha.appendChild(criarElemento("td", `prioridade-${normalizarClasse(demanda.prioridade)}`, demanda.prioridade));
        linha.appendChild(criarElemento("td", `status-${normalizarClasse(demanda.status)}`, demanda.status));
        linha.appendChild(criarElemento("td", "", demanda.projetoNome || "—"));
        linha.appendChild(criarElemento("td", "", demanda.responsavelNome || "Sem responsável"));
        linha.appendChild(criarElemento("td", "", formatarData(demanda.prazo)));
        linha.appendChild(criarAcoes(demanda));

        return linha;
    });

    corpo.replaceChildren(...linhas);
}

function normalizarClasse(texto) {
    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

/* ===== CARREGAMENTO DOS DADOS ===== */

function diasDaUrl() {
    const bruto = new URLSearchParams(window.location.search).get("dias");
    if (bruto === null || bruto === "") {
        return 7;
    }
    const numero = Number(bruto);
    return Number.isInteger(numero) && numero >= 0 ? numero : 7;
}

async function carregarDashboard() {
    const dias = Number(el("dias").value || diasDaUrl());
    window.history.replaceState(null, "", "?dias=" + dias);

    const dados = await buscar("/dashboard?dias=" + dias);

    renderizarKpis(dados);
    renderizarDistribuicao(
        "distribuicao-prioridade",
        dados.porPrioridade,
        PRIORIDADES,
        dados.total,
        ["barra-critica", "barra-alta", "barra-media", "barra-baixa"]
    );
    renderizarDistribuicao("distribuicao-tipo", dados.porTipo, TIPOS, dados.total);

    const criticas = Array.isArray(dados.criticasEmAberto) ? dados.criticasEmAberto : [];
    const prazo = Array.isArray(dados.proximasDoPrazo) ? dados.proximasDoPrazo : [];

    el("total-criticas").textContent = String(criticas.length);
    el("total-prazo").textContent = String(prazo.length);

    renderizarLista("lista-criticas", criticas, "Nenhuma demanda crítica em aberto.", true);
    renderizarLista("lista-prazo", prazo, "Nenhuma demanda vencendo nesta janela.", false);

    el("ultima-atualizacao").textContent = "Atualizado às " + formatarHora();
}

async function carregarProjetos() {
    const dados = await buscar("/projetos");
    const projetos = (dados && dados.projetos) || [];
    const campo = el("filtro-projeto");

    const opcaoTodos = criarElemento("option", "", "Todos");
    opcaoTodos.value = "";

    campo.replaceChildren(opcaoTodos, ...projetos.map(projeto => {
        const opcao = criarElemento("option", "", projeto.nome);
        opcao.value = String(projeto.id);
        return opcao;
    }));
    campo.value = "";
}

async function carregarUsuarios() {
    const usuarios = await buscar("/usuarios");
    const lista = Array.isArray(usuarios) ? usuarios : [];
    const campo = el("filtro-responsavel");

    const opcaoTodos = criarElemento("option", "", "Todos");
    opcaoTodos.value = "";

    campo.replaceChildren(opcaoTodos, ...lista.map(usuario => {
        const opcao = criarElemento("option", "", usuario.nome);
        opcao.value = String(usuario.id);
        return opcao;
    }));
    campo.value = "";
}

function parametrosDosFiltros() {
    const parametros = new URLSearchParams();
    const campos = el("form-filtros").elements;

    for (const campo of campos) {
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
    const parametros = parametrosDosFiltros();
    const dados = await buscar("/demandas?" + parametros.toString());
    renderizarTabela((dados && dados.demandas) || []);
}

async function carregarTudo() {
    limparErro();

    const tarefas = [carregarDashboard(), carregarProjetos(), carregarDemandas()];
    if (podeGerenciar()) {
        tarefas.push(carregarUsuarios());
    }

    const resultados = await Promise.allSettled(tarefas);
    const falhas = resultados
        .filter(resultado => resultado.status === "rejected")
        .map(resultado => resultado.reason?.message || "Falha ao carregar dados.");

    if (falhas.length > 0) {
        mostrarErro(falhas.join(" "));
    }
}

/* ===== PERFIL E EVENTOS ===== */

function aplicarPermissoes() {
    const usuario = usuarioLogado();

    if (usuario) {
        el("saudacao").textContent = `Olá, ${usuario.nome} · ${usuario.perfil}`;
        el("sidebar-usuario").textContent = usuario.nome;
    }

    if (!podeGerenciar()) {
        el("btn-nova-demanda").hidden = true;
        el("link-nova-demanda").hidden = true;
        el("campo-responsavel").hidden = true;
    }
}

function configurarEventos() {
    el("btn-atualizar").addEventListener("click", carregarTudo);

    el("dias").addEventListener("change", () => {
        limparErro();
        carregarDashboard().catch(erro => mostrarErro(erro.message));
    });

    el("form-filtros").addEventListener("submit", evento => {
        evento.preventDefault();
        limparErro();
        carregarDemandas().catch(erro => mostrarErro(erro.message));
    });

    el("btn-limpar").addEventListener("click", () => {
        el("form-filtros").reset();
        limparErro();
        carregarDemandas().catch(erro => mostrarErro(erro.message));
    });
}

exigirLogin();

if (obterToken()) {
    el("dias").value = String(diasDaUrl());
    aplicarPermissoes();
    configurarEventos();
    carregarTudo();
}
