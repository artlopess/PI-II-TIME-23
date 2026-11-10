function mostrarErroPrioridade(idCampo, idErro, mensagem) { //exibir os erros na tela
    const campo = document.getElementById(idCampo); 
    const erro = document.getElementById(idErro);   
    
    if (campo && erro) {                  //se campo e erro estiverem na tela,
        campo.className = "campo-erro";   //altera classe do css para "campo-erro"- aplica borda vermelha
        erro.textContent = mensagem;      //altera conteudo de texto para uma mensagem de erro
    }
}

/* Apaga a mensagem de erro e devolve a borda normal ao campo */
function limparErroPrioridade(idCampo, idErro) {
    const campo = document.getElementById(idCampo);
    const erro = document.getElementById(idErro);   
    
    if (campo && erro) {            //se campo e erro existirem,         
        campo.className = "";       //limpa a classe css, tirando a borda vermelha e  
        erro.textContent = "";      //faz a mensagem de erro sumir, esvaziando o texto
    }
}


/* ===== VALIDAÇÃO DO CAMPO ===== */
function validarPrioridadeDemanda() {
    let prioridadeValida = true;    //variavel cujo valor pode mudar, diferente deconst
    //comeca o teste presumindo que não tem erros no formulário (prioridadeValida = true)

    //constante chamada campoPrioridade para guardar o elemento <select id="prioridade"> 
    const campoPrioridade = document.getElementById("prioridade");
    
    if (campoPrioridade) {      //se encontrar o select na tela,
        const prioridade = campoPrioridade.value;   //é criado a coinst "prioridade" para guardar as opções

        /* --- Prioridade: precisa escolher uma das quatro opções --- */
        if (prioridade === "") {    //se o usuario nao escolheu nada
            mostrarErroPrioridade("prioridade", "erro-prioridade", "Escolha a prioridade da demanda.");
            prioridadeValida = false;   //imprime mensagem de erro e a variave muda para false

        } else {    //se o  usuario escolheu alguma opção,
            limparErroPrioridade("prioridade", "erro-prioridade");  //o codigo limpaos erros que ficaram na tela
        }
    }

    return prioridadeValida;
}



// Mapeia o botão salvar para disparar sua validação de forma independente, destravando a tela
const botaoSalvarPrioridade = document.querySelector(".botao-salvar");  //procura algum elemento com a classe ".botao-salvar"

if (botaoSalvarPrioridade) {
    botaoSalvarPrioridade.addEventListener("click", function (evento) { //quando usuario der um clique no botao
        // Se a validação do campo falhar, trava o envio do formulário
        if (validarPrioridadeDemanda() === false) {
            evento.preventDefault();    //preventdefault para tudo
        }
    });
}