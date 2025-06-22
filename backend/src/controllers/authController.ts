import { Request, Response } from 'express';
import User, { IUser } from '../models/User';
import jwt from 'jsonwebtoken';

// Função auxiliar para gerar JWT
const generateToken = (id: string, role: string) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET as string, {
    expiresIn: '1h', // Token expira em 1 hora
  });
};

// @desc    Registrar novo usuário (opcional, pode ser usado para criar usuários iniciais)
// @route   POST /api/auth/register
// @access  Public (ou Private, dependendo da sua estratégia de registro)
export const registerUser = async (req: Request, res: Response) => {
  const { email, password, name, role } = req.body;

  // Validação básica de entrada
  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Por favor, insira todos os campos obrigatórios: email, senha e nome.' });
  }

  try {
    // Verificar se o usuário já existe
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Usuário com este email já existe.' });
    }

    // Criar novo usuário
    const newUser: IUser = new User({ email, password, name, role: role || 'Viewer' });
    const savedUser = await newUser.save();

    // Retorna o usuário sem a senha e um token
    res.status(201).json({
      _id: savedUser._id,
      name: savedUser.name,
      email: savedUser.email,
      role: savedUser.role,
      token: generateToken(savedUser._id.toString(), savedUser.role),
    });

  } catch (error: any) {
    console.error('Erro ao registrar usuário:', error);
    res.status(500).json({ message: `Erro no servidor: ${error.message}` });
  }
};


// @desc    Autenticar usuário e obter token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Validação de entrada
  if (!email || !password) {
    return res.status(400).json({ message: 'Por favor, insira email e senha.' });
  }

  try {
    // Encontrar o usuário pelo email (selecionando a senha também)
    const user = await User.findOne({ email }).select('+password');

    // Verificar se o usuário existe e se a senha está correta
    if (user && (await user.comparePassword(password))) {
      // Retorna o usuário (sem a senha) e o token JWT
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id.toString(), user.role),
      });
    } else {
      res.status(401).json({ message: 'Credenciais inválidas (email ou senha).' });
    }
  } catch (error: any) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ message: `Erro no servidor: ${error.message}` });
  }
};
