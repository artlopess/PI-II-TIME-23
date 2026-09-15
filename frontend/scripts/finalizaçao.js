const form = document.getElementById("formFinalizacao");
const status = document.getElementById("status");
const data = document.getElementById("data");
const observacao = document.getElementById("observacao");
const mensagem = document.getElementById("mensagem");
const contador = document.getElementById("contador");

observacao.addEventListener("input", function() {
    contador.innerText = observacao.value.length + "/200 caracteres";
});

form.addEventListener("submit", function(event) {
    event.preventDefault();

    mensagem.innerText = "";
    mensagem.classList.remove("erro", "sucesso");

    status.classList.remove("campo-erro");
    data.classList.remove("campo-erro");
    observacao.classList.remove("campo-erro");

    let erros = [];

    if (status.value === "") {
        erros.push("Selecione um status.");
        status.classList.add("campo-erro");
    }

    if (data.value === "") {
        erros.push("Informe a data de finalização.");
        data.classList.add("campo-erro");
    }

    if (observacao.value.trim() === "") {
        erros.push("Preencha a observação.");
        observacao.classList.add("campo-erro");
    } else if (observacao.value.trim().length < 10) {
        erros.push("A observação deve ter pelo menos 10 caracteres.");
        observacao.classList.add("campo-erro");
    }

    let hoje = new Date().toISOString().split("T")[0];

    if (data.value !== "" && data.value > hoje) {
        erros.push("A data não pode ser futura.");
        data.classList.add("campo-erro");
    }

    if (erros.length > 0) {
        mensagem.innerText = erros.join(" ");
        mensagem.classList.add("erro");
        return;
    }

    mensagem.innerText = "Demanda " + status.value.toLowerCase() + " com sucesso!";
    mensagem.classList.add("sucesso");

    form.reset();
    contador.innerText = "0/200 caracteres";
});