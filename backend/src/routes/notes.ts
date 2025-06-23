import { Router } from 'express';
import { getNotes, createNote, getNoteById, updateNote, deleteNote } from '../controllers/notesController';
import { protect } from '../middleware/authMiddleware'; // Importa o middleware de proteção

const router = Router();

// Aplica o middleware 'protect' a todas as rotas abaixo
router.use(protect); // Todas as rotas de notas agora exigem autenticação

// @route   GET /api/notes
// @access  Private
router.get('/', getNotes);

// @route   POST /api/notes
// @access  Private
router.post('/', createNote);

// @route   GET /api/notes/:id
// @access  Private
router.get('/:id', getNoteById);

// @route   PUT /api/notes/:id
// @access  Private
router.put('/:id', updateNote);

// @route   DELETE /api/notes/:id
// @access  Private
router.delete('/:id', deleteNote);

export default router;
