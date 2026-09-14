/* Arthur Lopes Santos Silva - Validações das Telas de Cadastro e Edição de Demanda */

/* Este arquivo é usado pelas duas telas: cadastro-demanda.html e editar-demanda.html.
   As duas têm os mesmos campos, então a validação é a mesma. */


/* ===== FUNÇÕES DE APOIO ===== */

/* Mostra a mensagem de erro embaixo do campo e deixa a borda vermelha.
   idCampo: o id do input ou select
   idErro: o id do parágrafo onde a mensagem aparece
   mensagem: o texto que o usuário vai ler */
   
function mostrarErro(idCampo, idErro, mensagem) {
    document.getElementById(idCampo).className = "campo-erro";
    document.getElementById(idErro).textContent = mensagem;
}

/* Apaga a mensagem de erro e devolve a borda normal ao campo */
function limparErro(idCampo, idErro) {
    document.getElementById(idCampo).className = "";
    document.getElementById(idErro).textContent = "";
}


/* ===== VALIDAÇÃO DO FORMULÁRIO ===== */

/* Esta função é chamada pelo onsubmit do formulário.
   Se ela devolver false, o formulário não é enviado. */
function validarFormulario() {

    /* Começa valendo true. Se algum campo estiver errado, vira false.
       É let porque o valor muda ao longo da função. Os demais são const,
       porque recebem o valor uma vez só e não mudam depois. */
    let formularioValido = true;

    /* Apaga a mensagem de sucesso de uma tentativa anterior */
    document.getElementById("mensagem-sucesso").textContent = "";


    /* --- Título: obrigatório, de 5 a 120 caracteres --- */
    /* O .trim() tira os espaços do começo e do fim, assim só espaço não conta */
    const titulo = document.getElementById("titulo").value.trim();

    if (titulo === "") {
        mostrarErro("titulo", "erro-titulo", "O título é obrigatório.");
        formularioValido = false;
    } else if (titulo.length < 5) {
        mostrarErro("titulo", "erro-titulo", "O título precisa ter pelo menos 5 caracteres.");
        formularioValido = false;
    } else if (titulo.length > 120) {
        mostrarErro("titulo", "erro-titulo", "O título pode ter no máximo 120 caracteres.");
        formularioValido = false;
    } else {
        limparErro("titulo", "erro-titulo");
    }


    /* --- Descrição: obrigatória, com pelo menos 10 caracteres --- */
    const descricao = document.getElementById("descricao").value.trim();

    if (descricao === "") {
        mostrarErro("descricao", "erro-descricao", "A descrição é obrigatória.");
        formularioValido = false;
    } else if (descricao.length < 10) {
        mostrarErro("descricao", "erro-descricao", "Descreva a demanda com pelo menos 10 caracteres.");
        formularioValido = false;
    } else {
        limparErro("descricao", "erro-descricao");
    }


    /* --- Tipo: precisa escolher uma das quatro opções --- */
    /* A opção "Selecione" tem value vazio, então serve para saber se escolheram algo */
    const tipo = document.getElementById("tipo").value;

    if (tipo === "") {
        mostrarErro("tipo", "erro-tipo", "Escolha o tipo da demanda.");
        formularioValido = false;
    } else {
        limparErro("tipo", "erro-tipo");
    }


    /* --- Prioridade: precisa escolher uma das quatro opções --- */
    const prioridade = document.getElementById("prioridade").value;

    if (prioridade === "") {
        mostrarErro("prioridade", "erro-prioridade", "Escolha a prioridade da demanda.");
        formularioValido = false;
    } else {
        limparErro("prioridade", "erro-prioridade");
    }


    /* --- Projeto: toda demanda pertence a um projeto --- */
    const projeto = document.getElementById("projeto").value;

    if (projeto === "") {
        mostrarErro("projeto", "erro-projeto", "Escolha o projeto da demanda.");
        formularioValido = false;
    } else {
        limparErro("projeto", "erro-projeto");
    }


    /* --- Prazo: opcional, mas se for preenchido não pode ser no passado --- */
    const prazo = document.getElementById("prazo").value;

    if (prazo === "") {
        /* Campo vazio é permitido, porque o prazo pode ser definido depois */
        limparErro("prazo", "erro-prazo");
    } else {
        /* new Date() cria uma data. A do prazo vem do campo, a de hoje vem do computador. */
        const dataPrazo = new Date(prazo);
        const hoje = new Date();

        /* Zera o horário de hoje para comparar só o dia, e não a hora */
        hoje.setHours(0, 0, 0, 0);

        if (dataPrazo < hoje) {
            mostrarErro("prazo", "erro-prazo", "O prazo não pode ser uma data que já passou.");
            formularioValido = false;
        } else {
            limparErro("prazo", "erro-prazo");
        }
    }


    /* --- Status: existe só na tela de edição --- */
    /* Na tela de cadastro o getElementById devolve null, porque o campo não existe lá */
    const campoStatus = document.getElementById("status");

    if (campoStatus !== null) {
        if (campoStatus.value === "") {
            mostrarErro("status", "erro-status", "Escolha o status da demanda.");
            formularioValido = false;
        } else {
            limparErro("status", "erro-status");
        }
    }


    /* --- Resultado final --- */
    if (formularioValido === true) {
        document.getElementById("mensagem-sucesso").textContent = "Demanda validada com sucesso.";
    }

    /* Devolve sempre false porque ainda não existe backend para receber os dados.
       Quando a API estiver pronta, aqui é que os dados serão enviados. */
    return false;
}