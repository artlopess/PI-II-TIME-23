// Leonardo Antunes de Souza - Autenticação compartilhada por todas as telas

// Endereço onde o backend está rodando
const URL_API = 'http://localhost:3000';

// Procura o token nos dois lugares possíveis (Lembrar-me usa localStorage)
function obterToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

// Devolve o usuário logado { id, nome, email, perfil } ou null
function obterUsuario() {
  const texto = localStorage.getItem('usuario') || sessionStorage.getItem('usuario');
  return texto ? JSON.parse(texto) : null;
}

// Se não houver token, volta para o login
function exigirLogin() {
  if (!obterToken()) {
    window.location.href = 'login.html';
  }
}

// Apaga os dados da sessão e volta para o login
function sair() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('usuario');
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
      'Authorization': 'Bearer ' + obterToken(),
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