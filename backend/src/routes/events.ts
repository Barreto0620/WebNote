import { Router } from 'express';
import { getEvents, createEvent, getEventById, updateEvent, deleteEvent } from '../controllers/eventController';
import { protect } from '../middleware/authMiddleware'; // Importa o middleware de proteção

const router = Router();

// Aplica o middleware 'protect' a TODAS as rotas de eventos definidas abaixo.
// Isso garante que todas as operações relacionadas a eventos exijam autenticação.
router.use(protect);

// @route   GET /api/events
// @desc    Obter todos os eventos
// @access  Private (requer autenticação)
router.get('/', getEvents);

// @route   POST /api/events
// @desc    Criar um novo evento
// @access  Private (requer autenticação)
router.post('/', createEvent);

// @route   GET /api/events/:id
// @desc    Obter um evento por ID específico
// @access  Private (requer autenticação)
router.get('/:id', getEventById);

// @route   PUT /api/events/:id
// @desc    Atualizar um evento por ID específico
// @access  Private (requer autenticação)
router.put('/:id', updateEvent);

// @route   DELETE /api/events/:id
// @desc    Deletar um evento por ID específico
// @access  Private (requer autenticação)
router.delete('/:id', deleteEvent);

export default router;