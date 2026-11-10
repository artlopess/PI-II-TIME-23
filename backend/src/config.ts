// Leonardo Antunes de Souza - Configurações compartilhadas do backend

// Segredo usado para assinar e verificar os tokens (em produção vem do .env)
export const SEGREDO = process.env.JWT_SEGREDO ?? 'segredo-de-desenvolvimento';