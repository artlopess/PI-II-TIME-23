// Autor: Pedro Businari Kawamoto
// Tela de Detalhes da Demanda: consome GET /demandas/:id, o histórico real
// (GET /demandas/:id/historico) e as rotas de comentários.

const API = "http://localhost:3000";
// O id da demanda vem da URL: detalhes.html?id=1
const id = new URLSearchParams(location.search).get("id");

// Datas chegam como string ISO (Date vira texto no JSON); convertemos para pt-BR
const CAMPOS_DATA = ["dataCriacao", "dataAtualizacao", "prazo"];

// Membro só avança Aberta → Em andamento e Em andamento → Em revisão
const TRANSICOES_MEMBRO = {
  "Aberta": ["Em andamento"],
  "Em andamento": ["Em revisão"]
};

// Mesmo limite validado pela API em POST /demandas/:id/comentarios.
const LIMITE_COMENTARIO = 500;

// Guarda a demanda carregada para decidir quais ações aparecem.
let demandaCarregada = null;

function el(idElemento) {
  return document.getElementById(idElemento);
}

// O prazo chega como "AAAA-MM-DD" (sem horário). new Date() o leria como UTC e, no Brasil,
// mostraria um dia a menos (20/10 viraria 19/10); por isso quebramos o texto manualmente.
function formatarData(valor) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    const [ano, mes, dia] = valor.split("-");
    return `${dia}/${mes}/${ano}`;
  }
  return new Date(valor).toLocaleDateString("pt-BR");
}

function formatarDataHora(valor) {
  if (!valor) {
    return "—";
  }
  return new Date(valor).toLocaleString("pt-BR");
}

// Mostra a mensagem de erro da API na tela (e não só no console)
function mostrarErro(msg) {
  const area = el("erro");
  area.textContent = msg;
  area.hidden = false;

  const sucesso = el("sucesso");
  if (sucesso) {
    sucesso.hidden = true;
  }
}

function mostrarSucesso(msg) {
  const area = el("sucesso");
  if (area) {
    area.textContent = msg;
    area.hidden = false;
  }

  el("erro").hidden = true;
}

// Centraliza o tratamento de erros HTTP (400, 404...) para não repetir em cada chamada.
// Se a API estiver fora do ar, o fetch lança "Failed to fetch": traduzimos para o usuário.
async function chamarApiDetalhes(caminho, opcoes) {
  let resp;
  try {
    // Token e perfil vêm de autenticacao.js: a mesma sessão do login atual.
    resp = await fetch(API + caminho, {
      ...(opcoes || {}),
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + (obterToken() || ""),
        ...((opcoes && opcoes.headers) || {})
      }
    });
  } catch {
    throw new Error("Não foi possível conectar ao servidor. Verifique se a API está rodando.");
  }

  if (resp.status === 401) {
    sair();
    throw new Error("Sua sessão expirou. Faça login novamente.");
  }

  const corpo = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(corpo.erro || corpo.mensagem || `Erro ${resp.status}`);
  return corpo;
}

// Preenche a tela com os dados de GET /demandas/:id
async function carregarDemanda() {
  try {
    const d = await chamarApiDetalhes(`/demandas/${id}`);
    demandaCarregada = d;
    // textContent (e não innerHTML) impede que texto com HTML seja executado (XSS)
    el("titulo").textContent = d.titulo;
    el("descricao").textContent = d.descricao;

    const campos = ["tipo", "prioridade", "status", "projetoId", "responsavelNome", ...CAMPOS_DATA];
    for (const campo of campos) {
      let valor = d[campo];
      // prazo é opcional: pode vir null (demanda sem prazo)
      if (valor && CAMPOS_DATA.includes(campo)) {
        valor = formatarData(valor);
      }

      // projetoNome vem da API e é mais legível que o id.
      if (campo === "projetoId" && d.projetoNome) {
        valor = d.projetoNome;
      }

      el(campo).textContent = valor ?? "—";
    }

    configurarFinalizacao();
    configurarStatusMembro(d);
  } catch (e) {
    mostrarErro(e.message);
  }
}

// Lista os comentários da demanda
async function carregarComentarios() {
  try {
    const lista = await chamarApiDetalhes(`/demandas/${id}/comentarios`);
    const ul = el("comentarios");
    ul.innerHTML = "";
    for (const c of lista) {
      const li = document.createElement("li");
      const data = new Date(c.dataCriacao).toLocaleString("pt-BR");
      li.textContent = `${c.usuarioNome} (${data}): ${c.texto}`;
      ul.appendChild(li);
    }
  } catch (e) {
    mostrarErro(e.message);
  }
}

// Envia um novo comentário via POST
async function enviarComentario() {
  const campo = el("novo-comentario");
  const texto = campo.value.trim();

  // Validação no cliente (a API valida de novo: uma não substitui a outra)
  if (texto === "") {
    mostrarErro("Escreva um comentário antes de enviar.");
    return;
  }

  if (texto.length > LIMITE_COMENTARIO) {
    mostrarErro(`O comentário pode ter no máximo ${LIMITE_COMENTARIO} caracteres.`);
    return;
  }

  try {
    await chamarApiDetalhes(`/demandas/${id}/comentarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // O autor é o usuário logado: a API lê o id do token, não do corpo.
      body: JSON.stringify({ texto })
    });
    campo.value = "";
    el("erro").hidden = true;
    carregarComentarios(); // recarrega a lista com o novo comentário
  } catch (e) {
    mostrarErro(e.message);
  }
}

// Renderiza o histórico gravado pelo backend no PUT (item 2.2.7).
// A rota não devolve texto pronto: montamos a frase aqui, no navegador.
const ROTULOS_CAMPO = {
  status: "status",
  responsavel: "responsável",
  prioridade: "prioridade",
  prazo: "prazo de finalização"
};

async function carregarHistorico() {
  try {
    const linhas = await chamarApiDetalhes(`/demandas/${id}/historico`);
    const ul = el("historico");
    ul.innerHTML = "";

    if (!Array.isArray(linhas) || linhas.length === 0) {
      const li = document.createElement("li");
      li.textContent = "Nenhuma alteração registrada até o momento.";
      ul.appendChild(li);
      return;
    }

    for (const linha of linhas) {
      const li = document.createElement("li");
      const campo = ROTULOS_CAMPO[linha.campo] || linha.campo;
      const anterior = linha.valorAnterior ?? "—";
      const novo = linha.valorNovo ?? "—";

      li.textContent =
        `${formatarDataHora(linha.dataHora)} — ${linha.usuarioNome} alterou ${campo}: ${anterior} → ${novo}`;
      ul.appendChild(li);
    }
  } catch (e) {
    mostrarErro(e.message);
  }
}

// Só Admin e Líder podem concluir/cancelar, e apenas enquanto a demanda
// ainda não foi encerrada. O link fica escondido em todos os outros casos.
function configurarFinalizacao() {
  const botao = el("btn-finalizar");
  if (!botao || !demandaCarregada) {
    return;
  }

  const usuario = obterUsuario();
  const encerrada = ["Concluída", "Cancelada"].includes(demandaCarregada.status);

  if ((usuario && usuario.perfil === "Membro da Equipe") || encerrada) {
    botao.hidden = true;
    return;
  }

  botao.href = "finalizacao.html?id=" + encodeURIComponent(id);
  botao.hidden = false;
}

// Membro não tem formulário de edição, mas precisa avançar o status das
// demandas atribuídas a ele. Mostramos só esse controle, com as transições
// permitidas pelo ciclo de vida (a API valida novamente no PUT).
function configurarStatusMembro(demanda) {
  const area = el("area-status-membro");
  if (!area) {
    return;
  }

  const usuario = obterUsuario();
  const permitidas = usuario && usuario.perfil === "Membro da Equipe"
    ? (TRANSICOES_MEMBRO[demanda.status] || [])
    : [];

  if (permitidas.length === 0 || demanda.responsavelId !== usuario?.id) {
    area.hidden = true;
    return;
  }

  const campo = el("status-membro");
  campo.replaceChildren(...permitidas.map(nome => {
    const opcao = document.createElement("option");
    opcao.value = nome;
    opcao.textContent = nome;
    return opcao;
  }));

  area.hidden = false;
}

async function salvarStatusMembro() {
  if (!demandaCarregada) {
    return;
  }

  const campo = el("status-membro");
  const novoStatus = campo.value;
  const permitidas = TRANSICOES_MEMBRO[demandaCarregada.status] || [];

  if (!permitidas.includes(novoStatus)) {
    mostrarErro("Escolha uma transição de status permitida para o seu perfil.");
    return;
  }

  const botao = el("btn-salvar-status");
  botao.disabled = true;

  // O PUT exige o corpo completo; mantemos os demais campos como estão.
  const corpo = {
    titulo: demandaCarregada.titulo,
    descricao: demandaCarregada.descricao,
    tipo: demandaCarregada.tipo,
    prioridade: demandaCarregada.prioridade,
    projetoId: demandaCarregada.projetoId,
    responsavelId: demandaCarregada.responsavelId,
    prazo: demandaCarregada.prazo,
    status: novoStatus
  };

  try {
    await chamarApiDetalhes(`/demandas/${id}`, {
      method: "PUT",
      body: JSON.stringify(corpo)
    });

    mostrarSucesso(`Status alterado para ${novoStatus}.`);
    await carregarDemanda();
    await carregarHistorico();
  } catch (e) {
    mostrarErro(e.message);
  } finally {
    botao.disabled = false;
  }
}

// Tela protegida: exige login antes de qualquer requisição.
function iniciarTela() {
  exigirLogin();

  if (!obterToken()) {
    return;
  }

  el("btn-comentar").addEventListener("click", enviarComentario);
  el("btn-salvar-status").addEventListener("click", salvarStatusMembro);

  carregarDemanda();
  carregarComentarios();
  carregarHistorico();
}

window.addEventListener("load", iniciarTela);
