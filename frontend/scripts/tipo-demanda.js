function mostrarErroTipo(idCampo, idErro, mensagem) { // Função responsável por exibir os erros na tela
    const campo = document.getElementById(idCampo); // Constante que captura e guarda o elemento HTML da caixa de seleção
    const erro = document.getElementById(idErro);   // Constante que captura e guarda o elemento HTML do parágrafo de erro
    
    if (campo && erro) {                  // Se campo e erro estiverem na tela,
        campo.className = "campo-erro";   // Altera a classe do CSS para "campo-erro" - aplica a borda vermelha
        erro.textContent = mensagem;      // Altera o conteúdo de texto para a mensagem de orientação do erro
    }
}

/* Apaga a mensagem de erro e devolve a borda normal ao campo */
function limparErroTipo(idCampo, idErro) {
    const campo = document.getElementById(idCampo); // Constante que captura e guarda o elemento HTML da caixa de seleção
    const erro = document.getElementById(idErro);   // Constante que captura e guarda o elemento HTML do parágrafo de erro
    
    if (campo && erro) {            // Se campo e erro existirem na tela,         
        campo.className = "";       // Limpa a classe CSS, tirando a borda vermelha e  
        erro.textContent = "";      // Faz a mensagem de erro sumir, esvaziando o texto
    }
}


/* ===== VALIDAÇÃO DO CAMPO ===== */
function validarTipoDemanda() {
    let tipoValido = true;    // Variável cujo valor pode mudar (let), diferente de constante (const)
    // Começa o teste presumindo que não tem erros no formulário (tipoValido = true)

    // Constante chamada campoTipo para guardar o elemento HTML <select id="tipo"> 
    const campoTipo = document.getElementById("tipo");
    
    if (campoTipo) {      // Se encontrar o select na tela,
        const tipo = campoTipo.value;   // É criada a const "tipo" para guardar o texto da opção selecionada

        /* --- Tipo: precisa escolher uma das quatro opções --- */
        if (tipo === "") {    // Se o usuário não escolheu nenhuma opção (deixou o select vazio)
            mostrarErroTipo("tipo", "erro-tipo", "Escolha o tipo da demanda.");
            tipoValido = false;   // Executa a função de erro na tela e a variável de controle muda para false

        } else {    // Caso contrário (se o usuário escolheu alguma opção válida),
            limparErroTipo("tipo", "erro-tipo");  // O código limpa os erros antigos que ficaram na tela
        }
    }

    return tipoValido; // Devolve o resultado final do teste (true ou false)
}



// Mapeia o botão salvar para disparar sua validação de forma independente, destravando a tela
const botaoSalvarTipo = document.querySelector(".botao-salvar");  // Procura na página algum elemento com a classe ".botao-salvar"

if (botaoSalvarTipo) {
    botaoSalvarTipo.addEventListener("click", function (event) { // Quando o usuário der um clique no botão, executa a função
        // Se a validação do campo falhar (retornar false), trava o envio do formulário
        if (validarTipoDemanda() === false) {
            event.preventDefault();    // Puxa o "freio de mão" do navegador para parar o envio e não atualizar a página
        }
    });
}