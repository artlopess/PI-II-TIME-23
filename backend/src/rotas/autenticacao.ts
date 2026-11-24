// Leonardo Antunes de Souza - Rotas POST /login e GET /usuarios

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { SEGREDO } from '../config';
import { verificarToken, exigirPerfil } from '../middleware/autenticacao';
import { limitarTentativasLogin, registrarLoginSucesso } from '../middleware/limite-taxa';
import { buscarUsuarioPorEmail, listarUsuarios } from '../repostiorios/usuarios';

const rotas = Router();

// POST /login: recebe { email, senha } e devolve { token, usuario }.
// O limite de tentativas impede força bruta; um login válido zera o contador.
rotas.post('/login', limitarTentativasLogin, async (req, res) => {
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

  registrarLoginSucesso(req);

  const token = jwt.sign({ id: usuario.id, perfil: usuario.perfil }, SEGREDO, { expiresIn: '2h' });

  res.status(200).json({
    token,
    usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil },
  });
});

// GET /usuarios: lista os usuários (usada para escolher o responsável de uma demanda).
// Administrador e Líder podem atribuir responsáveis; Membro não (escopo §2.2.4).
rotas.get('/usuarios', verificarToken, exigirPerfil('Administrador', 'Líder de Projeto'), async (req, res) => {
  res.status(200).json(await listarUsuarios());
});

export default rotas;