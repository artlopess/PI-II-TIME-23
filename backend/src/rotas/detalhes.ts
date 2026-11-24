// Pedro Businari Kawamoto - Rotas de detalhes e comentários

import { Router, Request, Response } from 'express';
import { buscarDemanda } from '../repostiorios/demandas';
import { buscarUsuarioPorId } from '../repostiorios/usuarios';
import { buscarProjetoPorId } from '../repostiorios/projetos';
import { listarComentarios, criarComentario } from '../repostiorios/comentarios';
import { listarHistorico } from '../repostiorios/historico';
import { verificarToken, podeVerDemanda } from '../middleware/autenticacao';

// Cria o roteador que o Leonardo vai importar usando app.use(rotasdetalhes)
const router = Router();

// Um comentário não pode ser usado para inundar o banco/a tela de detalhes.
const TAMANHO_MAXIMO_COMENTARIO = 500;

// ==========================================
// 1. GET /demandas/:id
// ==========================================
router.get('/demandas/:id', verificarToken, async (req: Request, res: Response): Promise<void> => {
  const idDemanda = Number(req.params.id);
  const demanda = await buscarDemanda(idDemanda);

  if (!demanda) {
    res.status(404).json({ erro: 'Demanda não encontrada.' });
    return;
  }

  // Admin vê tudo; Líder vê os seus projetos; Membro só o que lhe foi atribuído.
  if (!await podeVerDemanda(res.locals.usuario, demanda)) {
    res.status(403).json({ erro: 'Você não tem permissão para ver esta demanda.' });
    return;
  }

  // Junta o nome do responsável para a tela não precisar de outra requisição.
  // responsavelId pode ser null (demanda ainda sem responsável).
  const responsavel = demanda.responsavelId === null
    ? null
    : await buscarUsuarioPorId(demanda.responsavelId);

  // O projeto também vem do banco: a tela não precisa mostrar só o id.
  const projeto = await buscarProjetoPorId(demanda.projetoId);

  res.status(200).json({
    ...demanda,
    projetoNome: projeto ? projeto.nome : '—',
    responsavelNome: responsavel ? responsavel.nome : 'Sem responsável'
  });
});

// ==========================================
// 2. GET /demandas/:id/comentarios
// ==========================================
router.get('/demandas/:id/comentarios', verificarToken, async (req: Request, res: Response): Promise<void> => {
  const idDemanda = Number(req.params.id);
  const demanda = await buscarDemanda(idDemanda);

  if (!demanda) {
    res.status(404).json({ erro: 'Demanda não encontrada.' });
    return;
  }

  if (!await podeVerDemanda(res.locals.usuario, demanda)) {
    res.status(403).json({ erro: 'Você não tem permissão para ver estes comentários.' });
    return;
  }

  // O nome do autor já vem do JOIN feito no repositório.
  res.status(200).json(await listarComentarios(idDemanda));
});

// ==========================================
// 2.1. GET /demandas/:id/historico
// ==========================================
router.get('/demandas/:id/historico', verificarToken, async (req: Request, res: Response): Promise<void> => {
  const idDemanda = Number(req.params.id);
  const demanda = await buscarDemanda(idDemanda);

  if (!demanda) {
    res.status(404).json({ erro: 'Demanda não encontrada.' });
    return;
  }

  // Mesma regra de visibilidade de detalhes e comentários.
  if (!await podeVerDemanda(res.locals.usuario, demanda)) {
    res.status(403).json({ erro: 'Você não tem permissão para ver este histórico.' });
    return;
  }

  // Histórico nunca é apagado: demandas canceladas também têm histórico.
  res.status(200).json(await listarHistorico(idDemanda));
});

// ==========================================
// 3. POST /demandas/:id/comentarios
// ==========================================
router.post('/demandas/:id/comentarios', verificarToken, async (req: Request, res: Response): Promise<void> => {
  const idDemanda = Number(req.params.id);
  const { texto } = req.body ?? {};

  const demanda = await buscarDemanda(idDemanda);
  if (!demanda) {
    res.status(404).json({ erro: 'Demanda não encontrada.' });
    return;
  }

  if (!await podeVerDemanda(res.locals.usuario, demanda)) {
    res.status(403).json({ erro: 'Você não tem permissão para comentar nesta demanda.' });
    return;
  }

  if (typeof texto !== 'string' || texto.trim() === '') {
    res.status(400).json({ erro: 'O texto do comentário é obrigatório.' });
    return;
  }

  const textoComentario = texto.trim();
  if (textoComentario.length > TAMANHO_MAXIMO_COMENTARIO) {
    res.status(400).json({
      erro: `O comentário pode ter no máximo ${TAMANHO_MAXIMO_COMENTARIO} caracteres.`
    });
    return;
  }

  // O autor vem do token — o cliente não pode escolher outro usuário.
  const usuarioId = Number(res.locals.usuario?.id);
  const usuario = await buscarUsuarioPorId(usuarioId);
  if (!usuario) {
    res.status(401).json({ erro: 'Usuário da sessão não encontrado. Faça login novamente.' });
    return;
  }

  const novoComentario = await criarComentario(idDemanda, usuarioId, textoComentario);
  res.status(201).json(novoComentario);
});

// Exporta o router para o arquivo do Leonardo funcionar perfeitamente
export default router;
