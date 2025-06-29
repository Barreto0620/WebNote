import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import connectDB from './config/db';
import notesRoutes from './routes/notes';
import authRoutes from './routes/auth';
import eventRoutes from './routes/events';

// Carrega variáveis de ambiente do arquivo .env (para desenvolvimento local)
dotenv.config(); 

const app = express();

// Conectar ao banco de dados
connectDB();

// Middlewares
app.use(express.json()); // Body parser para JSON
app.use(cors()); // Habilita CORS para que o frontend possa se conectar
app.use(helmet()); // Adiciona cabeçalhos de segurança HTTP

// Rotas da API
app.use('/api/notes', notesRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);

// Rota de Health Check para o Render verificar se a aplicação está online
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

// Rota raiz para uma mensagem de boas-vindas
app.get('/', (req, res) => {
  res.send('API de Notas Internas está online!');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  // O modo NODE_ENV é definido automaticamente pelo Render como 'production'
  console.log(`Servidor rodando em modo ${process.env.NODE_ENV || 'development'} na porta ${PORT}`);
});
