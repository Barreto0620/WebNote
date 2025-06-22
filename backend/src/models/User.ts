import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

// Define a interface para o documento do usuário
export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: 'Admin' | 'Support TI' | 'Sistemas MV' | 'Viewer';
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>; // Método para comparar senhas
}

// Define o esquema do usuário
const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: [true, 'Por favor, insira um email'],
    unique: true,
    lowercase: true,
    match: [/^.+@.+\..+$/, 'Por favor, insira um email válido'] // Regex simples para validação de email
  },
  password: {
    type: String,
    required: [true, 'Por favor, insira uma senha'],
    minlength: [6, 'A senha deve ter pelo menos 6 caracteres'],
    select: false // Não retorna a senha em consultas padrão
  },
  name: {
    type: String,
    required: [true, 'Por favor, insira um nome']
  },
  role: {
    type: String,
    enum: ['Admin', 'Support TI', 'Sistemas MV', 'Viewer'], // Define os papéis permitidos
    default: 'Viewer'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware Mongoose: Hash da senha antes de salvar
UserSchema.pre('save', async function (next) {
  // Apenas hash se a senha foi modificada (ou é nova)
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10); // Gera um salt
  this.password = await bcrypt.hash(this.password, salt); // Hash da senha
  this.updatedAt = new Date(); // Atualiza updatedAt
  next();
});

// Middleware Mongoose: Atualiza updatedAt em update
UserSchema.pre('findOneAndUpdate', function (next) {
  this.set({ updatedAt: new Date() });
  next();
});

// Método para comparar a senha inserida com a senha hasheada no banco de dados
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = model<IUser>('User', UserSchema);

export default User;
