import { Router } from 'express';
import { registerUser, loginUser, changePassword } from '../controllers/authController'; // Importar changePassword
import { protect } from '../middleware/authMiddleware'; // Importar middleware de proteção

const router = Router();

// Rota para registro de usuário (opcional)
router.post('/register', registerUser);

// Rota para login de usuário
router.post('/login', loginUser);

// NOVA ROTA: Rota para alterar a senha (PROTEGIDA)
router.put('/change-password', protect, changePassword); // Aplica 'protect' para exigir autenticação

export default router;
