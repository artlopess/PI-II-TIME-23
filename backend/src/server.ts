// Leonardo Antunes de Souza - Servidor do backend

// server.ts lê CORS_ORIGENS direto do ambiente, então carrega o .env explicitamente.
import 'dotenv/config';
import express from 'express';
import { iniciarBanco, fecharBanco } from './data/conexao';
import rotasAutenticacao from './rotas/autenticacao';

// Rotas de cadastro, edição e LISTAGEM de demanda e de projetos - Arthur Lopes Santos Silva
// A listagem (GET /demandas) ficava duplicada em backend/src/listagem.ts e em
// demandas.routes.ts na raiz. Ambos foram removidos: a única rota é este roteador.
import rotasDemandas from './rotas/demandas';
import rotasProjetos from './rotas/projetos';

// Rotas de detalhes e comentários da demanda - Pedro Businari Kawamoto
import rotasdetalhes from './rotas/detalhes';

// Rota do dashboard - Gabriel Augusto Jorge
import rotasDashboard from './rotas/dashboard';

const app = express();
const PORTA = 3000;

// Permite que a API entenda o JSON enviado no corpo das requisições.
// Sem esta linha o req.body chega vazio nas rotas POST e PUT.
app.use(express.json());

// CORS restrito às origens do frontend (Live Server costuma usar 5500 ou 3001).
// Outros sites não podem chamar a API com o token do usuário. Para ambientes
// diferentes, basta definir CORS_ORIGENS no .env com origens separadas por vírgula.
const ORIGENS_PERMITIDAS = (process.env.CORS_ORIGENS ?? [
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'http://localhost:5500',
  'http://127.0.0.1:5500'
].join(',')).split(',').map(origem => origem.trim()).filter(Boolean);

app.use(function (req, res, next) {
  const origem = req.headers.origin;

  // Quem não vem de navegador (testes, curl, chamadas de servidor) não envia
  // Origin; essas requisições seguem livres. Origens de navegador só passam
  // se estiverem na lista acima — nunca devolvemos curinga (*).
  if (origem && !ORIGENS_PERMITIDAS.includes(origem)) {
    res.status(403).json({ erro: 'Origem não autorizada.' });
    return;
  }

  if (origem) {
    res.header('Access-Control-Allow-Origin', origem);
    // Evita que um cache sirva a resposta de uma origem para outra.
    res.header('Vary', 'Origin');
  }

  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  // Authorization precisa constar aqui porque as rotas exigem token:
  // sem isso o navegador bloqueia o preflight das chamadas autenticadas.
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Max-Age', '86400');

  // Antes de um POST ou PUT o navegador manda OPTIONS só para perguntar se pode.
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }

  next();
});

// Resposta de acesso
app.get('/', (req, res) => {
  res.send('Servidor do Fluxo funcionando!');
});

// Rotas de cada integrante entram aqui
app.use(rotasAutenticacao);
app.use(rotasDemandas); // GET /demandas (listagem), POST /demandas e PUT /demandas/:id
app.use(rotasProjetos);
app.use(rotasdetalhes);
app.use(rotasDashboard); // Gabriel Augusto Jorge - GET /dashboard

// O servidor só começa a aceitar requisições depois que o pool Oracle estiver pronto.
// Assim uma falha de banco aparece imediatamente no terminal, não no meio de uma rota.
async function iniciarServidor(): Promise<void> {
  try {
    await iniciarBanco();

    app.listen(PORTA, () => {
      console.log('Servidor rodando em http://localhost:' + PORTA);
    });
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : String(erro);
    console.error('Não foi possível iniciar o servidor:', mensagem);
    console.error('Dica: confira DB_USUARIO, DB_SENHA e DB_CONEXAO no .env. Se as tabelas não existirem, rode "npm run seed" em backend/.');
    process.exit(1);
  }
}

// Fecha o pool ao encerrar com Ctrl+C ou sinal de término do sistema.
async function encerrarServidor(): Promise<void> {
  await fecharBanco();
  process.exit(0);
}

process.on('SIGINT', encerrarServidor);
process.on('SIGTERM', encerrarServidor);

iniciarServidor();