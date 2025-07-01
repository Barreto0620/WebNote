// @ts-nocheck

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User'; // Importa o modelo de usuário com sua interface

// Estende a interface Request do Express para incluir o campo 'user'
// Isso permite que os controladores acessem 'req.user' com tipagem forte após a autenticação.
declare global {
  namespace Express {
    interface Request {
      user?: IUser; // Define que req.user pode ser um IUser ou undefined
    }
  }
}

// Middleware de proteção de rotas
// Verifica a autenticidade do token JWT e anexa os dados do usuário à requisição.
const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token: string | undefined;

  // Verifica se o token JWT está presente no header Authorization no formato "Bearer TOKEN_JWT"
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extrai o token removendo o prefixo "Bearer "
      token = req.headers.authorization.split(' ')[1];

      // Decodifica o token JWT
      // Assegura que process.env.JWT_SECRET não é undefined, crucial para a segurança.
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string; role: string };

      // Busca o usuário no banco de dados pelo ID contido no token
      // O .select('-password') garante que a senha hasheada não seja carregada no objeto user
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        // Se o usuário não for encontrado (pode ter sido deletado do BD)
        res.status(401);
        throw new Error('Não autorizado, token inválido ou usuário não encontrado.');
      }

      // Anexa o objeto do usuário à requisição para ser acessível nos controladores subsequentes
      req.user = user;
      next(); // Continua para a próxima função middleware ou rota
    } catch (error: any) {
      console.error('Erro de autorização (token inválido ou expirado):', error.message);
      res.status(401).json({ message: 'Não autorizado, token inválido ou expirado.' });
    }
  }

  // Se nenhum token for fornecido no cabeçalho
  if (!token) {
    res.status(401).json({ message: 'Não autorizado, nenhum token de autenticação fornecido.' });
  }
};

export { protect };