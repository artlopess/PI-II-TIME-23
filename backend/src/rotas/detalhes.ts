// Pedro Businari Kawamoto - Rotas de detalhes e comentários

import { Router, Request, Response } from 'express';
// Puxa os dados e tipos unificados que estão no arquivo do grupo
import { usuarios, demandas, comentarios, Comentario } from '../data/dados';

const router = Router();

// GET /demandas/:id
router.get('/demandas/:id', (req: Request, res: Response): void => {
  const idDemanda = Number(req.params.id);
  const demanda = demandas.find((d) => d.id === idDemanda);

  // 404: erro quando a demanda não existir
  if (!demanda) {
    res.status(404).json({ erro: 'Demanda não encontrada.' });
    return;
  }

  // 200: retorna todos os campos de uma demanda específica
  res.status(200).json(demanda);
});

// GET /demandas/:id/comentarios
router.get('/demandas/:id/comentarios', (req: Request, res: Response): void => {
  const idDemanda = Number(req.params.id);

  // 404: erro se a demanda vinculada não existir
  const demandaExiste = demandas.some((d) => d.id === idDemanda);
  if (!demandaExiste) {
    res.status(404).json({ erro: 'Demanda não encontrada.' });
    return;
  }

  // 200: listar os comentários daquela demanda
  const comentariosFiltrados = comentarios.filter((c) => c.demandaId === idDemanda);
  res.status(200).json(comentariosFiltrados);
});

// POST /demandas/:id/comentarios
router.post('/demandas/:id/comentarios', (req: Request, res: Response): void => {
  const idDemanda = Number(req.params.id);
  const { usuarioId, texto } = req.body ?? {};

  // 404: erro se a demanda vinculada não existir
  const demandaExiste = demandas.some((d) => d.id === idDemanda);
  if (!demandaExiste) {
    res.status(404).json({ erro: 'Demanda não encontrada.' });
    return;
  }

  // 400: impedir comentários com texto vazio ou sem usuarioId
  if (!texto || String(texto).trim() === '' || usuarioId === undefined) {
    res.status(400).json({ erro: 'O texto do comentário e o usuarioId são obrigatórios.' });
    return;
  }

  // Validação: conferir se o usuário existe na lista do Leonardo
  const usuarioExiste = usuarios.some((u) => u.id === Number(usuarioId));
  if (!usuarioExiste) {
    res.status(400).json({ erro: 'O usuário informado não existe no sistema.' });
    return;
  }

  // Criar o comentário (ID incremental e data automática pelo servidor)
  const novoComentario: Comentario = {
    id: comentarios.length > 0 ? Math.max(...comentarios.map((c) => c.id)) + 1 : 1,
    demandaId: idDemanda,
    usuarioId: Number(usuarioId),
    texto: String(texto).trim(),
    dataCriacao: new Date()
  };

  comentarios.push(novoComentario);
  
  // 210: registro criado com sucesso
  res.status(201).json(novoComentario);
});

export default router;