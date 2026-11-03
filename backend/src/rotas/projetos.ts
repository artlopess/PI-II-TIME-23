/* Arthur Lopes Santos Silva - Rota de Listagem de Projetos (GET /projetos) */

/* Esta rota alimenta o campo "Projeto" do formulario de cadastro de demanda.
   Os projetos ja vem cadastrados no sistema, por isso aqui existe
   apenas a consulta, sem cadastro. */

import { Router, Request, Response } from "express";
import { projetos } from "../data/dados";

const rotas = Router();


/* ===== GET /projetos ===== */
/* Lista todos os projetos cadastrados */
rotas.get("/projetos", function (req: Request, res: Response) {

    /* 200 significa "deu certo". Devolve a lista completa em JSON. */
    return res.status(200).json({
        total: projetos.length,
        projetos: projetos
    });
});


export default rotas;