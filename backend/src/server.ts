// Leonardo Antunes de Souza - Servidor do backend

import express from 'express';
import cors from 'cors';
import rotasAutenticacao from './rotas/autenticacao';

// Rotas de cadastro e edição de demanda e de projetos - Arthur Lopes Santos Silva
import rotasDemandas from './rotas/demandas';
import rotasProjetos from './rotas/projetos';

const app = express();
const PORTA = 3000;

// Permite que a API entenda o JSON enviado no corpo das requisições.
// Sem esta linha o req.body chega vazio nas rotas POST e PUT.
app.use(express.json());

// Libera o acesso das telas à API (CORS).
// As telas abrem em outra porta (5500, do Live Server) e, sem estas linhas,
// o navegador bloqueia as chamadas por serem de origem diferente.
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  // Antes de um POST ou PUT o navegador manda uma requisição OPTIONS
  // só para perguntar se pode. Respondemos que sim e encerramos aqui.
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
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
app.use(rotasDemandas);
app.use(rotasProjetos);

app.listen(PORTA, () => {
  console.log('Servidor rodando em http://localhost:' + PORTA);
});