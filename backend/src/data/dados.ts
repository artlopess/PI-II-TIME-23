// Leonardo Antunes de Souza - Dados de teste em memória (provisório até o Oracle)

import bcrypt from 'bcryptjs';

// Todos os usuários de teste usam a mesma senha, guardada como hash (nunca em texto puro)
const HASH_PADRAO = bcrypt.hashSync('Senha@1234', 10);

// Os três perfis previstos no escopo
export const usuarios = [
  { id: 1, nome: 'Arthur Lopes',    email: 'arthur_lopes@fluxo.com',    senhaHash: HASH_PADRAO, perfil: 'Membro da Equipe' },
  { id: 2, nome: 'Gabriel Augusto', email: 'gabriel_augusto@fluxo.com', senhaHash: HASH_PADRAO, perfil: 'Administrador' },
  { id: 3, nome: 'Leonardo Souza',  email: 'leonardo_souza@fluxo.com',  senhaHash: HASH_PADRAO, perfil: 'Líder de Projeto' },
  { id: 4, nome: 'Pedro Businari',  email: 'pedro_businari@fluxo.com',  senhaHash: HASH_PADRAO, perfil: 'Administrador' },
  { id: 5, nome: 'Pedro Osti',      email: 'pedro_osti@fluxo.com',      senhaHash: HASH_PADRAO, perfil: 'Membro da Equipe' },
];

// Projetos de exemplo
export const projetos = [
  { id: 1, nome: '' },
  { id: 2, nome: '' },
  { id: 3, nome: '' },
];