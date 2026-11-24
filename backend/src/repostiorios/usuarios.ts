// Leonardo Antunes de Souza - Acesso aos dados de usuários no Oracle
// Substitui os arrays em data/dados.ts. A senha_hash sai do banco, mas nunca
// entra nas respostas das rotas (listarUsuarios devolve só os dados públicos).

import { consultar, consultarUm } from '../data/conexao';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  senhaHash: string;
  perfil: string;
}

export interface UsuarioPublico {
  id: number;
  nome: string;
  email: string;
  perfil: string;
}

/* Aspas duplas mantêm o nome das propriedades em camelCase, igual ao
   contrato que o frontend já consume. Sem aspas o Oracle devolve ID, NOME... */
const COLUNAS = `id AS "id",
                 nome AS "nome",
                 email AS "email",
                 senha_hash AS "senhaHash",
                 perfil AS "perfil"`;

// Busca um usuário pelo e-mail (retorna null se não existir)
export async function buscarUsuarioPorEmail(email: string): Promise<Usuario | null> {
  return consultarUm(
    `SELECT ${COLUNAS} FROM usuarios WHERE LOWER(email) = LOWER(:email)`,
    { email }
  );
}

// Busca um usuário pelo id — usado para conferir o autor de um comentário
export async function buscarUsuarioPorId(id: number): Promise<Usuario | null> {
  return consultarUm(
    `SELECT ${COLUNAS} FROM usuarios WHERE id = :id`,
    { id }
  );
}

// Confere se o responsável informado existe antes de gravar uma demanda
export async function usuarioExiste(id: number): Promise<boolean> {
  const usuario = await consultarUm('SELECT id AS "id" FROM usuarios WHERE id = :id', { id });
  return usuario !== null;
}

// Lista todos os usuários SEM o hash da senha
export async function listarUsuarios(): Promise<UsuarioPublico[]> {
  return consultar(
    `SELECT id AS "id", nome AS "nome", email AS "email", perfil AS "perfil"
       FROM usuarios ORDER BY id`
  );
}
