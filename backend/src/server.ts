import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import connectDB from './config/db';
import notesRoutes from './routes/notes';
import authRoutes from './routes/auth';

// Carrega variáveis de ambiente
dotenv.config({ path: '.env' }); 

// ADICIONE ESTA LINHA PARA DEBUGAR
console.log('JWT_SECRET carregado:', process.env.JWT_SECRET); 

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

// Rota de teste
app.get('/', (req, res) => {
  res.send('API de Notas está online!');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Servidor rodando em modo ${process.env.NODE_ENV || 'development'} na porta ${PORT}`);
});
