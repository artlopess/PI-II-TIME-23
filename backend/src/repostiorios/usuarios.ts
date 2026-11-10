// Leonardo Antunes de Souza - Acesso aos dados de usuários
// Hoje lê da memória; depois será trocado por consultas ao Oracle.

import { usuarios } from '../data/dados';

// Busca um usuário pelo e-mail (retorna null se não existir)
export async function buscarUsuarioPorEmail(email: string) {
  return usuarios.find(u => u.email === email) ?? null;
}

// Lista todos os usuários SEM o hash da senha
export async function listarUsuarios() {
  return usuarios.map(u => ({ id: u.id, nome: u.nome, email: u.email, perfil: u.perfil }));
}