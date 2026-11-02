// Autor: Pedro Businari Kawamoto
// Tela de Detalhes da Demanda: consome GET /demandas/:id e as rotas de comentários.

const API = "http://localhost:3000";
// O id da demanda vem da URL: detalhes.html?id=1
const id = new URLSearchParams(location.search).get("id");

// Datas chegam como string ISO (Date vira texto no JSON); convertemos para pt-BR
const CAMPOS_DATA = ["dataCriacao", "dataAtualizacao", "prazoFinalizacao"];

// Mostra a mensagem de erro da API na tela (e não só no console)
function mostrarErro(msg) {
  const el = document.getElementById("erro");
  el.textContent = msg;
  el.hidden = false;
}

// Centraliza o tratamento de erros HTTP (400, 404...) para não repetir em cada chamada.
// Se a API estiver fora do ar, o fetch lança "Failed to fetch": traduzimos para o usuário.
async function chamarApi(caminho, opcoes) {
  let resp;
  try {
    resp = await fetch(API + caminho, opcoes);
  } catch {
    throw new Error("Não foi possível conectar ao servidor. Verifique se a API está rodando.");
  }
  const corpo = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(corpo.erro || `Erro ${resp.status}`);
  return corpo;
}

// Preenche a tela com os dados de GET /demandas/:id
async function carregarDemanda() {
  try {
    const d = await chamarApi(`/demandas/${id}`);
    // textContent (e não innerHTML) impede que texto com HTML seja executado (XSS)
    document.getElementById("titulo").textContent = d.titulo;
    document.getElementById("descricao").textContent = d.descricao;

    const campos = ["tipo", "prioridade", "status", "projetoId", "responsavelNome", ...CAMPOS_DATA];
    for (const campo of campos) {
      let valor = d[campo];
      // prazoFinalizacao é opcional: se não existir, a chave nem vem no JSON
      if (valor && CAMPOS_DATA.includes(campo)) {
        valor = new Date(valor).toLocaleDateString("pt-BR");
      }
      document.getElementById(campo).textContent = valor ?? "—";
    }
  } catch (e) {
    mostrarErro(e.message);
  }
}

// Lista os comentários da demanda
async function carregarComentarios() {
  try {
    const lista = await chamarApi(`/demandas/${id}/comentarios`);
    const ul = document.getElementById("comentarios");
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
  const campo = document.getElementById("novo-comentario");
  const texto = campo.value.trim();

  // Validação no cliente (a API valida de novo: uma não substitui a outra)
  if (texto === "") {
    mostrarErro("Escreva um comentário antes de enviar.");
    return;
  }

  try {
    await chamarApi(`/demandas/${id}/comentarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuarioId: usuarioLogadoId(), texto })
    });
    campo.value = "";
    document.getElementById("erro").hidden = true;
    carregarComentarios(); // recarrega a lista com o novo comentário
  } catch (e) {
    mostrarErro(e.message);
  }
}

// O usuário vem do Login (outro integrante); assumo localStorage com a chave "usuario".
// TEMPORÁRIO: usa o id 1 para testar enquanto o Login não estiver pronto.
function usuarioLogadoId() {
  const u = JSON.parse(localStorage.getItem("usuario") || "null");
  return u ? u.id : 1;
}

document.getElementById("btn-comentar").addEventListener("click", enviarComentario);
carregarDemanda();
carregarComentarios();