// Leonardo Antunes de Souza - Rotas de login e usuários

import { Router, Request, Response } from 'express';
import { usuarios, Usuario } from '../data/dados';

const router = Router();

// Devolve uma cópia do usuário sem o campo "senha"
function removerSenha(usuario: Usuario) {
  const { senha, ...usuarioSemSenha } = usuario;
  return usuarioSemSenha;
}

// POST /login
router.post('/login', (req: Request, res: Response) => {
  const { email, senha } = req.body ?? {};

  // 400: campo obrigatório ausente
  if (!email || !senha) {
    res.status(400).json({ erro: 'E-mail e senha são obrigatórios.' });
    return;
  }

  // Procura um usuário com esse e-mail e essa senha
  const usuario = usuarios.find(
    (u) => u.email.toLowerCase() === String(email).toLowerCase() && u.senha === senha
  );

  // 401: credenciais inválidas
  if (!usuario) {
    res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
    return;
  }

  // 200: sucesso, devolve os dados e o perfil (sem a senha)
  res.status(200).json({ usuario: removerSenha(usuario) });
});

// GET /usuarios
router.get('/usuarios', (req: Request, res: Response) => {
  res.status(200).json(usuarios.map(removerSenha));
});

export default router;