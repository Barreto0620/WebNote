// @ts-nocheck

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import connectDB from './config/db'; // Importa a função de conexão com o banco de dados
import notesRoutes from './routes/notes';     // Importa as rotas de notas
import authRoutes from './routes/auth';       // Importa as rotas de autenticação
import eventRoutes from './routes/events';    // Importa as rotas de eventos

// Carrega variáveis de ambiente do arquivo .env (para desenvolvimento local).
// Deve ser chamado o mais cedo possível no arquivo de entrada principal.
dotenv.config(); 

// Cria a instância da aplicação Express
const app = express();

// Conecta ao banco de dados MongoDB
connectDB();

// Middlewares essenciais
app.use(express.json()); // Middleware para analisar corpos de requisição JSON
app.use(cors());         // Habilita o Cross-Origin Resource Sharing para permitir requisições de diferentes origens (e.g., frontend)
app.use(helmet());       // Adiciona cabeçalhos HTTP de segurança para proteger contra algumas vulnerabilidades conhecidas

// Definição das rotas da API
app.use('/api/notes', notesRoutes);   // Todas as rotas que começam com /api/notes serão gerenciadas por notesRoutes
app.use('/api/auth', authRoutes);     // Todas as rotas que começam com /api/auth serão gerenciadas por authRoutes
app.use('/api/events', eventRoutes);  // Todas as rotas que começam com /api/events serão gerenciadas por eventRoutes

// Rota de Health Check para serviços de deploy (como Render) verificarem se a aplicação está online
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'UP', message: 'Serviço de Notas Internas está operacional.' });
});

// Rota raiz para uma mensagem de boas-vindas simples
app.get('/', (req, res) => {
  res.send('API de Notas Internas está online e funcionando!');
});

// Define a porta do servidor, usando a variável de ambiente PORT ou o padrão 5000
const PORT = process.env.PORT || 5000;

// Inicia o servidor Express
app.listen(PORT, () => {
  // Exibe uma mensagem no console informando que o servidor está rodando
  // O modo NODE_ENV é definido automaticamente pelo Render como 'production' em deploy
  console.log(`Servidor rodando em modo ${process.env.NODE_ENV || 'development'} na porta ${PORT}`);
  console.log(`Acesse a API em http://localhost:${PORT}`);
});