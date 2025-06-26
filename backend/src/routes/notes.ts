import { Router } from 'express';
import { 
  getNotes, 
  createNote, 
  getNoteById, 
  updateNote, 
  deleteNote,
  addCommentToNote // Importa a nova função
} from '../controllers/notesController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

// Aplica o middleware 'protect' a todas as rotas abaixo
router.use(protect); // Todas as rotas de notas agora exigem autenticação

// Rotas principais de notas
router.get('/', getNotes);
router.post('/', createNote);
router.get('/:id', getNoteById);
router.put('/:id', updateNote);
router.delete('/:id', deleteNote);

// NOVA ROTA: Adicionar comentário a uma nota específica
// POST /api/notes/:id/comments
router.post('/:id/comments', addCommentToNote);

export default router;
