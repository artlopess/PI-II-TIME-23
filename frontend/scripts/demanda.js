/* Arthur Lopes Santos Silva - Telas de Cadastro e Edição de Demanda */

/* Este arquivo é usado pelas duas telas: cadastro-demanda.html e editar-demanda.html.
   Ele faz três coisas:
   1. carrega os projetos e os responsáveis da API quando a página abre;
   2. valida os campos antes de enviar;
   3. envia os dados para a API e mostra na tela a resposta dela.

   A tela sabe que é edição quando a URL tem ?id=, por exemplo:
   editar-demanda.html?id=1 */


/* Endereço do servidor da API */
const URL_API = "http://localhost:3000";


/* ===== FUNÇÕES DE APOIO ===== */

/* Mostra a mensagem de erro embaixo do campo e deixa a borda vermelha. */
function mostrarErro(idCampo, idErro, mensagem) {
    document.getElementById(idCampo).className = "campo-erro";
    document.getElementById(idErro).textContent = mensagem;
}

/* Apaga a mensagem de erro e devolve a borda normal ao campo */
function limparErro(idCampo, idErro) {
    document.getElementById(idCampo).className = "";
    document.getElementById(idErro).textContent = "";
}

/* Mostra no topo do formulário um aviso vindo da API (erro 400, 404, servidor fora).
   O documento da Reunião 5 pede que esses erros apareçam para o usuário,
   e não só no console do navegador. */
function mostrarAviso(mensagem) {
    document.getElementById("aviso-api").textContent = mensagem;
    document.getElementById("mensagem-sucesso").textContent = "";
}

/* Mostra a mensagem verde de sucesso */
function mostrarSucesso(mensagem) {
    document.getElementById("mensagem-sucesso").textContent = mensagem;
    document.getElementById("aviso-api").textContent = "";
}

/* Transforma a data que a API devolve (2026-10-26T23:11:02.098Z)
   no formato que o usuário lê (26/10/2026 20:11). */
function formatarDataHora(texto) {
    if (texto === null || texto === undefined || texto === "") {
        return "—";
    }

    const data = new Date(texto);

    const dia = String(data.getDate()).padStart(2, "0");
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const ano = data.getFullYear();
    const hora = String(data.getHours()).padStart(2, "0");
    const minuto = String(data.getMinutes()).padStart(2, "0");

    return dia + "/" + mes + "/" + ano + " " + hora + ":" + minuto;
}

/* Preenche as datas de criação e de última atualização na tela de edição.
   Na tela de cadastro esses campos não existem, por isso a checagem de null. */
function mostrarDatas(demanda) {
    const campoCriacao = document.getElementById("data-criacao");
    const campoAtualizacao = document.getElementById("data-atualizacao");

    if (campoCriacao !== null) {
        campoCriacao.textContent = formatarDataHora(demanda.dataCriacao);
    }

    if (campoAtualizacao !== null) {
        campoAtualizacao.textContent = formatarDataHora(demanda.dataAtualizacao);
    }
}

/* Lê o id da demanda na URL. Devolve null quando a tela é de cadastro. */
function pegarIdDaUrl() {
    const parametros = new URLSearchParams(window.location.search);
    return parametros.get("id");
}


/* ===== CARREGAR DADOS DA API ===== */

/* Preenche o campo Projeto com os projetos que vêm de GET /projetos.
   O documento da Reunião 5 exige que esses dados venham do banco,
   e não fiquem fixos no HTML. */
async function carregarProjetos() {
    const campo = document.getElementById("projeto");

    try {
        const resposta = await fetch(URL_API + "/projetos");

        if (resposta.ok === false) {
            throw new Error("A API respondeu " + resposta.status);
        }

        const dados = await resposta.json();

        /* Limpa a lista e deixa só a opção inicial */
        campo.innerHTML = '<option value="">Selecione um projeto</option>';

        /* Cria uma opção para cada projeto recebido */
        for (const projeto of dados.projetos) {
            const opcao = document.createElement("option");
            opcao.value = projeto.id;
            opcao.textContent = projeto.nome;
            campo.appendChild(opcao);
        }

    } catch (erro) {
        mostrarAviso("Não foi possível carregar os projetos. Confira se o servidor está rodando em " + URL_API + ".");
    }
}

/* Preenche o campo Responsável com os usuários de GET /usuarios.

   Essa rota é de outro integrante. Enquanto ela não existir, a função
   mantém a lista que já está no HTML e não mostra erro ao usuário,
   para a tela continuar utilizável. */
async function carregarResponsaveis() {
    const campo = document.getElementById("responsavel");

    try {
        const resposta = await fetch(URL_API + "/usuarios");

        if (resposta.ok === false) {
            return;
        }

        const dados = await resposta.json();

        campo.innerHTML = '<option value="">Sem responsável por enquanto</option>';

        for (const usuario of dados.usuarios) {
            const opcao = document.createElement("option");
            opcao.value = usuario.id;
            opcao.textContent = usuario.nome;
            campo.appendChild(opcao);
        }

    } catch (erro) {
        /* Rota ainda não disponível: mantém a lista do HTML */
        console.log("GET /usuarios ainda não disponível.");
    }
}

/* Na tela de edição, busca a demanda em GET /demandas/:id e preenche os campos.

   Essa rota também é de outro integrante. Enquanto ela não existir, a tela
   mantém os valores de exemplo do HTML, para ser possível testar o PUT. */
async function carregarDemanda(id) {
    try {
        const resposta = await fetch(URL_API + "/demandas/" + id);

        if (resposta.ok === false) {
            mostrarAviso("Não foi possível carregar os dados desta demanda. Preencha os campos antes de salvar.");
            console.log("GET /demandas/" + id + " respondeu " + resposta.status);
            return;
        }

        const dados = await resposta.json();
        const demanda = dados.demanda;

        document.getElementById("titulo").value = demanda.titulo;
        document.getElementById("descricao").value = demanda.descricao;
        document.getElementById("tipo").value = demanda.tipo;
        document.getElementById("prioridade").value = demanda.prioridade;
        document.getElementById("projeto").value = demanda.projetoId;
        document.getElementById("responsavel").value = demanda.responsavelId || "";
        document.getElementById("prazo").value = demanda.prazo || "";
        document.getElementById("status").value = demanda.status;

        mostrarDatas(demanda);

    } catch (erro) {
        console.log("GET /demandas/:id ainda não disponível.");
    }
}


/* ===== QUANDO A PÁGINA ABRE ===== */

/* O addEventListener manda o navegador rodar iniciarTela() assim que
   a página terminar de carregar. */
window.addEventListener("load", iniciarTela);

async function iniciarTela() {
    /* O await faz uma coisa esperar a outra terminar */
    await carregarProjetos();
    await carregarResponsaveis();

    /* Só na tela de edição existe id na URL */
    const id = pegarIdDaUrl();

    if (id !== null) {
        await carregarDemanda(id);
    }
}


/* ===== VALIDAÇÃO DO FORMULÁRIO ===== */

/* Confere os campos antes de enviar. Devolve true quando está tudo certo. */
function validarFormulario() {

    /* Começa valendo true. Se algum campo estiver errado, vira false. */
    let formularioValido = true;

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

    return formularioValido;
}


/* ===== ENVIO PARA A API ===== */

/* Monta um objeto com o que o usuário preencheu.
   Os nomes aqui são os mesmos que a API espera no corpo da requisição. */
function montarDemanda() {
    const campoStatus = document.getElementById("status");

    const demanda = {
        titulo: document.getElementById("titulo").value.trim(),
        descricao: document.getElementById("descricao").value.trim(),
        tipo: document.getElementById("tipo").value,
        prioridade: document.getElementById("prioridade").value,
        projetoId: document.getElementById("projeto").value,
        responsavelId: document.getElementById("responsavel").value,
        prazo: document.getElementById("prazo").value
    };

    /* O status só é enviado na tela de edição */
    if (campoStatus !== null) {
        demanda.status = campoStatus.value;
    }

    return demanda;
}

/* Envia para a API. Usa POST quando é cadastro e PUT quando é edição. */
async function enviarParaApi() {

    const id = pegarIdDaUrl();
    const demanda = montarDemanda();

    /* Cadastro: POST /demandas. Edição: PUT /demandas/:id */
    let endereco = URL_API + "/demandas";
    let metodo = "POST";

    if (id !== null) {
        endereco = URL_API + "/demandas/" + id;
        metodo = "PUT";
    }

    try {
        const resposta = await fetch(endereco, {
            method: metodo,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(demanda)
        });

        const dados = await resposta.json();

        /* 201 (criado) e 200 (alterado) são as respostas de sucesso */
        if (resposta.status === 201 || resposta.status === 200) {
            mostrarSucesso(dados.mensagem);

            /* A data de última atualização muda a cada alteração salva,
               e quem define o valor é o servidor (item 2.2.8 do escopo). */
            mostrarDatas(dados.demanda);

            /* Depois de cadastrar, limpa o formulário para o próximo cadastro */
            if (metodo === "POST") {
                document.querySelector("form").reset();
            }

            return;
        }

        /* A API recusou. Mostra os erros que ela devolveu, um embaixo do outro. */
        if (dados.erros !== undefined) {
            mostrarAviso(dados.mensagem + " " + dados.erros.join(" "));
        } else {
            mostrarAviso(dados.mensagem);
        }

    } catch (erro) {
        /* Cai aqui quando o servidor está fora do ar */
        mostrarAviso("Não foi possível falar com o servidor. Confira se ele está rodando em " + URL_API + ".");
    }
}


/* ===== CLIQUE NO BOTÃO SALVAR ===== */

/* Esta função é chamada pelo onsubmit do formulário.
   Primeiro valida na tela, depois envia para a API. */
function enviarFormulario() {

    /* Limpa as mensagens da tentativa anterior */
    document.getElementById("aviso-api").textContent = "";
    document.getElementById("mensagem-sucesso").textContent = "";

    /* Se a validação da tela falhar, nem chega a chamar a API */
    if (validarFormulario() === false) {
        return false;
    }

    /* O envio acontece em segundo plano, porque depende da resposta do servidor */
    enviarParaApi();

    /* Devolve false para o navegador não recarregar a página */
    return false;
}
