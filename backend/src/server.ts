// Leonardo Antunes de Souza - Servidor básico do backend

import express from 'express';

const app = express();

// Porta onde o servidor vai rodar
const PORTA = 3000;

// Resposta de acesso
app.get('/', (req, res) => {
  res.send('Servidor do Fluxo funcionando!');
});

// Liga o servidor
app.listen(PORTA, () => {
  console.log('Servidor rodando em http://localhost:' + PORTA);
});