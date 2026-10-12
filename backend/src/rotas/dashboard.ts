// Gabriel Augusto Jorge - Rota GET /dashboard (Reunião 4)
// Devolve os indicadores do dashboard em JSON, calculados a partir dos dados de teste.

import { Router } from 'express';
import { demandas } from '../data/dados';

const router = Router();

router.get('/dashboard', (req, res) => {
      // PARÂMETRO dias (situação de erro)
  // Permite mudar a janela de "próximas do prazo" pela URL: /dashboard?dias=3
  // Se não for informado, o padrão é 7 dias.
  let DIAS_PRAZO = 7;
  const diasInformado = req.query.dias;   // req.query lê o que vem depois do "?" na URL

  if (diasInformado !== undefined) {
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
  // Total: quantas demandas existem na lista
  const total = demandas.length;

  // Por status: o filter() pega só as demandas daquele status
  // e o .length conta quantas sobraram
  const porStatus = {
    'Aberta':       demandas.filter(d => d.status === 'Aberta').length,
    'Em andamento': demandas.filter(d => d.status === 'Em andamento').length,
    'Em revisão':   demandas.filter(d => d.status === 'Em revisão').length,
    'Concluída':    demandas.filter(d => d.status === 'Concluída').length,
    'Cancelada':    demandas.filter(d => d.status === 'Cancelada').length,
  };

    // Por prioridade: mesma ideia do status, mas olhando o campo "prioridade"
  const porPrioridade = {
    'Crítica': demandas.filter(d => d.prioridade === 'Crítica').length,
    'Alta':    demandas.filter(d => d.prioridade === 'Alta').length,
    'Média':   demandas.filter(d => d.prioridade === 'Média').length,
    'Baixa':   demandas.filter(d => d.prioridade === 'Baixa').length,
  };

  // Por tipo: agora olhando o campo "tipo"
  const porTipo = {
    'Tarefa':       demandas.filter(d => d.tipo === 'Tarefa').length,
    'Defeito':      demandas.filter(d => d.tipo === 'Defeito').length,
    'Melhoria':     demandas.filter(d => d.tipo === 'Melhoria').length,
    'Documentação': demandas.filter(d => d.tipo === 'Documentação').length,
  };

    //  CRITÉRIO "EM ABERTO"
  // Em aberto = status diferente de 'Concluída' e de 'Cancelada'
  // (ou seja: Aberta, Em andamento ou Em revisão)
  const emAberto = demandas.filter(d => d.status !== 'Concluída' && d.status !== 'Cancelada');

  // Críticas em aberto: das que estão em aberto, só as de prioridade Crítica
  const criticasEmAberto = emAberto.filter(d => d.prioridade === 'Crítica');

  // CRITÉRIO "PRÓXIMAS DO PRAZO" 
  // Em aberto + tem prazo + o prazo vence entre hoje e os próximos 7 dias
  

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);                       // hoje, começo do dia (00:00)

  const limite = new Date(hoje);
  limite.setDate(limite.getDate() + DIAS_PRAZO);   // daqui a 7 dias
  limite.setHours(23, 59, 59, 999);                // até o fim desse dia

  const proximasDoPrazo = emAberto.filter(d =>
    d.prazoFinalizacao !== undefined &&                          // precisa ter prazo
    d.prazoFinalizacao.getTime() >= hoje.getTime() &&            // não pode já ter vencido
    d.prazoFinalizacao.getTime() <= limite.getTime()             // vence em até 7 dias
  );

    res.status(200).json({
    total,
    totalEmAberto: emAberto.length,
    porStatus,
    porPrioridade,
    porTipo,
    criticasEmAberto,
    proximasDoPrazo,
  });
});

export default router;