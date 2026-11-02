// Leonardo Antunes de Souza - Servidor do backend

import express from 'express';
import cors from 'cors';
import rotasAutenticacao from './rotas/autenticacao';

const app = express();
const PORTA = 3000;

app.use(cors());          // permite que o HTML chame a API
app.use(express.json());  // permite ler o JSON enviado no body

app.get('/', (req, res) => {
  res.send('Servidor do Fluxo funcionando!');
});

// Rotas de cada integrante entram aqui
app.use(rotasAutenticacao);

app.listen(PORTA, () => {
  console.log('Servidor rodando em http://localhost:' + PORTA);
});