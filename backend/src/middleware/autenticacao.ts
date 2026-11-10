// Leonardo Antunes de Souza - Middlewares de autenticação e permissão

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { SEGREDO } from '../config';

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