import express, { Request, Response } from "express";

const app = express();
app.use(express.json());

interface Demanda {
    id: number;
    titulo: string;
    descricao: string;
    tipo: string;
    prioridade: string;
    status: string;
    projeto: number;
    responsavel: number | null;
    dataCriacao: string;
    prazoFinalizacao: string | null;
    ultimaAtualizacao: string;
}

const demandas: Demanda[] = [
    { id: 1, titulo: "Corrigir login", descricao: "Corrigir erro no sistema de login", tipo: "Defeito", prioridade: "Crítica", status: "Aberta", projeto: 1, responsavel: 1, dataCriacao: "2026-09-01", prazoFinalizacao: "2026-10-15", ultimaAtualizacao: "2026-09-01" },
    { id: 2, titulo: "Criar página inicial", descricao: "Desenvolver a página inicial do sistema", tipo: "Tarefa", prioridade: "Alta", status: "Em andamento", projeto: 1, responsavel: 2, dataCriacao: "2026-09-02", prazoFinalizacao: "2026-10-20", ultimaAtualizacao: "2026-09-02" },
    { id: 3, titulo: "Adicionar filtro", descricao: "Adicionar filtros na listagem de demandas", tipo: "Melhoria", prioridade: "Média", status: "Em revisão", projeto: 2, responsavel: 3, dataCriacao: "2026-09-03", prazoFinalizacao: "2026-10-18", ultimaAtualizacao: "2026-09-03" },
    { id: 4, titulo: "Fazer documentação", descricao: "Criar documentação do projeto", tipo: "Documentação", prioridade: "Baixa", status: "Concluída", projeto: 2, responsavel: 4, dataCriacao: "2026-08-20", prazoFinalizacao: "2026-09-29", ultimaAtualizacao: "2026-09-29" },
    { id: 5, titulo: "Corrigir cadastro", descricao: "Resolver problema no cadastro de usuários", tipo: "Defeito", prioridade: "Alta", status: "Aberta", projeto: 1, responsavel: 2, dataCriacao: "2026-10-01", prazoFinalizacao: "2026-10-25", ultimaAtualizacao: "2026-10-01" },
    { id: 6, titulo: "Atualizar interface", descricao: "Melhorar o visual das páginas", tipo: "Melhoria", prioridade: "Baixa", status: "Cancelada", projeto: 2, responsavel: null, dataCriacao: "2026-09-10", prazoFinalizacao: null, ultimaAtualizacao: "2026-09-12" }
];

const prioridades = ["Crítica", "Alta", "Média", "Baixa"];
const statusValidos = ["Aberta", "Em andamento", "Em revisão", "Concluída", "Cancelada"];
const tiposValidos = ["Tarefa", "Defeito", "Melhoria", "Documentação"];
const ordenacoes = ["prioridade", "dataCriacao", "prazoFinalizacao", "status"];

app.get("/demandas", (req: Request, res: Response) => {
    const { status, prioridade, tipo, responsavel, projeto, busca, ordenar, direcao } = req.query;
    const parametros = { status, prioridade, tipo, responsavel, projeto, busca, ordenar, direcao };

    for (const [nome, valor] of Object.entries(parametros)) {
        if (valor !== undefined && typeof valor !== "string")
            return res.status(400).json({ erro: `Parâmetro inválido: ${nome}` });
    }

    const validacoes = [
        [status, statusValidos, "Status inválido"],
        [prioridade, prioridades, "Prioridade inválida"],
        [tipo, tiposValidos, "Tipo inválido"],
        [ordenar, ordenacoes, "Ordenação inválida"],
        [direcao, ["asc", "desc"], "Direção inválida"]
    ] as const;

    for (const [valor, lista, erro] of validacoes) {
        if (valor && !lista.includes(valor as never))
            return res.status(400).json({ erro });
    }

    for (const [nome, valor] of Object.entries({ responsavel, projeto })) {
        if (valor !== undefined &&
            (!/^[1-9]\d*$/.test(valor as string) ||
             !Number.isSafeInteger(Number(valor))))
            return res.status(400).json({ erro: `${nome} deve ser um ID numérico válido` });
    }

    let resultado = demandas.filter(d =>
        (!status || d.status === status) &&
        (!prioridade || d.prioridade === prioridade) &&
        (!tipo || d.tipo === tipo) &&
        (!responsavel || d.responsavel === Number(responsavel)) &&
        (!projeto || d.projeto === Number(projeto)) &&
        (!busca || `${d.titulo} ${d.descricao}`.toLocaleLowerCase("pt-BR")
            .includes((busca as string).toLocaleLowerCase("pt-BR")))
    );

    if (ordenar) {
        resultado.sort((a, b) => {
            let comparacao = 0;

            if (ordenar === "prioridade")
                comparacao = prioridades.indexOf(a.prioridade) - prioridades.indexOf(b.prioridade);
            else if (ordenar === "status")
                comparacao = statusValidos.indexOf(a.status) - statusValidos.indexOf(b.status);
            else if (ordenar === "dataCriacao")
                comparacao = a.dataCriacao.localeCompare(b.dataCriacao);
            else if (ordenar === "prazoFinalizacao")
                comparacao = (a.prazoFinalizacao ?? "9999-12-31")
                    .localeCompare(b.prazoFinalizacao ?? "9999-12-31");

            return direcao === "desc" ? -comparacao : comparacao;
        });
    }

    res.status(200).json({ total: resultado.length, demandas: resultado });
});

app.listen(3000, () => console.log("Servidor rodando em http://localhost:3000"));