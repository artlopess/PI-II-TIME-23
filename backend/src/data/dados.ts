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

// Gabriel Augusto Jorge - função auxiliar para os dados de teste
// Gera uma data N dias a partir de hoje 
// Assim os prazos sempre ficam "perto de hoje", em qualquer dia que testarmos.
function diasAPartirDeHoje(dias: number): Date {
  const data = new Date();               // pega a data de hoje
  data.setDate(data.getDate() + dias);   // soma (ou subtrai) os dias
  return data;
}

export const demandas: Demanda[] = [
  { id: 1, titulo: 'Configurar rotas do Express', descricao: 'Criar os endpoints básicos para a API usando TypeScript.', tipo: 'Tarefa',  prioridade: 'Alta',    status: 'Em andamento', projetoId: 101, responsavelId: 4,    dataCriacao: new Date(), dataAtualizacao: new Date() },
  { id: 2, titulo: 'Bug na validação de senha',   descricao: 'O sistema aceita senhas com menos de 8 caracteres.',        tipo: 'Defeito', prioridade: 'Crítica', status: 'Aberta',       projetoId: 101, responsavelId: null, dataCriacao: new Date(), dataAtualizacao: new Date() },

  // Gabriel Augusto Jorge - demandas extras para testar o dashboard
  { id: 3,  titulo: 'Tela de listagem de demandas',      descricao: 'Criar a listagem com filtros por status.', tipo: 'Tarefa',       prioridade: 'Média',   status: 'Concluída',    projetoId: 101, responsavelId: 5,    dataCriacao: diasAPartirDeHoje(-20), dataAtualizacao: diasAPartirDeHoje(-5),  prazoFinalizacao: diasAPartirDeHoje(-4) },
  { id: 4,  titulo: 'Erro ao salvar comentário',         descricao: 'Comentário é gravado duas vezes.',         tipo: 'Defeito',      prioridade: 'Crítica', status: 'Em andamento', projetoId: 101, responsavelId: 1,    dataCriacao: diasAPartirDeHoje(-6),  dataAtualizacao: diasAPartirDeHoje(-1),  prazoFinalizacao: diasAPartirDeHoje(2) },
  { id: 5,  titulo: 'Melhorar mensagens de erro',        descricao: 'Mensagens mais claras nos formulários.',   tipo: 'Melhoria',     prioridade: 'Alta',    status: 'Em revisão',   projetoId: 101, responsavelId: 3,    dataCriacao: diasAPartirDeHoje(-9),  dataAtualizacao: diasAPartirDeHoje(-1),  prazoFinalizacao: diasAPartirDeHoje(5) },
  { id: 6,  titulo: 'Documentar rotas da API',           descricao: 'Descrever os endpoints no README.',        tipo: 'Documentação', prioridade: 'Baixa',   status: 'Aberta',       projetoId: 101, responsavelId: null, dataCriacao: diasAPartirDeHoje(-3),  dataAtualizacao: diasAPartirDeHoje(-3),  prazoFinalizacao: diasAPartirDeHoje(20) },
  { id: 7,  titulo: 'Trocar cor do botão principal',     descricao: 'Seguir o novo padrão visual.',             tipo: 'Melhoria',     prioridade: 'Baixa',   status: 'Cancelada',    projetoId: 101, responsavelId: 5,    dataCriacao: diasAPartirDeHoje(-15), dataAtualizacao: diasAPartirDeHoje(-10), prazoFinalizacao: diasAPartirDeHoje(3) },
  { id: 8,  titulo: 'Cadastro aceita e-mail inválido',   descricao: 'Falta validar o formato do e-mail.',       tipo: 'Defeito',      prioridade: 'Alta',    status: 'Aberta',       projetoId: 101, responsavelId: 2,    dataCriacao: diasAPartirDeHoje(-5),  dataAtualizacao: diasAPartirDeHoje(-5),  prazoFinalizacao: diasAPartirDeHoje(-2) },
  { id: 9,  titulo: 'Manual do usuário',                 descricao: 'Passo a passo do cadastro de demanda.',    tipo: 'Documentação', prioridade: 'Média',   status: 'Em andamento', projetoId: 101, responsavelId: 4,    dataCriacao: diasAPartirDeHoje(-12), dataAtualizacao: diasAPartirDeHoje(-2),  prazoFinalizacao: diasAPartirDeHoje(6) },
  { id: 10, titulo: 'Falha no login com token expirado', descricao: 'Usuário é deslogado sem aviso.',           tipo: 'Defeito',      prioridade: 'Crítica', status: 'Concluída',    projetoId: 101, responsavelId: 1,    dataCriacao: diasAPartirDeHoje(-30), dataAtualizacao: diasAPartirDeHoje(-8),  prazoFinalizacao: diasAPartirDeHoje(-7) },
];

export const comentarios: Comentario[] = [
  { id: 1, demandaId: 1, usuarioId: 3, texto: 'Iniciei a estrutura comum do backend.', dataCriacao: new Date() },
];