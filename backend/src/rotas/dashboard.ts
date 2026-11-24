// Gabriel Augusto Jorge - Rota GET /dashboard (Reunião 4)
// Devolve os indicadores do dashboard em JSON, calculados a partir das demandas
// lidas do Oracle. Time 23: a rota exige token e respeita o escopo por perfil —
// o que o Administrador vê é diferente do que o Líder e o Membro veem.

import { Router } from 'express';
import { listarDemandas, Demanda } from '../repostiorios/demandas';
import { verificarToken, podeVerDemanda } from '../middleware/autenticacao';

const router = Router();

router.get('/dashboard', verificarToken, async (req, res) => {
  // PARÂMETRO dias (situação de erro)
  // Permite mudar a janela de "próximas do prazo" pela URL: /dashboard?dias=3
  // Se não for informado, o padrão é 7 dias.
  let DIAS_PRAZO = 7;
  const diasInformado = req.query.dias;   // req.query lê o que vem depois do "?" na URL

  // "?dias=" chega como texto vazio: nesse caso vale o padrão de 7 dias.
  if (diasInformado !== undefined && String(diasInformado).trim() !== "") {
    const numero = Number(diasInformado);  // tenta transformar o texto em número

    // Se não for um número inteiro, ou se for negativo, responde 400 e para aqui
    if (!Number.isInteger(numero) || numero < 0) {
      res.status(400).json({
        erro: "O parâmetro 'dias' deve ser um número inteiro maior ou igual a 0."
      });
      return; // o return faz a função parar; nada abaixo dele é executado
    }

    DIAS_PRAZO = numero;
  }

  const todas = await listarDemandas();

  // Admin vê todas; Líder vê as dos seus projetos; Membro só as atribuídas a ele.
  const visiveis: Demanda[] = [];

  for (const demanda of todas) {
    if (await podeVerDemanda(res.locals.usuario, demanda)) {
      visiveis.push(demanda);
    }
  }

  // Total: quantas demandas existem na lista
  const total = visiveis.length;

  // Por status: o filter() pega só as demandas daquele status
  // e o .length conta quantas sobraram
  const porStatus = {
    'Aberta':       visiveis.filter(d => d.status === 'Aberta').length,
    'Em andamento': visiveis.filter(d => d.status === 'Em andamento').length,
    'Em revisão':   visiveis.filter(d => d.status === 'Em revisão').length,
    'Concluída':    visiveis.filter(d => d.status === 'Concluída').length,
    'Cancelada':    visiveis.filter(d => d.status === 'Cancelada').length,
  };

  // Por prioridade: mesma ideia do status, mas olhando o campo "prioridade"
  const porPrioridade = {
    'Crítica': visiveis.filter(d => d.prioridade === 'Crítica').length,
    'Alta':    visiveis.filter(d => d.prioridade === 'Alta').length,
    'Média':   visiveis.filter(d => d.prioridade === 'Média').length,
    'Baixa':   visiveis.filter(d => d.prioridade === 'Baixa').length,
  };

  // Por tipo: agora olhando o campo "tipo"
  const porTipo = {
    'Tarefa':       visiveis.filter(d => d.tipo === 'Tarefa').length,
    'Defeito':      visiveis.filter(d => d.tipo === 'Defeito').length,
    'Melhoria':     visiveis.filter(d => d.tipo === 'Melhoria').length,
    'Documentação': visiveis.filter(d => d.tipo === 'Documentação').length,
  };

  //  CRITÉRIO "EM ABERTO"
  // Em aberto = status diferente de 'Concluída' e de 'Cancelada'
  // (ou seja: Aberta, Em andamento ou Em revisão)
  const emAberto = visiveis.filter(d => d.status !== 'Concluída' && d.status !== 'Cancelada');

  // Críticas em aberto: das que estão em aberto, só as de prioridade Crítica
  const criticasEmAberto = emAberto.filter(d => d.prioridade === 'Crítica');

  // CRITÉRIO "PRÓXIMAS DO PRAZO"
  // Em aberto + tem prazo + o prazo vence entre hoje e os próximos 7 dias
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);                       // hoje, começo do dia (00:00)

  const limite = new Date(hoje);
  limite.setDate(limite.getDate() + DIAS_PRAZO);   // daqui a 7 dias
  limite.setHours(23, 59, 59, 999);                // até o fim desse dia

  const proximasDoPrazo = emAberto.filter(d => {
    if (!d.prazo) return false; // sem prazo, não entra na lista

    // O prazo vem como texto ('2026-11-10'). O 'T00:00:00' faz ele virar
    // meia-noite no horário do Brasil (sem isso, a data "volta" um dia).
    const prazo = new Date(d.prazo + 'T00:00:00');

    return prazo.getTime() >= hoje.getTime() &&   // não venceu
           prazo.getTime() <= limite.getTime();   // vence dentro da janela
  });

  res.status(200).json({
    total,
    totalEmAberto: emAberto.length,
    porStatus,
    porPrioridade,
    porTipo,
    // Contagens explícitas para quem consome o JSON não precisar de .length.
    totalCriticasEmAberto: criticasEmAberto.length,
    totalProximasDoPrazo: proximasDoPrazo.length,
    criticasEmAberto,
    proximasDoPrazo,
  });
});

export default router;
