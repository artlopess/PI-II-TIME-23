// Leonardo Antunes de Souza - Servidor básico do backend

import express from 'express';

// Rotas de cadastro de demanda e projetos - Arthur Lopes Santos Silva
import rotasDemandas from './rotas/demandas';
import rotasProjetos from './rotas/projetos';

const app = express();

// Porta onde o servidor vai rodar
const PORTA = 3000;

// Permite que a API entenda o JSON enviado no corpo das requisições.
// Sem esta linha o req.body chega vazio nas rotas POST.
app.use(express.json());

// Resposta de acesso
app.get('/', (req, res) => {
  res.send('Servidor do Fluxo funcionando!');
});

// Registra as rotas dos integrantes
app.use(rotasDemandas);
app.use(rotasProjetos);

// Liga o servidor
app.listen(PORTA, () => {
  console.log('Servidor rodando em http://localhost:' + PORTA);
});