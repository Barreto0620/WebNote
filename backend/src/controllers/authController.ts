import { Request, Response } from 'express';
import User, { IUser } from '../models/User';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs'; // Importar bcryptjs para hashing

// Função auxiliar para gerar JWT
const generateToken = (id: string, role: string) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET as string, {
    expiresIn: '365d', // Token expira em 365 dias
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

// @desc    Alterar a senha do usuário logado
// @route   PUT /api/auth/change-password
// @access  Private (requer autenticação)
export const changePassword = async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const user = (req as any).user; // O usuário autenticado é anexado pelo middleware 'protect'

  if (!user) {
    return res.status(401).json({ message: 'Não autorizado, usuário não autenticado.' });
  }

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Por favor, forneça a senha atual e a nova senha.' });
  }

  // Validação básica da nova senha
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'A nova senha deve ter pelo menos 6 caracteres.' });
  }
  // Adicione outras validações de complexidade de senha aqui (min maiúsculas, números, símbolos, etc.)
  // if (!/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W)/.test(newPassword)) {
  //   return res.status(400).json({ message: 'A nova senha deve conter letras maiúsculas, minúsculas, números e símbolos.' });
  // }


  try {
    // Encontrar o usuário pelo ID e selecionar a senha (que normalmente é omitida)
    const foundUser = await User.findById(user._id).select('+password');

    if (!foundUser) {
      // Isso não deveria acontecer se o middleware 'protect' funcionar corretamente, mas é uma segurança.
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    // Verificar se a senha atual fornecida corresponde à senha do usuário
    const isMatch = await foundUser.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({ message: 'Senha atual incorreta.' });
    }

    // Se a nova senha for igual à atual, não faz sentido alterar
    if (newPassword === currentPassword) {
        return res.status(400).json({ message: 'A nova senha não pode ser igual à senha atual.' });
    }

    // CORREÇÃO: Atribuir a nova senha (ainda não hasheada) ao objeto do usuário.
    // O middleware 'pre("save")' do modelo User se encarregará de hashear.
    foundUser.password = newPassword; 

    // Salvar o usuário com a nova senha. O hash será feito no middleware 'pre("save")'.
    await foundUser.save();

    res.status(200).json({ message: 'Senha alterada com sucesso!' });

  } catch (error: any) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({ message: `Erro no servidor ao alterar senha: ${error.message}` });
  }
};
