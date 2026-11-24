// Time 23 - Histórico de alterações das demandas (item 2.2.7)
// As linhas são gravadas na MESMA transação do UPDATE da demanda: se um
// INSERT falhar, o rollback desfaz a alteração da demanda junto.
// O histórico nunca é apagado — nem quando a demanda é cancelada.

import { consultar, ClienteTransacao } from '../data/conexao';

export interface RegistroHistorico {
  demandaId: number;
  usuarioId: number;
  campo: string;
  valorAnterior: string | null;
  valorNovo: string | null;
}

export interface HistoricoExibido {
  id: number;
  demandaId: number;
  usuarioId: number;
  usuarioNome: string;
  campo: string;
  valorAnterior: string | null;
  valorNovo: string | null;
  dataHora: string;
}

export async function registrarHistorico(
  registros: RegistroHistorico[],
  cliente: ClienteTransacao
): Promise<void> {
  for (const registro of registros) {
    await cliente.executar(
      `INSERT INTO historico
          (demanda_id, usuario_id, campo, valor_anterior, valor_novo)
       VALUES
          (:demandaId, :usuarioId, :campo, :valorAnterior, :valorNovo)`,
      {
        demandaId: registro.demandaId,
        usuarioId: registro.usuarioId,
        campo: registro.campo,
        valorAnterior: registro.valorAnterior,
        valorNovo: registro.valorNovo
      }
    );
  }
}

// Lista o histórico de uma demanda com o nome de quem fez a alteração.
export async function listarHistorico(demandaId: number): Promise<HistoricoExibido[]> {
  return consultar(
    `SELECT h.id                    AS "id",
            h.demanda_id            AS "demandaId",
            h.usuario_id            AS "usuarioId",
            NVL(u.nome, 'Desconhecido') AS "usuarioNome",
            h.campo                 AS "campo",
            h.valor_anterior        AS "valorAnterior",
            h.valor_novo            AS "valorNovo",
            TO_CHAR(h.data_hora, 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"') AS "dataHora"
       FROM historico h
       LEFT JOIN usuarios u ON u.id = h.usuario_id
      WHERE h.demanda_id = :demandaId
      ORDER BY h.id`,
    { demandaId }
  );
}
