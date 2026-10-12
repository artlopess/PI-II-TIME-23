// Pedro Businari Kawamoto - Rotas de detalhes e comentários

import { Router, Request, Response } from 'express';
import { usuarios, demandas, comentarios, Comentario } from '../data/dados';

// Cria o roteador que o Leonardo vai importar usando app.use(rotasdetalhes)
const router = Router();

// ==========================================
// 1. GET /demandas/:id
// ==========================================
router.get('/demandas/:id', (req: Request, res: Response): void => {
  const idDemanda = Number(req.params.id);
  const demanda = demandas.find(d => d.id === idDemanda);

  if (!demanda) {
    res.status(404).json({ erro: 'Demanda não encontrada.' });
    return;
  }

  res.status(200).json(demanda);
});

// ==========================================
// 2. GET /demandas/:id/comentarios
// ==========================================
router.get('/demandas/:id/comentarios', (req: Request, res: Response): void => {
  const idDemanda = Number(req.params.id);
  const demandaExiste = demandas.some(d => d.id === idDemanda);

  if (!demandaExiste) {
    res.status(404).json({ erro: 'Demanda não encontrada.' });
    return;
  }

  const comentariosFiltrados = comentarios.filter(c => c.demandaId === idDemanda);
  res.status(200).json(comentariosFiltrados);
});

// ==========================================
// 3. POST /demandas/:id/comentarios
// ==========================================
router.post('/demandas/:id/comentarios', (req: Request, res: Response): void => {
  const idDemanda = Number(req.params.id);
  const { usuarioId, texto } = req.body;

  const demandaExiste = demandas.some(d => d.id === idDemanda);
  if (!demandaExiste) {
    res.status(404).json({ erro: 'Demanda não encontrada.' });
    return;
  }

  if (!texto || String(texto).trim() === '' || usuarioId === undefined) {
    res.status(400).json({ erro: 'O texto do comentário e o usuarioId são obrigatórios.' });
    return;
  }

  const usuarioExiste = usuarios.some(u => u.id === Number(usuarioId));
  if (!usuarioExiste) {
    res.status(400).json({ erro: 'O usuário informado não existe no sistema.' });
    return;
  }

  const novoComentario: Comentario = {
    id: comentarios.length > 0 ? Math.max(...comentarios.map(c => c.id)) + 1 : 1,
    demandaId: idDemanda,
    usuarioId: Number(usuarioId),
    texto: String(texto).trim(),
    dataCriacao: new Date()
  };

  comentarios.push(novoComentario);
  res.status(201).json(novoComentario);
});

// Exporta o router para o arquivo do Leonardo funcionar perfeitamente
export default router;