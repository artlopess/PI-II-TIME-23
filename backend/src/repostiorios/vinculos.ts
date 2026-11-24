// Time 23 - Vínculos usuário x projeto (tabela usuario_projetos)
// Antes essa informação vinha do array usuarioProjetos em data/dados.ts.
// Administradores enxergam tudo; Líder e Membro só os projetos desta tabela.

import { consultar } from '../data/conexao';

// Devolve os ids dos projetos aos quais o usuário está vinculado
export async function listarProjetosDoUsuario(usuarioId: number): Promise<number[]> {
  const linhas = await consultar(
    `SELECT projeto_id AS "projetoId"
       FROM usuario_projetos
      WHERE usuario_id = :usuarioId
      ORDER BY projeto_id`,
    { usuarioId }
  );

  return linhas.map(linha => Number(linha.projetoId));
}
