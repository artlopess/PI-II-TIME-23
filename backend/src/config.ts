// Leonardo Antunes de Souza - Configurações compartilhadas do backend

// Carrega o .env antes de ler qualquer variável de ambiente.
import "dotenv/config";

// Segredo usado para assinar e verificar os tokens: exclusivamente via .env.
// Não existe valor padrão — sem JWT_SEGREDO a API não pode assinar tokens,
// então falhamos na subida em vez de rodar com um segredo público e previsível.
const segredo = (process.env.JWT_SEGREDO ?? '').trim();

if (segredo === '') {
  throw new Error('JWT_SEGREDO não definido. Defina a variável no backend/.env (veja .env.example).');
}

export const SEGREDO = segredo;
