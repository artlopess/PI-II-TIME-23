
import { Router, Request, Response } from "express";
import { demandas } from "../data/dados";

const router = Router();

function normalizar(valor: string): string {
    return valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

router.get("/", (req: Request, res: Response) => {
    try {
        const status = String(req.query.status ?? "");
        const prioridade = String(req.query.prioridade ?? "");
        const tipo = String(req.query.tipo ?? "");
        const responsavel = String(req.query.responsavel ?? "");
        const projeto = String(req.query.projeto ?? "");
        const busca = normalizar(String(req.query.busca ?? ""));
        const ordenarPor = String(req.query.ordenarPor ?? "dataCriacao");
        const direcao = String(req.query.direcao ?? "desc");

        const criterios = ["prioridade", "dataCriacao", "prazoFinalizacao", "status"];

        if (!criterios.includes(ordenarPor)) {
            return res.status(400).json({
                mensagem: "Critério de ordenação inválido."
            });
        }

        if (!["asc", "desc"].includes(direcao)) {
            return res.status(400).json({
                mensagem: "Direção de ordenação inválida."
            });
        }

        let resultado = [...demandas];

        if (status) {
            resultado = resultado.filter(d =>
                normalizar(d.status) === normalizar(status)
            );
        }

        if (prioridade) {
            resultado = resultado.filter(d =>
                normalizar(d.prioridade) === normalizar(prioridade)
            );
        }

        if (tipo) {
            resultado = resultado.filter(d =>
                normalizar(d.tipo) === normalizar(tipo)
            );
        }

        if (responsavel) {
            resultado = resultado.filter(d =>
                normalizar(d.responsavel).includes(normalizar(responsavel))
            );
        }

        if (projeto) {
            resultado = resultado.filter(d =>
                normalizar(d.projeto).includes(normalizar(projeto))
            );
        }

        if (busca) {
            resultado = resultado.filter(d =>
                normalizar(d.titulo).includes(busca) ||
                normalizar(d.descricao).includes(busca)
            );
        }

        const pesos: Record<string, number> = {
            "crítica": 1,
            "alta": 2,
            "média": 3,
            "baixa": 4
        };

        resultado.sort((a, b) => {
            let comparacao = 0;

            if (ordenarPor === "prioridade") {
                comparacao =
                    (pesos[a.prioridade.toLowerCase()] ?? 5) -
                    (pesos[b.prioridade.toLowerCase()] ?? 5);
            }

            if (ordenarPor === "dataCriacao") {
                comparacao =
                    new Date(a.dataCriacao).getTime() -
                    new Date(b.dataCriacao).getTime();
            }

            if (ordenarPor === "prazoFinalizacao") {
                comparacao =
                    new Date(a.prazoFinalizacao ?? "9999-12-31").getTime() -
                    new Date(b.prazoFinalizacao ?? "9999-12-31").getTime();
            }

            if (ordenarPor === "status") {
                comparacao = a.status.localeCompare(b.status, "pt-BR");
            }

            return direcao === "desc" ? -comparacao : comparacao;
        });

        return res.status(200).json({
            total: resultado.length,
            demandas: resultado
        });

    } catch {
        return res.status(500).json({
            mensagem: "Erro interno ao consultar demandas."
        });
    }
});

export default router;
