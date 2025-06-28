import { Router } from 'express';
import { getEvents, createEvent, getEventById, updateEvent, deleteEvent } from '../controllers/eventController';
import { protect } from '../middleware/authMiddleware'; // Importa o middleware de proteção

const router = Router();

// Aplica o middleware 'protect' a todas as rotas de eventos
router.use(protect); // Todas as rotas de eventos agora exigem autenticação

// @route   GET /api/events
// @access  Private
router.get('/', getEvents);

// @route   POST /api/events
// @access  Private
router.post('/', createEvent);

// @route   GET /api/events/:id
// @access  Private
router.get('/:id', getEventById);

// @route   PUT /api/events/:id
// @access  Private
router.put('/:id', updateEvent);

// @route   DELETE /api/events/:id
// @access  Private
router.delete('/:id', deleteEvent);

export default router;
