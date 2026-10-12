/* Arthur Lopes Santos Silva - Rota de Cadastro de Demanda (POST /demandas) */

/* Esta rota recebe os dados do formulario de cadastro e registra a demanda.
   Toda validacao feita aqui e repetida do lado do servidor de proposito:
   a validacao em JavaScript da tela nao substitui a validacao da API,
   porque a requisicao pode vir de fora do sistema. */

import { Router, Request, Response } from "express";
import { demandas, projetos, usuarios, Demanda, proximoIdDemanda } from "../data/dados";

/* O Router junta as rotas deste arquivo para o servidor usar depois */
const rotas = Router();


/* ===== VALORES PERMITIDOS ===== */
/* Os unicos tipos e prioridades aceitos, conforme o documento de escopo */
const TIPOS_PERMITIDOS = ["Tarefa", "Defeito", "Melhoria", "Documentação"];
const PRIORIDADES_PERMITIDAS = ["Crítica", "Alta", "Média", "Baixa"];


/* ===== FUNCOES DE APOIO ===== */

/* Confere se o valor recebido e um texto preenchido.
   Usa trim() para que um texto so com espacos conte como vazio. */
function textoPreenchido(valor: any): boolean {
    if (typeof valor !== "string") {
        return false;
    }

    if (valor.trim() === "") {
        return false;
    }

    return true;
}

/* Confere se a data esta no formato AAAA-MM-DD e se existe de verdade.
   A segunda parte evita aceitar datas como 2026-02-31. */
function dataValida(valor: string): boolean {
    /* Confere o formato: 4 numeros, hifen, 2 numeros, hifen, 2 numeros */
    const formato = /^\d{4}-\d{2}-\d{2}$/;

    if (formato.test(valor) === false) {
        return false;
    }

    /* Monta a data e confere se ela continua igual ao que foi enviado.
       Se o dia nao existir, o JavaScript ajusta e os textos ficam diferentes. */
    const data = new Date(valor);

    if (isNaN(data.getTime()) === true) {
        return false;
    }

    return data.toISOString().substring(0, 10) === valor;
}


/* ===== POST /demandas ===== */
/* Cadastra uma nova demanda */
rotas.post("/demandas", function (req: Request, res: Response) {

    /* Pega os dados enviados no corpo da requisicao */
    const titulo = req.body.titulo;
    const descricao = req.body.descricao;
    const tipo = req.body.tipo;
    const prioridade = req.body.prioridade;
    const projetoId = req.body.projetoId;
    const responsavelId = req.body.responsavelId;
    const prazo = req.body.prazo;

    /* Lista que guarda todos os erros encontrados.
       Assim a API devolve todos de uma vez, e nao um por vez. */
    const erros: string[] = [];


    /*Titulo: obrigatorio, de 5 a 120 caracteres*/
    if (textoPreenchido(titulo) === false) {
        erros.push("O titulo e obrigatorio.");
    } else if (titulo.trim().length < 5) {
        erros.push("O titulo precisa ter pelo menos 5 caracteres.");
    } else if (titulo.trim().length > 120) {
        erros.push("O titulo pode ter no maximo 120 caracteres.");
    }


    /*Descricao: obrigatoria, com pelo menos 10 caracteres*/
    if (textoPreenchido(descricao) === false) {
        erros.push("A descricao e obrigatoria.");
    } else if (descricao.trim().length < 10) {
        erros.push("A descricao precisa ter pelo menos 10 caracteres.");
    }


    /*Tipo: obrigatorio e precisa ser um dos quatro valores aceitos */
    if (textoPreenchido(tipo) === false) {
        erros.push("O tipo e obrigatorio.");
    } else if (TIPOS_PERMITIDOS.includes(tipo) === false) {
        erros.push("O tipo precisa ser Tarefa, Defeito, Melhoria ou Documentação.");
    }


    /*Prioridade: obrigatoria e precisa ser uma das quatro aceitas */
    if (textoPreenchido(prioridade) === false) {
        erros.push("A prioridade e obrigatoria.");
    } else if (PRIORIDADES_PERMITIDAS.includes(prioridade) === false) {
        erros.push("A prioridade precisa ser Crítica, Alta, Média ou Baixa.");
    }


    /*  Projeto: obrigatorio e precisa existir nos dados cadastrados  */
    if (projetoId === undefined || projetoId === null || projetoId === "") {
        erros.push("O projeto e obrigatorio.");
    } else {
        /* find procura na lista e devolve o projeto encontrado,
           ou undefined quando nenhum tem aquele id */
        const projetoEncontrado = projetos.find(function (p) {
            return p.id === Number(projetoId);
        });

        if (projetoEncontrado === undefined) {
            erros.push("O projeto informado nao existe.");
        }
    }


    /*Responsavel: opcional, mas se vier precisa existir */
    if (responsavelId !== undefined && responsavelId !== null && responsavelId !== "") {
        const usuarioEncontrado = usuarios.find(function (u) {
            return u.id === Number(responsavelId);
        });

        if (usuarioEncontrado === undefined) {
            erros.push("O responsavel informado nao existe.");
        }
    }


    /* --- Prazo: opcional, mas se vier precisa estar no formato correto --- */
    if (prazo !== undefined && prazo !== null && prazo !== "") {
        if (dataValida(prazo) === false) {
            erros.push("O prazo precisa estar no formato AAAA-MM-DD e ser uma data valida.");
        }
    }


    /* --- Se houver qualquer erro, devolve 400 e nao cadastra nada --- */
    if (erros.length > 0) {
        return res.status(400).json({
            mensagem: "Nao foi possivel cadastrar a demanda.",
            erros: erros
        });
    }


    /*Dados definidos pelo servidor */
    /* Status, data de criacao e data de atualizacao sao definidos aqui,
       mesmo que tenham sido enviados na requisicao. Toda demanda nasce Aberta. */
    const agora = new Date().toISOString();

    const novaDemanda: Demanda = {
        id: proximoIdDemanda(),
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        tipo: tipo,
        prioridade: prioridade,
        status: "Aberta",
        projetoId: Number(projetoId),
        responsavelId: (responsavelId === undefined || responsavelId === null || responsavelId === "")
            ? null
            : Number(responsavelId),
        dataCriacao: agora,
        dataAtualizacao: agora,
        prazo: (prazo === undefined || prazo === null || prazo === "") ? null : prazo
    };

    /* Guarda a demanda na lista em memoria */
    demandas.push(novaDemanda);

    /* 201 significa "registro criado com sucesso" */
    return res.status(201).json({
        mensagem: "Demanda cadastrada com sucesso.",
        demanda: novaDemanda
    });
});


export default rotas;