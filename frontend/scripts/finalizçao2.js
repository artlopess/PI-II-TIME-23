const form = document.getElementById("formFinalizacao");
const status = document.getElementById("status");
const data = document.getElementById("data");
const observacao = document.getElementById("observacao");
const mensagem = document.getElementById("mensagem");
const contador = document.getElementById("contador");

const LIMITE_CARACTERES = 200;

observacao.addEventListener("input", function () {
    const quantidade = observacao.value.length;

    contador.innerText = `${quantidade}/${LIMITE_CARACTERES} caracteres`;

    if (quantidade >= 180) {
        contador.classList.add("limite");
    } else {
        contador.classList.remove("limite");
    }
});

function limparErros() {
    status.classList.remove("campo-erro");
    data.classList.remove("campo-erro");
    observacao.classList.remove("campo-erro");

    mensagem.innerText = "";
    mensagem.classList.remove("erro", "sucesso");
}

function mostrarErro(erros) {
    mensagem.innerText = erros.join(" ");
    mensagem.classList.add("erro");
}

form.addEventListener("submit", function (event) {

    event.preventDefault();

    limparErros();

    let erros = [];

    if (status.value === "") {
        erros.push("Selecione um status.");
        status.classList.add("campo-erro");
    }

    if (data.value === "") {

        erros.push("Informe a data de finalização.");
        data.classList.add("campo-erro");

    } else {

        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = String(hoje.getMonth() + 1).padStart(2, "0");
        const dia = String(hoje.getDate()).padStart(2, "0");

        const dataAtual = `${ano}-${mes}-${dia}`;

        if (data.value > dataAtual) {
            erros.push("A data não pode ser futura.");
            data.classList.add("campo-erro");
        }
    }

    const textoObservacao = observacao.value.trim();

    if (textoObservacao === "") {

        erros.push("Preencha a observação.");
        observacao.classList.add("campo-erro");

    } else if (textoObservacao.length < 10) {

        erros.push("A observação deve ter pelo menos 10 caracteres.");
        observacao.classList.add("campo-erro");

    } else if (textoObservacao.length > LIMITE_CARACTERES) {

        erros.push("A observação não pode ultrapassar 200 caracteres.");
        observacao.classList.add("campo-erro");
    }

    if (erros.length > 0) {
        mostrarErro(erros);
        return;
    }

    mensagem.innerText = "Demanda concluída com sucesso!";
    mensagem.classList.add("sucesso");

    const botao = form.querySelector("button[type='submit']");
    botao.disabled = true;

    setTimeout(function () {

        form.reset();

        contador.innerText = "0/200 caracteres";
        contador.classList.remove("limite");

        botao.disabled = false;

    }, 1500);
});
