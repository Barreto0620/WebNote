import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // A conexão agora depende EXCLUSIVAMENTE da variável de ambiente.
    // Isso é essencial para a segurança em produção.
    const mongoURI = process.env.MONGO_URI;

    if (!mongoURI) {
      console.error('ERRO FATAL: Variável de ambiente MONGO_URI não definida.');
      process.exit(1);
    }
    
    const conn = await mongoose.connect(mongoURI);
    console.log(`MongoDB Conectado: ${conn.connection.host}`);
  } catch (error: any) {
    console.error(`Erro ao conectar ao MongoDB: ${error.message}`);
    process.exit(1); // Sai do processo com erro
  }
};

export default connectDB;
