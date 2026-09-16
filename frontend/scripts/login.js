// Leonardo Antunes de Souza - Validações da Tela de Login

// Regra de senha usada aqui: mínimo de 9 caracteres.
// - Mínimo de 9 caracteres
// - Pelo menos 1 letra maiúscula
// - Pelo menos 1 letra minúscula
// - Pelo menos 1 número
// - Pelo menos 1 caractere especial (ex: ! @ # $ % & *)

const MIN_SENHA = 9;

// Pega os elementos do HTML que vamos usar
const form = document.getElementById('form-login');
const campoEmail = document.getElementById('email');
const campoSenha = document.getElementById('senha');
const erroEmail = document.getElementById('erro-email');
const erroSenha = document.getElementById('erro-senha');
const erroGeral = document.getElementById('erro-geral');
const botaoOlho = document.getElementById('botao-olho');

// Funções de validação
function emailFoiPreenchido(){
  // .trim() remove espaços em branco do começo/fim,
  return campoEmail.value.trim() !== '';
}

function emailTemFormatoValido(){
    const padraoEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Exige o formato de email, exemplo estudante@gmail.com
  return padraoEmail.test(campoEmail.value.trim());
}

function senhaFoiPreenchida() {
  return campoSenha.value !== '';
}

function senhaTemTamanhoMinimo() {
  return campoSenha.value.length >= MIN_SENHA;
}

function senhaTemMaiuscula() {
  return /[A-Z]/.test(campoSenha.value);
}

function senhaTemMinuscula() {
  return /[a-z]/.test(campoSenha.value);
}
 
function senhaTemNumero() {
  return /[0-9]/.test(campoSenha.value);
}
 
function senhaTemCaractereEspecial() {
  // Qualquer coisa que não seja letra, número ou espaço conta como especial
  return /[^A-Za-z0-9\s]/.test(campoSenha.value);
}

// Funções para mostrar/esconder mensagens de erro 

function mostrarErro(elementoErro, elementoInput, mensagem) {
  elementoErro.textContent = mensagem;
  elementoErro.classList.add('mostrar');
  elementoInput.classList.add('input-erro');
}
 
function esconderErro(elementoErro, elementoInput) {
  elementoErro.textContent = '';
  elementoErro.classList.remove('mostrar');
  elementoInput.classList.remove('input-erro');
}

// Validação do campo de e-mail

function validarEmail() {
  if (!emailFoiPreenchido()) {
    mostrarErro(erroEmail, campoEmail, 'Informe o e-mail.');
    return false;
  }
 
  if (!emailTemFormatoValido()) {
    mostrarErro(erroEmail, campoEmail, 'Digite um e-mail válido (ex: nome@empresa.com).');
    return false;
  }
 
  esconderErro(erroEmail, campoEmail);
  return true;
}

// Validação do campo de senha 
function validarSenha(){
    if (!senhaFoiPreenchida()) {
            mostrarErro(erroSenha, campoSenha, 'Informe a senha.'); 
            return false;
    }
    
    if (!senhaTemTamanhoMinimo()) {
            mostrarErro(erroSenha, campoSenha, `A senha deve ter no mínimo ${MIN_SENHA} caracteres.`);
            return false;
    }

    if (!senhaTemMaiuscula()) {
        mostrarErro(erroSenha, campoSenha, 'A senha deve ter pelo menos 1 letra maiúscula.');
        return false;
    }
    
    if (!senhaTemMinuscula()) {
        mostrarErro(erroSenha, campoSenha, 'A senha deve ter pelo menos 1 letra minúscula.');
        return false;
    }
    
    if (!senhaTemNumero()) {
        mostrarErro(erroSenha, campoSenha, 'A senha deve ter pelo menos 1 número.');
        return false;
    }
    
    if (!senhaTemCaractereEspecial()) {
        mostrarErro(erroSenha, campoSenha, 'A senha deve ter pelo menos 1 caractere especial (ex: ! @ # $).');
        return false;
    }
    esconderErro(erroSenha, campoSenha);
    return true;
}

// Quando o formulário é enviado:
form.addEventListener('submit', function (evento) {
  // Impede o navegador de recarregar a página, que é o comportamento
  evento.preventDefault();
 
  // Esconde a mensagem geral de tentativas anteriores
  erroGeral.textContent = '';
  erroGeral.classList.remove('mostrar');
 
  const emailValido = validarEmail();
  const senhaValida = validarSenha();

  if (!emailValido || !senhaValida) {
    // Existe pelo menos um campo com problema de formato/preenchimento.
    return;
  }

  const emailDigitado = campoEmail.value.trim();
  const senhaDigitada = campoSenha.value;
 
  // Isso vai serr removido assim que o back-end de autenticação existir(teste).
  const emailDeTeste = 'usuario@exemplo.com';
  const senhaDeTeste = 'senha1234';
 
  if (emailDigitado === emailDeTeste && senhaDigitada === senhaDeTeste) {
    alert('Login realizado com sucesso! (simulação — ainda sem back-end)');
  } else {
    erroGeral.textContent = 'Usuário ou senha inválidos.';
    erroGeral.classList.add('mostrar');
  }
});

// Mostrar/esconder senha
botaoOlho.addEventListener('click', function () {
  const escondida = campoSenha.type === 'password';
  campoSenha.type = escondida ? 'text' : 'password';
  botaoOlho.textContent = escondida ? '🙈' : '👁';
  botaoOlho.setAttribute('aria-label', escondida ? 'Esconder senha' : 'Mostrar senha');
});

// Atualiza a lista de regras a cada tecla digitada,
// reaproveitando as mesmas funções usadas na validação do envio
campoSenha.addEventListener('input', function () {
  document.getElementById('regra-tamanho').classList.toggle('valida', senhaTemTamanhoMinimo());
  document.getElementById('regra-maiuscula').classList.toggle('valida', senhaTemMaiuscula());
  document.getElementById('regra-minuscula').classList.toggle('valida', senhaTemMinuscula());
  document.getElementById('regra-numero').classList.toggle('valida', senhaTemNumero());
  document.getElementById('regra-especial').classList.toggle('valida', senhaTemCaractereEspecial());
});

// Atualiza a lista de regras e a barra de força a cada tecla digitada,
// reaproveitando as mesmas funções usadas na validação do envio
campoSenha.addEventListener('input', function () {
  document.getElementById('regra-tamanho').classList.toggle('valida', senhaTemTamanhoMinimo());
  document.getElementById('regra-maiuscula').classList.toggle('valida', senhaTemMaiuscula());
  document.getElementById('regra-minuscula').classList.toggle('valida', senhaTemMinuscula());
  document.getElementById('regra-numero').classList.toggle('valida', senhaTemNumero());
  document.getElementById('regra-especial').classList.toggle('valida', senhaTemCaractereEspecial());

  // Calcula quantas regras foram cumpridas e atualiza a barra de força
  const totalRegras = 5;
  const regrasCumpridas = [
    senhaTemTamanhoMinimo(),
    senhaTemMaiuscula(),
    senhaTemMinuscula(),
    senhaTemNumero(),
    senhaTemCaractereEspecial()
  ].filter(Boolean).length;

  const barra = document.getElementById('forca-senha-preenchimento');
  const porcentagem = (regrasCumpridas / totalRegras) * 100;
  barra.style.width = porcentagem + '%';

  if (porcentagem <= 40) {
    barra.style.backgroundColor = 'rgb(229, 72, 77)'; // vermelho
  } else if (porcentagem <= 80) {
    barra.style.backgroundColor = 'rgb(224, 185, 78)'; // amarelo
  } else {
    barra.style.backgroundColor = 'rgb(59, 59, 163)'; // roxo do sistema
  }
});