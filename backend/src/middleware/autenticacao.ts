// Leonardo Antunes de Souza - Middlewares de autenticação e permissão

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { SEGREDO } from '../config';
import { listarProjetosDoUsuario } from '../repostiorios/vinculos';

// Exige um token válido no cabeçalho "Authorization: Bearer <token>".
// Se estiver ok, guarda os dados do usuário em res.locals.usuario.
export function verificarToken(req: Request, res: Response, next: NextFunction) {
  const cabecalho = req.headers.authorization;

  if (!cabecalho || !cabecalho.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Token não informado.' });
  }

  const token = cabecalho.slice(7); // remove o "Bearer "

  try {
    res.locals.usuario = jwt.verify(token, SEGREDO);
    next();
  } catch (erro) {
    return res.status(401).json({ erro: 'Sessão expirada ou inválida. Faça login novamente.' });
  }
}

// Exige que o usuário logado tenha um dos perfis informados.
// Uso: app.post('/rota', verificarToken, exigirPerfil('Administrador'), ...)
export function exigirPerfil(...perfisPermitidos: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const usuario = res.locals.usuario;

    if (!usuario || !perfisPermitidos.includes(usuario.perfil)) {
      return res.status(403).json({ erro: 'Você não tem permissão para esta ação.' });
    }
    next();
  };
}

/* Os vínculos agora vêm da tabela usuario_projetos.
   Como a mesma requisição pode conferir várias demandas, a lista é lida
   uma vez por usuário e reaproveitada. O WeakMap usa o objeto do token
   como chave, então a entrada some junto com a requisição. */
const cacheVinculos = new WeakMap<object, Promise<number[]>>();

function projetosDoUsuario(usuario: any): Promise<number[]> {
  const chave = usuario as object;
  let promessa = cacheVinculos.get(chave);

  if (promessa === undefined) {
    promessa = listarProjetosDoUsuario(Number(usuario.id));
    cacheVinculos.set(chave, promessa);
  }

  return promessa;
}

// Administrador acessa todos os projetos; Líder e Membro apenas os vinculados.
// Esta checagem é usada nas rotas de demandas, detalhes, comentários, projetos e dashboard.
export async function podeAcessarProjeto(usuario: any, projetoId: number): Promise<boolean> {
  if (!usuario) {
    return false;
  }

  if (usuario.perfil === 'Administrador') {
    return true;
  }

  const projetos = await projetosDoUsuario(usuario);
  return projetos.includes(Number(projetoId));
}

// Regra completa de visibilidade do escopo:
// - Administrador vê todas as demandas;
// - Líder vê as demandas dos projetos aos quais está vinculado;
// - Membro vê apenas as demandas atribuídas a ele (nos seus projetos).
// Usada pela listagem, detalhes, comentários e dashboard.
export async function podeVerDemanda(
  usuario: any,
  demanda: { projetoId: number; responsavelId: number | null }
): Promise<boolean> {
  if (!usuario) {
    return false;
  }

  if (usuario.perfil === 'Administrador') {
    return true;
  }

  if (await podeAcessarProjeto(usuario, demanda.projetoId) === false) {
    return false;
  }

  if (usuario.perfil === 'Membro da Equipe') {
    return demanda.responsavelId !== null && Number(demanda.responsavelId) === Number(usuario.id);
  }

  // Líder de Projeto
  return true;
}
