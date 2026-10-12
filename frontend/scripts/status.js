// Gabriel Augusto Jorge --> status de demandas// 

const STATUS_VALIDOS = ["aberta", "em_andamento", "em_revisao", "concluida", "cancelada"];

function validarStatus() {
    const campoStatus = document.getElementById("status");
    const erroStatus = document.getElementById("erro-status");
    const valor = campoStatus.value;

    if (valor == "" || !STATUS_VALIDOS.includes(valor)) {
        erroStatus.textContent = "Selecione um status válido";
        campoStatus.classList.add("caixa-erro");
        return false;
    }

    erroStatus.textContent = "";
    campoStatus.classList.remove("caixa-erro");
    return true;
}

function validarTexto(idCampo, idErro, minCaracteres, obrigatorio) {
    const campo = document.getElementById(idCampo);
    const erro = document.getElementById(idErro);
    const valor = campo.value.trim();

    if (valor === "") {
        if (obrigatorio) {
            erro.textContent = "Este campo é obrigatório.";
            campo.classList.add("caixa-erro");
            return false;
        }
        erro.textContent = "";
        campo.classList.remove("caixa-erro");
        return true;
    }

    if (valor.length < minCaracteres) {
        erro.textContent = `Digite pelo menos ${minCaracteres} caracteres.`;
        campo.classList.add("caixa-erro");
        return false;
    }

    erro.textContent = "";
    campo.classList.remove("caixa-erro");
    return true;
}

function validarTitulo() {
    return validarTexto("titulo", "erro-titulo", 10, true);
}

function validarDescricao() {
    return validarTexto("descricao", "erro-descricao", 10, false);
}

function validarProjeto() {
    return validarTexto("projeto", "erro-projeto", 10, true);
}

function validarResponsavel() {
    return validarTexto("responsavel", "erro-responsavel", 5, false);
}

const form = document.getElementById("form-editar-demanda");

form.addEventListener("submit", function(evento) {
    const statusOK = validarStatus();
    const tituloOK = validarTitulo();
    const descricaoOK = validarDescricao();
    const projetoOK = validarProjeto();
    const responsavelOK = validarResponsavel();

    if (!statusOK || !tituloOK || !descricaoOK || !projetoOK || !responsavelOK) {
        evento.preventDefault(); // impede o envio se algum campo estiver inválido
    }
});

// validação em tempo real
document.getElementById("status").addEventListener("change", validarStatus);
document.getElementById("titulo").addEventListener("input", validarTitulo);
document.getElementById("descricao").addEventListener("input", validarDescricao);
document.getElementById("projeto").addEventListener("input", validarProjeto);
document.getElementById("responsavel").addEventListener("input", validarResponsavel);