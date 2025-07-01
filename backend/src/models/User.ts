import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

// Define a interface para o documento do usuário no MongoDB
export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: 'Admin' | 'Support TI' | 'Sistemas MV' | 'Viewer'; // Papéis de usuário predefinidos
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>; // Método de instância para comparação de senhas
}

// Define o esquema do usuário para o Mongoose
const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: [true, 'O email é obrigatório.'],
    unique: true, // Garante que cada email seja único no banco de dados
    lowercase: true, // Converte o email para minúsculas antes de salvar
    match: [/^.+@.+\..+$/, 'Por favor, insira um email válido.'] // Regex simples para validação de formato de email
  },
  password: {
    type: String,
    required: [true, 'A senha é obrigatória.'],
    minlength: [6, 'A senha deve ter pelo menos 6 caracteres.'],
    select: false // Impede que o campo de senha seja retornado em consultas padrão
  },
  name: {
    type: String,
    required: [true, 'O nome é obrigatório.']
  },
  role: {
    type: String,
    enum: ['Admin', 'Support TI', 'Sistemas MV', 'Viewer'], // Limita os valores permitidos para o papel
    default: 'Viewer' // Define 'Viewer' como o papel padrão para novos usuários
  },
  createdAt: {
    type: Date,
    default: Date.now // Define a data de criação padrão
  },
  updatedAt: {
    type: Date,
    default: Date.now // Define a data de atualização padrão
  }
}, {
  timestamps: true // Adiciona automaticamente campos `createdAt` e `updatedAt` (redundante com os defaults, mas boa prática)
});

// Middleware Mongoose `pre('save')`: Hashea a senha antes de salvar um documento.
// Isso garante que as senhas nunca sejam armazenadas em texto simples.
UserSchema.pre('save', async function (next) {
  // Apenas hashea a senha se ela foi modificada (ou é um novo documento)
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10); // Gera um salt para o hashing
  this.password = await bcrypt.hash(this.password, salt); // Hashea a senha
  this.updatedAt = new Date(); // Garante que updatedAt seja atualizado
  next();
});

// Middleware Mongoose `pre('findOneAndUpdate')`: Atualiza o campo `updatedAt`
// quando um documento é atualizado usando `findOneAndUpdate`.
UserSchema.pre('findOneAndUpdate', function (next) {
  this.set({ updatedAt: new Date() });
  next();
});

// Método de instância para comparar uma senha fornecida com a senha hasheada armazenada.
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  // Usa bcrypt para comparar a senha fornecida com a senha hasheada do usuário
  return await bcrypt.compare(candidatePassword, this.password);
};

// Cria e exporta o modelo User
const User = model<IUser>('User', UserSchema);

export default User;