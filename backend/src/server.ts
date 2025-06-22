import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import connectDB from './config/db';
import notesRoutes from './routes/notes';

dotenv.config({ path: '.env' }); // Carrega variáveis de ambiente da raiz do monorepo ou .env no backend

const app = express();

// Conectar ao banco de dados
connectDB();

// Middlewares
app.use(express.json()); // Body parser para JSON
app.use(cors()); // Habilita CORS para que o frontend possa se conectar
app.use(helmet()); // Adiciona cabeçalhos de segurança HTTP

// Rotas da API
app.use('/api/notes', notesRoutes);

// Rota de teste
app.get('/', (req, res) => {
  res.send('API de Notas está online!');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Servidor rodando em modo ${process.env.NODE_ENV || 'development'} na porta ${PORT}`);
});