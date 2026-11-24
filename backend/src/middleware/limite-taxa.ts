// Leonardo Antunes de Souza - Rate limiting simples aplicado a POST /login
//
// Objetivo: dificultar ataques de força bruta sem dependências extras.
// Guardamos em memória quantas tentativas cada IP fez na janela atual.
// Em uma reinicialização o contador zera — aceitável para este sistema
// acadêmico (em produção, use Redis ou outro armazenamento compartilhado).

import { Request, Response, NextFunction } from 'express';

const JANELA_MS = 15 * 60 * 1000; // 15 minutos
const MAX_TENTATIVAS = 5;

type Registro = {
  tentativas: number;
  expiraEm: number;
};

const tentativasPorIp = new Map<string, Registro>();

function identificarCliente(req: Request): string {
  // req.ip já considera o cabeçalho X-Forwarded-For quando app.set('trust proxy') está ativo.
  return req.ip || req.socket.remoteAddress || 'ip-desconhecido';
}

// Remove entradas vencidas de tempos em tempos para o Map não crescer sem limite.
function limparExpirados(agora: number): void {
  if (tentativasPorIp.size < 1000) {
    return;
  }

  for (const [chave, registro] of tentativasPorIp) {
    if (registro.expiraEm <= agora) {
      tentativasPorIp.delete(chave);
    }
  }
}

export function limitarTentativasLogin(req: Request, res: Response, next: NextFunction) {
  const agora = Date.now();
  const chave = identificarCliente(req);

  limparExpirados(agora);

  let registro = tentativasPorIp.get(chave);
  if (!registro || registro.expiraEm <= agora) {
    registro = { tentativas: 0, expiraEm: agora + JANELA_MS };
    tentativasPorIp.set(chave, registro);
  }

  if (registro.tentativas >= MAX_TENTATIVAS) {
    const segundosRestantes = Math.ceil((registro.expiraEm - agora) / 1000);
    res.setHeader('Retry-After', String(segundosRestantes));
    res.status(429).json({
      erro: `Muitas tentativas de login. Tente novamente em ${segundosRestantes} segundos.`
    });
    return;
  }

  // Cada chegada ao /login conta como tentativa. Um login correto chama
  // registrarLoginSucesso() e zera o contador daquele IP.
  registro.tentativas += 1;
  next();
}

export function registrarLoginSucesso(req: Request): void {
  tentativasPorIp.delete(identificarCliente(req));
}
