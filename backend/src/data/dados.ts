// Leonardo Antunes de Souza - Dados de teste em memória

// Os três perfis previstos no escopo
export type Perfil = 'Administrador' | 'Líder de Projeto' | 'Membro da Equipe';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  senha: string;
  perfil: Perfil;
}

export const usuarios: Usuario[] = [
  { id: 1, nome: 'Arthur Lopes',    email: 'arthur_lopes@fluxo.com',     senha: 'Senha@1234', perfil: 'Membro da Equipe' },
  { id: 2, nome: 'Gabriel Augusto', email: 'gabriel_augusto@fluxo.com',  senha: 'Senha@1234', perfil: 'Administrador' },
  { id: 3, nome: 'Leonardo Souza',  email: 'leonardo_souza@fluxo.com',   senha: 'Senha@1234', perfil: 'Líder de Projeto' },
  { id: 4, nome: 'Pedro Businari',  email: 'pedro_businari@fluxo.com',   senha: 'Senha@1234', perfil: 'Administrador' },
  { id: 5, nome: 'Pedro Osti',      email: 'pedro_osti@fluxo.com',       senha: 'Senha@1234', perfil: 'Membro da Equipe' },
];