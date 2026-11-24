// Gabriel Augusto Jorge - Finalização e cancelamento de demandas
// Antes este arquivo só exibia "Demanda concluída com sucesso!" sem chamar a API
// e não era carregado por nenhuma página. Agora ele:
// 1. carrega a demanda em GET /demandas/:id;
// 2. aplica as regras de perfil e de ciclo de vida;
// 3. grava a nova situação com PUT /demandas/:id;
// 4. registra a observação com POST /demandas/:id/comentarios.

// A demanda vem da URL: finalizacao.html?id=1
const ID_DEMANDA = new URLSearchParams(location.search).get("id");
const LIMITE_CARACTERES = 200;

let demandaAtual = null;


/* ===== AUXILIARES ===== */

function elemento(id) {
    return document.getElementById(id);
}

function mensagemDaApi(dados, padrao) {
    if (dados === null || dados === undefined) {
        return padrao;
    }
    return dados.mensagem || dados.erro || padrao;
}

function mostrarMensagem(texto, tipo) {
    const area = elemento("mensagem");
    area.textContent = texto || "";
    area.hidden = !texto;
    area.classList.remove("erro", "sucesso");
    if (tipo) {
        area.classList.add(tipo);
    }
}

function erroApi(dados, status) {
    const base = mensagemDaApi(dados, "Erro " + status + " na API.");
    if (dados && Array.isArray(dados.erros) && dados.erros.length > 0) {
        return base + " " + dados.erros.join(" ");
    }
    return base;
}

function dataDeHoje() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");
    return ano + "-" + mes + "-" + dia;
}

function formatarData(texto) {
    const [ano, mes, dia] = texto.split("-");
    return dia + "/" + mes + "/" + ano;
}

// Reenvia o token em todas as chamadas, como exigem as rotas de demanda.
async function requisitarApi(caminho, opcoes = {}) {
    let resposta;

    try {
        resposta = await fetch(URL_API + caminho, {
            ...opcoes,
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + (obterToken() || ""),
                ...(opcoes.headers || {})
            }
        });
    } catch {
        throw new Error("Não foi possível conectar ao servidor. Confira se a API está rodando em " + URL_API + ".");
    }

    const dados = await resposta.json().catch(() => null);

    if (resposta.status === 401) {
        sair();
        throw new Error("Sua sessão expirou. Entre novamente para continuar.");
    }

    if (!resposta.ok) {
        throw new Error(erroApi(dados, resposta.status));
    }

    return dados;
}

// Espelha as transições do backend: só é possível concluir a partir de
// "Em revisão". Cancelar é permitido para qualquer demanda não concluída.
function transicoesDisponiveis(statusAtual) {
    if (statusAtual === "Concluída" || statusAtual === "Cancelada") {
        return [];
    }
    return statusAtual === "Em revisão" ? ["Concluída", "Cancelada"] : ["Cancelada"];
}


/* ===== CARREGAMENTO DA TELA ===== */

async function carregarDemanda() {
    try {
        demandaAtual = await requisitarApi("/demandas/" + encodeURIComponent(ID_DEMANDA));

        elemento("titulo-demanda").textContent = demandaAtual.titulo;
        elemento("status-atual").textContent = demandaAtual.status;

        const opcoes = transicoesDisponiveis(demandaAtual.status);
        const campoStatus = elemento("status");
        campoStatus.innerHTML = '<option value="">Selecione...</option>';

        for (const nome of opcoes) {
            const opcao = document.createElement("option");
            opcao.value = nome;
            opcao.textContent = nome;
            campoStatus.appendChild(opcao);
        }

        if (opcoes.length === 1) {
            campoStatus.value = opcoes[0];
        }

        if (opcoes.length === 0) {
            elemento("ajuda-status").textContent = "Esta demanda já foi encerrada e não pode mais ser alterada.";
            elemento("formFinalizacao").hidden = true;
        } else if (opcoes.indexOf("Concluída") === -1) {
            elemento("ajuda-status").textContent =
                "Para concluir, a demanda precisa estar Em revisão. Por enquanto só é possível cancelá-la.";
        }

        const campoData = elemento("data");
        campoData.max = dataDeHoje();
        campoData.value = dataDeHoje();

    } catch (erro) {
        mostrarMensagem(erro.message, "erro");
        elemento("formFinalizacao").hidden = true;
    }
}

function iniciarTela() {
    exigirLogin();

    if (!ID_DEMANDA) {
        mostrarMensagem("Nenhuma demanda foi informada. Volte para a listagem e escolha uma demanda.", "erro");
        elemento("formFinalizacao").hidden = true;
        return;
    }

    elemento("link-voltar").href = "detalhes.html?id=" + encodeURIComponent(ID_DEMANDA);

    const usuario = obterUsuario();

    if (usuario && usuario.perfil === "Membro da Equipe") {
        mostrarMensagem("Seu perfil não pode finalizar nem cancelar demandas.", "erro");
        elemento("formFinalizacao").hidden = true;
        return;
    }

    carregarDemanda();
}


/* ===== VALIDAÇÃO E ENVIO ===== */

function limparErros() {
    elemento("status").classList.remove("campo-erro");
    elemento("data").classList.remove("campo-erro");
    elemento("observacao").classList.remove("campo-erro");
    mostrarMensagem("");
}

async function finalizarDemanda(evento) {
    evento.preventDefault();
    limparErros();

    const status = elemento("status").value;
    const data = elemento("data").value;
    const observacao = elemento("observacao").value.trim();
    const erros = [];

    if (transicoesDisponiveis(demandaAtual.status).indexOf(status) === -1) {
        erros.push("Escolha uma situação válida para o status atual da demanda.");
        elemento("status").classList.add("campo-erro");
    }

    if (data === "") {
        erros.push("Informe a data da finalização.");
        elemento("data").classList.add("campo-erro");
    } else if (data > dataDeHoje()) {
        erros.push("A data não pode ser futura.");
        elemento("data").classList.add("campo-erro");
    }

    if (observacao === "") {
        erros.push("Preencha a observação.");
        elemento("observacao").classList.add("campo-erro");
    } else if (observacao.length < 10) {
        erros.push("A observação deve ter pelo menos 10 caracteres.");
        elemento("observacao").classList.add("campo-erro");
    } else if (observacao.length > LIMITE_CARACTERES) {
        erros.push("A observação não pode ultrapassar 200 caracteres.");
        elemento("observacao").classList.add("campo-erro");
    }

    if (erros.length > 0) {
        mostrarMensagem(erros.join(" "), "erro");
        return;
    }

    if (status === "Cancelada" && !window.confirm("Cancelar esta demanda? Essa ação não poderá ser desfeita.")) {
        return;
    }

    const botao = elemento("btn-finalizar-demanda");
    botao.disabled = true;
    mostrarMensagem("Gravando a alteração...", "");

    /* O PUT exige o corpo completo: reenviamos os dados carregados no início
       e trocamos apenas o status. Quem define a data de atualização é a API. */
    const corpo = {
        titulo: demandaAtual.titulo,
        descricao: demandaAtual.descricao,
        tipo: demandaAtual.tipo,
        prioridade: demandaAtual.prioridade,
        projetoId: demandaAtual.projetoId,
        responsavelId: demandaAtual.responsavelId,
        prazo: demandaAtual.prazo,
        status: status
    };

    try {
        await requisitarApi("/demandas/" + encodeURIComponent(ID_DEMANDA), {
            method: "PUT",
            body: JSON.stringify(corpo)
        });

        /* A observação não é um campo da tabela de demandas: ela vira um
           comentário autenticado, com o autor vindo do token. */
        let aviso = "";
        try {
            const acao = status === "Concluída" ? "Finalização" : "Cancelamento";
            await requisitarApi("/demandas/" + encodeURIComponent(ID_DEMANDA) + "/comentarios", {
                method: "POST",
                body: JSON.stringify({
                    texto: acao + " em " + formatarData(data) + " — " + observacao
                })
            });
        } catch (erroComentario) {
            aviso = " O status foi alterado, mas não foi possível registrar a observação como comentário: " + erroComentario.message;
        }

        const msg = status === "Concluída"
            ? "Demanda concluída com sucesso."
            : "Demanda cancelada com sucesso.";

        mostrarMensagem(msg + aviso, "sucesso");

        elemento("formFinalizacao").querySelectorAll("input, select, textarea, button").forEach(function (campo) {
            campo.disabled = true;
        });

    } catch (erro) {
        mostrarMensagem(erro.message, "erro");
        botao.disabled = false;
    }
}

function configurarContador() {
    const campo = elemento("observacao");
    const contador = elemento("contador");

    campo.addEventListener("input", function () {
        const quantidade = campo.value.length;
        contador.textContent = quantidade + "/" + LIMITE_CARACTERES + " caracteres";
        contador.classList.toggle("limite", quantidade >= 180);
    });
}

elemento("formFinalizacao").addEventListener("submit", finalizarDemanda);
configurarContador();
window.addEventListener("load", iniciarTela);
