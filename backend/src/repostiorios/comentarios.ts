// Pedro Businari Kawamoto - Acesso aos comentários no Oracle
// O autor vem do token da sessão; o cliente nunca escolhe o usuario_id.

import oracledb from 'oracledb';
import { consultar, executar } from '../data/conexao';

export interface Comentario {
  id: number;
  demandaId: number;
  usuarioId: number;
  texto: string;
  dataCriacao: string;
  usuarioNome?: string;
}

const COLUNAS = `c.id AS "id",
                 c.demanda_id AS "demandaId",
                 c.usuario_id AS "usuarioId",
                 c.texto AS "texto",
                 TO_CHAR(c.data_hora, 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"') AS "dataCriacao",
                 NVL(u.nome, 'Desconhecido') AS "usuarioNome"`;

// Lista os comentários de uma demanda com o nome do autor
export async function listarComentarios(demandaId: number): Promise<Comentario[]> {
  return consultar(
    `SELECT ${COLUNAS}
       FROM comentarios c
       LEFT JOIN usuarios u ON u.id = c.usuario_id
      WHERE c.demanda_id = :demandaId
      ORDER BY c.id`,
    { demandaId }
  );
}

// Grava um comentário e devolve a linha já completa (com nome do autor)
export async function criarComentario(
  demandaId: number,
  usuarioId: number,
  texto: string
): Promise<Comentario> {
  const resultado = await executar(
    `INSERT INTO comentarios (demanda_id, usuario_id, texto)
     VALUES (:demandaId, :usuarioId, :texto)
     RETURNING id INTO :id`,
    {
      demandaId: { val: demandaId, type: oracledb.NUMBER },
      usuarioId: { val: usuarioId, type: oracledb.NUMBER },
      texto,
      id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
    }
  );

  const retorno = resultado.outBinds?.id;
  const id = Number(Array.isArray(retorno) ? retorno[0] : retorno);

  if (Number.isInteger(id) === false) {
    throw new Error('O banco não devolveu o id do comentário cadastrado.');
  }

  const linhas = await consultar(
    `SELECT ${COLUNAS}
       FROM comentarios c
       LEFT JOIN usuarios u ON u.id = c.usuario_id
      WHERE c.id = :id`,
    { id }
  );

  const criado = linhas[0];

  if (criado === undefined) {
    throw new Error('O comentário cadastrado não pôde ser lido de volta.');
  }

  return criado;
}
