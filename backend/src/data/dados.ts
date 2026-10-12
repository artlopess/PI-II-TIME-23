// Leonardo Antunes de Souza - Dados de teste em memória

// Os três perfis previstos no escopo
export const usuarios = [
  { id: 1, nome: 'Arthur Lopes', email: 'arthur_lopes@fluxo.com', senha: 'Senha@123', perfil: 'Membro da Equipe' },
  { id: 2, nome: 'Gabriel Augusto', email: 'gabriel_augusto@fluxo.com', senha: 'Senha@123', perfil: 'Administrador' },
  { id: 3, nome: 'Leonardo Souza', email: 'leonardo_souza@fluxo.com', senha: 'Senha@123', perfil: 'Membro da Equipe' },
  { id: 4, nome: 'Pedro Businari', email: 'pedro_businari@fluxo.com', senha: 'Senha@123', perfil: 'Administrador' },
  { id: 5, nome: 'Pedro Osti', email: 'pedro_osti@fluxo.com', senha: 'Senha@123', perfil: 'Líder de Projeto' },
];

// Projetos de exemplo
export const projetos = [
  { id: 1, nome: 'Portal do Aluno' },
  { id: 2, nome: 'App de Entregas' },
  { id: 3, nome: 'Sistema Financeiro' },
];

// Formato de uma demanda
export interface Demanda {
  id: number;
  titulo: string;
  descricao: string;
  tipo: string;
  prioridade: string;
  status: string;
  projetoId: number;
  responsavelId: number | null;
  dataCriacao: string;
  dataAtualizacao: string;
  prazo: string | null;
}

// Demandas de teste com tipos, prioridades, status e prazos variados
export const demandas: Demanda[] = [
  {
    id: 1,
    titulo: 'Corrigir cálculo do frete para pedidos acima de R$ 200',
    descricao: 'O frete continua sendo cobrado mesmo com a regra de frete grátis ativa.',
    tipo: 'Defeito',
    prioridade: 'Alta',
    status: 'Em andamento',
    projetoId: 2,
    responsavelId: 3,
    dataCriacao: '2026-09-18T09:12:00.000Z',
    dataAtualizacao: '2026-09-24T15:40:00.000Z',
    prazo: '2026-10-20',
  },
  {
    id: 2,
    titulo: 'Tela de login aceita senha em branco',
    descricao: 'É possível entrar no sistema sem digitar a senha.',
    tipo: 'Defeito',
    prioridade: 'Crítica',
    status: 'Aberta',
    projetoId: 1,
    responsavelId: null,
    dataCriacao: '2026-10-01T10:00:00.000Z',
    dataAtualizacao: '2026-10-01T10:00:00.000Z',
    prazo: '2026-10-15',
  },
  {
    id: 3,
    titulo: 'Criar relatório mensal de vendas',
    descricao: 'Relatório com o total vendido por mês e por vendedor.',
    tipo: 'Tarefa',
    prioridade: 'Média',
    status: 'Em revisão',
    projetoId: 3,
    responsavelId: 2,
    dataCriacao: '2026-09-05T08:30:00.000Z',
    dataAtualizacao: '2026-10-08T11:20:00.000Z',
    prazo: '2026-10-30',
  },
  {
    id: 4,
    titulo: 'Melhorar tempo de carregamento da listagem',
    descricao: 'A listagem demora mais de 5 segundos com muitos registros.',
    tipo: 'Melhoria',
    prioridade: 'Média',
    status: 'Aberta',
    projetoId: 2,
    responsavelId: 4,
    dataCriacao: '2026-10-03T14:00:00.000Z',
    dataAtualizacao: '2026-10-03T14:00:00.000Z',
    prazo: '2026-11-10',
  },
  {
    id: 5,
    titulo: 'Escrever manual de instalação do sistema',
    descricao: 'Documentar os passos para instalar o sistema em um servidor novo.',
    tipo: 'Documentação',
    prioridade: 'Baixa',
    status: 'Concluída',
    projetoId: 1,
    responsavelId: 5,
    dataCriacao: '2026-08-20T09:00:00.000Z',
    dataAtualizacao: '2026-09-15T17:00:00.000Z',
    prazo: '2026-09-15',
  },
  {
    id: 6,
    titulo: 'Servidor fica fora do ar ao gerar nota fiscal',
    descricao: 'Ao gerar a nota, a aplicação para de responder e precisa ser reiniciada.',
    tipo: 'Defeito',
    prioridade: 'Crítica',
    status: 'Aberta',
    projetoId: 3,
    responsavelId: 2,
    dataCriacao: '2026-10-09T16:45:00.000Z',
    dataAtualizacao: '2026-10-09T16:45:00.000Z',
    prazo: '2026-10-14',
  },
  {
    id: 7,
    titulo: 'Padronizar as cores dos botões do sistema',
    descricao: 'Alguns botões usam azul claro e outros azul escuro.',
    tipo: 'Melhoria',
    prioridade: 'Baixa',
    status: 'Cancelada',
    projetoId: 1,
    responsavelId: null,
    dataCriacao: '2026-09-10T13:00:00.000Z',
    dataAtualizacao: '2026-09-28T10:00:00.000Z',
    prazo: null,
  },
  {
    id: 8,
    titulo: 'Permitir exportar a listagem de demandas em PDF',
    descricao: 'O usuário precisa baixar a listagem filtrada em PDF.',
    tipo: 'Tarefa',
    prioridade: 'Alta',
    status: 'Em andamento',
    projetoId: 2,
    responsavelId: 3,
    dataCriacao: '2026-09-28T11:30:00.000Z',
    dataAtualizacao: '2026-10-07T09:15:00.000Z',
    prazo: '2026-10-18',
  },
];

// Como ainda não existe banco de dados, o próximo id é controlado aqui
export function proximoIdDemanda(): number {
  let maiorId = 0;

  // for...of percorre a lista item por item, sem usar índice
  for (const demanda of demandas) {
    if (demanda.id > maiorId) {
      maiorId = demanda.id;
    }
  }

  return maiorId + 1;
}