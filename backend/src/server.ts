// Leonardo Antunes de Souza - Servidor básico do backend

import express from 'express';
import cors from 'cors'; // NOVO
import rotasUsuarios from './rotas/usuarios';
import rotasdetalhes from './rotas/detalhes'; 

const app = express();
app.use(cors()); // NOVO: libera o HTML (outra origem) a chamar a API; deve vir antes das rotas
app.use(express.json()); // sem isso o req.body vem vazio

// Liga as rotas de login e usuários
app.use(rotasUsuarios);

// Liga as rotas de detalhes e comentários do Pedro
app.use(rotasdetalhes);

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