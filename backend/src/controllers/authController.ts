import { Request, Response } from 'express';
import User, { IUser } from '../models/User'; // Importa o modelo de usuário e sua interface
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Função auxiliar para gerar um JSON Web Token (JWT)
const generateToken = (id: string, role: string) => {
  // O segredo do JWT deve ser uma variável de ambiente segura em produção
  return jwt.sign({ id, role }, process.env.JWT_SECRET as string, {
    expiresIn: '365d', // Token expira em 365 dias (ajuste conforme a política de segurança)
  });
};

// @desc    Registrar novo usuário
// @route   POST /api/auth/register
// @access  Public (ou Private, se o registro for apenas por admins)
export const registerUser = async (req: Request, res: Response) => {
  const { email, password, name, role } = req.body;

  // Validação básica de entrada para campos obrigatórios
  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Por favor, forneça email, senha e nome para o registro.' });
  }

  try {
    // Verifica se já existe um usuário com o email fornecido
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Um usuário com este email já está registrado.' });
    }

    // Cria um novo usuário. O hash da senha será automaticamente realizado
    // pelo middleware `pre('save')` definido no modelo User.
    const newUser: IUser = new User({ email, password, name, role: role || 'Viewer' }); // Define 'Viewer' como padrão se não especificado
    const savedUser = await newUser.save();

    // Retorna os dados do usuário (sem a senha) e um token de autenticação
    res.status(201).json({
      _id: savedUser._id,
      name: savedUser.name,
      email: savedUser.email,
      role: savedUser.role,
      token: generateToken(savedUser._id.toString(), savedUser.role),
    });

  } catch (error: any) {
    console.error('Erro ao registrar usuário:', error);
    res.status(500).json({ message: `Erro no servidor ao registrar usuário: ${error.message}` });
  }
};

// @desc    Autenticar usuário e obter token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Validação de entrada para email e senha
  if (!email || !password) {
    return res.status(400).json({ message: 'Por favor, forneça email e senha para o login.' });
  }

  try {
    // Encontra o usuário pelo email e explicitamente seleciona a senha para comparação
    const user = await User.findOne({ email }).select('+password');

    // Verifica se o usuário existe e se a senha fornecida corresponde à senha armazenada (hasheada)
    if (user && (await user.comparePassword(password))) {
      // Retorna os dados do usuário (sem a senha) e o token JWT
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id.toString(), user.role),
      });
    } else {
      res.status(401).json({ message: 'Credenciais inválidas: email ou senha incorretos.' });
    }
  } catch (error: any) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ message: `Erro no servidor ao autenticar: ${error.message}` });
  }
};

// @desc    Alterar a senha do usuário logado
// @route   PUT /api/auth/change-password
// @access  Private (requer autenticação via token JWT)
export const changePassword = async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  // O objeto 'user' é anexado à requisição pelo middleware 'protect'
  const user = req.user; 

  if (!user) {
    return res.status(401).json({ message: 'Não autorizado: usuário não autenticado.' });
  }

  // Validação para garantir que ambas as senhas foram fornecidas
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Por favor, forneça a senha atual e a nova senha.' });
  }

  // Validação de complexidade da nova senha
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'A nova senha deve ter pelo menos 6 caracteres.' });
  }
  // Adicione outras regras de complexidade aqui (ex: Regex para maiúsculas, números, símbolos)

  try {
    // Busca o usuário no banco de dados, incluindo a senha para comparação
    const foundUser = await User.findById(user._id).select('+password');

    // Verifica se o usuário foi encontrado (segurança extra, já que 'protect' já deveria garantir isso)
    if (!foundUser) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    // Compara a senha atual fornecida com a senha hasheada no banco de dados
    const isMatch = await foundUser.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({ message: 'A senha atual fornecida está incorreta.' });
    }

    // Impede que a nova senha seja igual à senha atual
    if (newPassword === currentPassword) {
        return res.status(400).json({ message: 'A nova senha não pode ser igual à senha atual.' });
    }

    // Atribui a nova senha. O middleware `pre('save')` do modelo User irá hashear a nova senha automaticamente.
    foundUser.password = newPassword; 
    await foundUser.save(); // Salva o usuário com a nova senha hasheada

    res.status(200).json({ message: 'Senha alterada com sucesso!' });

  } catch (error: any) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({ message: `Erro no servidor ao alterar senha: ${error.message}` });
  }
};