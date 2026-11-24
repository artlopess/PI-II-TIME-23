// Arthur Lopes Santos Silva - Acesso aos dados de projetos no Oracle

import { consultar, consultarUm } from '../data/conexao';

export interface Projeto {
  id: number;
  nome: string;
}

// Lista os projetos pré-configurados no sistema
export async function listarProjetos(): Promise<Projeto[]> {
  return consultar('SELECT id AS "id", nome AS "nome" FROM projetos ORDER BY id');
}

// Busca um projeto pelo id (usado para mostrar o nome na listagem/detalhes)
export async function buscarProjetoPorId(id: number): Promise<Projeto | null> {
  return consultarUm('SELECT id AS "id", nome AS "nome" FROM projetos WHERE id = :id', { id });
}

// Confere se o projeto informado no cadastro/edição existe
export async function projetoExiste(id: number): Promise<boolean> {
  const projeto = await consultarUm('SELECT id AS "id" FROM projetos WHERE id = :id', { id });
  return projeto !== null;
}
