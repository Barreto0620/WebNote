import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // A conexão agora depende EXCLUSIVAMENTE da variável de ambiente MONGO_URI.
    // Isso é essencial para a segurança em produção e para a flexibilidade do ambiente.
    const mongoURI = process.env.MONGO_URI;

    if (!mongoURI) {
      console.error('ERRO FATAL: Variável de ambiente MONGO_URI não definida. Por favor, configure-a no arquivo .env ou no ambiente de produção.');
      process.exit(1); // Encerra o processo se a URI não estiver disponível
    }
    
    const conn = await mongoose.connect(mongoURI);
    console.log(`MongoDB Conectado: ${conn.connection.host}`);
  } catch (error: any) {
    console.error(`Erro ao conectar ao MongoDB: ${error.message}`);
    process.exit(1); // Sai do processo com erro para indicar falha crítica
  }
};

export default connectDB;