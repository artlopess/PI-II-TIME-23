// Gabriel Augusto Jorge --> status de demandas// 

const STATUS_VALIDOS =["aberta","em_andamento","em_revisao","concluida","cancelada"];

function validarStatus() {
    const campoStatus = document.getElementById("status");
    const erroStatus = document.getElementById("erro-status");
    const valor = campoStatus.value;

    if (valor == "" || !STATUS_VALIDOS.includes(valor)) {
        erroStatus.textContent = "Selecione um status válido";
        campoStatus.classList.add("caixa-erro");
        return false;
    }

    erroStatus.textContent="";
    campoStatus.classList.remove("caixa-erro");
    return true;
}

const form = document.getElementById("form-editar-demanda");

form.addEventListener("submit", function(evento) {
    const statusOK = validarStatus();
    
    if(!statusOK){
        evento.preventDefault();// Responsavel por impedir o aviso, caso o status seja valido
    }
}
);

// validação em tmepo real, assim que o usuario troca a opção, ja confere
document.getElementById("status").addEventListener("change", validarStatus);