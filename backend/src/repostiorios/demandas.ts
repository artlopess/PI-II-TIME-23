// Arthur Lopes Santos Silva - Acesso aos dados de demandas no Oracle
// Antes as rotas liam e alteravam o array "demandas" de data/dados.ts.
// Agora toda leitura usa consultar() e toda escrita usa executar()/transação.

import oracledb from 'oracledb';
import { consultar, executar, ClienteTransacao } from '../data/conexao';

export interface Demanda {
  id: number;
  titulo: string;
  descricao: string;
  tipo: string;
  prioridade: string;
  status: string;
  projetoId: number;
  responsavelId: number | null;
  dataCriacao: string;
  dataAtualizacao: string;
  prazo: string | null;
}

export interface DadosDemanda {
  titulo: string;
  descricao: string;
  tipo: string;
  prioridade: string;
  status: string;
  projetoId: number;
  responsavelId: number | null;
  prazo: string | null;
}

/* As colunas do banco viram as mesmas propriedades do contrato antigo.
   TO_CHAR devolve as datas no formato que o frontend já sabia ler:
   dataCriacao/dataAtualizacao em ISO e prazo em AAAA-MM-DD. */
const COLUNAS = `id                  AS "id",
                 titulo              AS "titulo",
                 descricao           AS "descricao",
                 tipo                AS "tipo",
                 prioridade          AS "prioridade",
                 status              AS "status",
                 projeto_id          AS "projetoId",
                 responsavel_id      AS "responsavelId",
                 TO_CHAR(data_criacao,     'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"') AS "dataCriacao",
                 TO_CHAR(data_atualizacao, 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"') AS "dataAtualizacao",
                 TO_CHAR(prazo,            'YYYY-MM-DD')                      AS "prazo"`;

// Lista todas as demandas (o filtro por perfil continua na rota)
export async function listarDemandas(): Promise<Demanda[]> {
  return consultar(`SELECT ${COLUNAS} FROM demandas ORDER BY id`);
}

// Busca uma demanda pelo id. Pode receber a conexão de uma transação.
export async function buscarDemanda(id: number, cliente?: ClienteTransacao): Promise<Demanda | null> {
  const linhas = await (cliente?.consultar ?? consultar)(
    `SELECT ${COLUNAS} FROM demandas WHERE id = :id`,
    { id }
  );

  return linhas[0] ?? null;
}

// Cadastra uma demanda. As datas são definidas pelo DEFAULT do banco,
// então o servidor não precisa confiar em new Date() do JavaScript.
export async function criarDemanda(dados: DadosDemanda): Promise<Demanda> {
  const resultado = await executar(
    `INSERT INTO demandas
        (titulo, descricao, tipo, prioridade, status, projeto_id, responsavel_id, prazo)
     VALUES
        (:titulo, :descricao, :tipo, :prioridade, :status, :projetoId, :responsavelId,
         TO_DATE(:prazo, 'YYYY-MM-DD'))
     RETURNING id INTO :id`,
    {
      titulo: dados.titulo,
      descricao: dados.descricao,
      tipo: dados.tipo,
      prioridade: dados.prioridade,
      status: dados.status,
      projetoId: { val: dados.projetoId, type: oracledb.NUMBER },
      responsavelId: { val: dados.responsavelId, type: oracledb.NUMBER },
      prazo: { val: dados.prazo, type: oracledb.STRING },
      id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
    }
  );

  const retorno = resultado.outBinds?.id;
  const id = Number(Array.isArray(retorno) ? retorno[0] : retorno);

  if (Number.isInteger(id) === false) {
    throw new Error('O banco não devolveu o id da demanda cadastrada.');
  }

  const criada = await buscarDemanda(id);

  if (criada === null) {
    throw new Error('A demanda cadastrada não pôde ser lida de volta.');
  }

  return criada;
}

/* Altera os campos de uma demanda existente.
   Se "cliente" for informado, o UPDATE usa a MESMA conexão da transação
   aberta pela rota PUT — junto com o INSERT no histórico. */
export async function atualizarDemanda(
  id: number,
  dados: DadosDemanda,
  cliente?: ClienteTransacao
): Promise<void> {
  await (cliente?.executar ?? executar)(
    `UPDATE demandas
        SET titulo           = :titulo,
            descricao        = :descricao,
            tipo             = :tipo,
            prioridade       = :prioridade,
            status           = :status,
            projeto_id       = :projetoId,
            responsavel_id   = :responsavelId,
            prazo            = TO_DATE(:prazo, 'YYYY-MM-DD'),
            data_atualizacao = CAST(SYSTIMESTAMP AS TIMESTAMP)
      WHERE id = :id`,
    {
      titulo: dados.titulo,
      descricao: dados.descricao,
      tipo: dados.tipo,
      prioridade: dados.prioridade,
      status: dados.status,
      projetoId: { val: dados.projetoId, type: oracledb.NUMBER },
      responsavelId: { val: dados.responsavelId, type: oracledb.NUMBER },
      prazo: { val: dados.prazo, type: oracledb.STRING },
      id
    }
  );
}
