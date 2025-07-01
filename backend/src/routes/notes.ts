import { Router } from 'express';
import { 
  getNotes, 
  createNote, 
  getNoteById, 
  updateNote, 
  deleteNote,
  addCommentToNote // Importa a nova função para adicionar comentários
} from '../controllers/notesController';
import { protect } from '../middleware/authMiddleware'; // Importa o middleware de proteção

const router = Router();

// Aplica o middleware 'protect' a TODAS as rotas de notas definidas abaixo.
// Isso garante que todas as operações relacionadas a notas (e comentários) exijam autenticação.
router.use(protect);

// @route   GET /api/notes
// @desc    Obter todas as notas
// @access  Private (requer autenticação)
router.get('/', getNotes);

// @route   POST /api/notes
// @desc    Criar uma nova nota
// @access  Private (requer autenticação)
router.post('/', createNote);

// @route   GET /api/notes/:id
// @desc    Obter uma nota por ID específico
// @access  Private (requer autenticação)
router.get('/:id', getNoteById);

// @route   PUT /api/notes/:id
// @desc    Atualizar uma nota por ID específico
// @access  Private (requer autenticação)
router.put('/:id', updateNote);

// @route   DELETE /api/notes/:id
// @desc    Deletar uma nota por ID específico
// @access  Private (requer autenticação)
router.delete('/:id', deleteNote);

// NOVA ROTA: Adicionar um comentário a uma nota específica
// @route   POST /api/notes/:id/comments
// @desc    Adicionar um comentário a uma nota
// @access  Private (requer autenticação)
router.post('/:id/comments', addCommentToNote);

export default router;