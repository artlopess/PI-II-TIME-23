/* Arthur Lopes Santos Silva - Rota de Listagem de Projetos (GET /projetos) */

/* Esta rota alimenta o campo "Projeto" do formulário de cadastro de demanda.
   Os projetos já vêm cadastrados no Oracle, por isso aqui existe
   apenas a consulta, sem cadastro. */

import { Router, Request, Response } from "express";
import { listarProjetos, Projeto } from "../repostiorios/projetos";
import { verificarToken, podeAcessarProjeto } from "../middleware/autenticacao";

const rotas = Router();


/* ===== GET /projetos ===== */
/* Lista os projetos que o usuário logado pode acessar.
   Administrador vê todos; Líder e Membro só os vinculados a ele
   pela tabela usuario_projetos. */
rotas.get("/projetos", verificarToken, async function (req: Request, res: Response) {

    const projetos = await listarProjetos();
    const visiveis: Projeto[] = [];

    for (const projeto of projetos) {
        if (await podeAcessarProjeto(res.locals.usuario, projeto.id)) {
            visiveis.push(projeto);
        }
    }

    return res.status(200).json({
        total: visiveis.length,
        projetos: visiveis
    });
});


export default rotas;
