// Leonardo Antunes de Souza - Rotas POST /login e GET /usuarios

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { SEGREDO } from '../config';
import { verificarToken } from '../middleware/autenticacao';
import { buscarUsuarioPorEmail, listarUsuarios } from '../repostiorios/usuarios';

const rotas = Router();

// POST /login: recebe { email, senha } e devolve { token, usuario }
rotas.post('/login', async (req, res) => {
  const { email, senha } = req.body ?? {};

  // 400: dados ausentes ou no formato errado
  if (typeof email !== 'string' || typeof senha !== 'string' ||
      email.trim() === '' || senha === '') {
    return res.status(400).json({ erro: 'Informe e-mail e senha.' });
  }

  const usuario = await buscarUsuarioPorEmail(email.trim().toLowerCase());

  // 401: usuário inexistente ou senha errada (mesma mensagem nos dois casos)
  const senhaConfere = usuario ? await bcrypt.compare(senha, usuario.senhaHash) : false;
  if (!usuario || !senhaConfere) {
    return res.status(401).json({ erro: 'Usuário ou senha inválidos.' });
  }

  const token = jwt.sign({ id: usuario.id, perfil: usuario.perfil }, SEGREDO, { expiresIn: '2h' });

  res.status(200).json({
    token,
    usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil },
  });
});

// GET /usuarios: lista os usuários (usada para escolher o responsável de uma demanda)
rotas.get('/usuarios', verificarToken, async (req, res) => {
  res.status(200).json(await listarUsuarios());
});

export default rotas;