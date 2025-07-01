import { Router } from 'express';
import { registerUser, loginUser, changePassword } from '../controllers/authController'; // Importa as funções do controlador de autenticação
import { protect } from '../middleware/authMiddleware'; // Importa o middleware de proteção de rotas

const router = Router();

// Rota para registro de usuário. Por padrão, deixamos pública para que novos usuários possam ser criados.
// Em um ambiente de produção real, você pode querer que apenas Admins possam registrar novos usuários.
router.post('/register', registerUser);

// Rota para login de usuário. Deve ser pública para permitir o acesso inicial.
router.post('/login', loginUser);

// NOVA ROTA: Rota para alterar a senha.
// Esta rota é PROTEGIDA, o que significa que o usuário deve estar autenticado para acessá-la.
router.put('/change-password', protect, changePassword);

export default router;