// Leonardo Antunes de Souza - Autenticação compartilhada por todas as telas

// Endereço onde o backend está rodando
const URL_API = 'http://localhost:3000';

// Escolhe o armazenamento da sessão ativa.
// "Lembrar-me" usa localStorage; sem ele, sessionStorage. Se sobraram dados nos
// dois (login antigo), prevalece o mais recente — ou a sessão atual, em fallback.
function armazenamentoDaSessao() {
  const temSessao = !!sessionStorage.getItem('token');
  const temLocal = !!localStorage.getItem('token');

  if (!temSessao && !temLocal) {
    return null;
  }
  if (!temSessao) {
    return localStorage;
  }
  if (!temLocal) {
    return sessionStorage;
  }

  const vezSessao = Number(sessionStorage.getItem('sessaoAtualizadaEm') || 0);
  const vezLocal = Number(localStorage.getItem('sessaoAtualizadaEm') || 0);

  if (vezSessao !== vezLocal) {
    return vezSessao > vezLocal ? sessionStorage : localStorage;
  }
  return sessionStorage;
}

// Grava token e usuário no lugar correto e apaga a sessão concorrente.
// Isso evita que um login antigo com "Lembrar-me" sobrescreva o login atual.
function guardarSessao(token, usuario, lembrar) {
  const destino = lembrar ? localStorage : sessionStorage;
  const outro = lembrar ? sessionStorage : localStorage;

  outro.removeItem('token');
  outro.removeItem('usuario');
  outro.removeItem('sessaoAtualizadaEm');

  destino.setItem('token', token);
  destino.setItem('usuario', JSON.stringify(usuario));
  destino.setItem('sessaoAtualizadaEm', String(Date.now()));
}

// Procura o token no armazenamento da sessão ativa
function obterToken() {
  const armazenamento = armazenamentoDaSessao();
  return armazenamento ? armazenamento.getItem('token') : null;
}

// Devolve o usuário logado { id, nome, email, perfil } ou null.
// Lê do MESMO armazenamento do token para nome e permissões nunca divergirem.
function obterUsuario() {
  const armazenamento = armazenamentoDaSessao();
  if (!armazenamento) {
    return null;
  }

  const texto = armazenamento.getItem('usuario');
  if (!texto) {
    return null;
  }

  try {
    return JSON.parse(texto);
  } catch {
    return null;
  }
}

// Se não houver token, volta para o login
function exigirLogin() {
  if (!obterToken()) {
    window.location.href = 'login.html';
  }
}

// Apaga os dados da sessão e volta para o login
function sair() {
  for (const armazenamento of [localStorage, sessionStorage]) {
    armazenamento.removeItem('token');
    armazenamento.removeItem('usuario');
    armazenamento.removeItem('sessaoAtualizadaEm');
  }
  window.location.href = 'login.html';
}

// Faz uma chamada à API já enviando o token.
// Se a API responder 401 (token vencido ou inválido), desloga o usuário.
// Uso: const resposta = await chamarApi('/usuarios');
async function chamarApi(caminho, opcoes = {}) {
  const resposta = await fetch(URL_API + caminho, {
    ...opcoes,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + (obterToken() || ''),
      ...(opcoes.headers || {})
    }
  });

  if (resposta.status === 401) {
    sair();
  }
  return resposta;
}

// Se a tela tiver um elemento com id="botao-sair", ele passa a deslogar
document.addEventListener('DOMContentLoaded', function () {
  const botaoSair = document.getElementById('botao-sair');
  if (botaoSair) {
    botaoSair.addEventListener('click', function (evento) {
      evento.preventDefault();
      sair();
    });
  }
});
