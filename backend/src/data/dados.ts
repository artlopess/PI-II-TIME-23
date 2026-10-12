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

// Pedro Businari Kawamoto - Dados de teste em memória

// Os tipos, prioridades e status previstos no escopo
export type TipoDemanda = 'Tarefa' | 'Defeito' | 'Melhoria' | 'Documentação';
export type PrioridadeDemanda = 'Crítica' | 'Alta' | 'Média' | 'Baixa';
export type StatusDemanda = 'Aberta' | 'Em andamento' | 'Em revisão' | 'Concluída' | 'Cancelada';

export interface Comentario {
  id: number;
  demandaId: number;
  usuarioId: number;
  texto: string;
  dataCriacao: Date;
}

export interface Demanda {
  id: number;
  titulo: string;
  descricao: string;
  tipo: TipoDemanda;
  prioridade: PrioridadeDemanda;
  status: StatusDemanda;
  projetoId: number;
  responsavelId: number | null;
  dataCriacao: Date;
  dataAtualizacao: Date;
  prazoFinalizacao?: Date;
}

export const demandas: Demanda[] = [
  { id: 1, titulo: 'Configurar rotas do Express', descricao: 'Criar os endpoints básicos para a API usando TypeScript.', tipo: 'Tarefa',  prioridade: 'Alta',    status: 'Em andamento', projetoId: 101, responsavelId: 4,    dataCriacao: new Date(), dataAtualizacao: new Date() },
  { id: 2, titulo: 'Bug na validação de senha',   descricao: 'O sistema aceita senhas com menos de 8 caracteres.',        tipo: 'Defeito', prioridade: 'Crítica', status: 'Aberta',       projetoId: 101, responsavelId: null, dataCriacao: new Date(), dataAtualizacao: new Date() },
];

export const comentarios: Comentario[] = [
  { id: 1, demandaId: 1, usuarioId: 3, texto: 'Iniciei a estrutura comum do backend.', dataCriacao: new Date() },
];