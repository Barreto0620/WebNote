// ==== 1. src/types/index.ts (CRIAR ESTE ARQUIVO) ====
import { Request } from 'express';
import { ObjectId } from 'mongoose';

export interface IUser {
  _id: ObjectId;
  email: string;
  name: string;
  role: 'Support TI' | 'Sistemas MV' | 'Admin' | 'Viewer';
  password: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword: (password: string) => Promise<boolean>;
}

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

// ==== 2. src/controllers/authController.ts (CORREÇÃO) ====
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { generateToken } from '../utils/jwt';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, role } = req.body;

    // Verificar se o usuário já existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Usuário já existe' });
    }

    // Hash da senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Criar usuário
    const user = new User({
      email,
      password: hashedPassword,
      name,
      role
    });

    const savedUser = await user.save();

    // Gerar token - CORREÇÃO: usar string() para converter ObjectId
    const token = generateToken(savedUser._id.toString(), savedUser.role);

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: {
        id: savedUser._id,
        email: savedUser.email,
        name: savedUser.name,
        role: savedUser.role
      },
      token
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Buscar usuário
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    // Gerar token - CORREÇÃO: usar toString() para converter ObjectId
    const token = generateToken(user._id.toString(), user.role);

    res.json({
      message: 'Login realizado com sucesso',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// ==== 3. src/controllers/eventController.ts (CORREÇÃO) ====
import { Response } from 'express';
import Event from '../models/Event';
import { AuthenticatedRequest } from '../types';

export const getEvents = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const events = await Event.find().sort({ date: -1 });
    res.json(events);
  } catch (error) {
    console.error('Erro ao buscar eventos:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const createEvent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, description, date, priority, status } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    // Verificar permissões
    if (user.role === 'Viewer') {
      return res.status(403).json({ message: 'Sem permissão para criar eventos' });
    }

    const event = new Event({
      title,
      description,
      date,
      priority,
      status,
      createdBy: user._id
    });

    const savedEvent = await event.save();
    res.status(201).json(savedEvent);
  } catch (error) {
    console.error('Erro ao criar evento:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const getEventById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const event = await Event.findById(req.params.id).populate('createdBy', 'name email');
    
    if (!event) {
      return res.status(404).json({ message: 'Evento não encontrado' });
    }

    res.json(event);
  } catch (error) {
    console.error('Erro ao buscar evento:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const updateEvent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    // CORREÇÃO: Permitir Admin e outros roles (exceto Viewer)
    if (user.role === 'Viewer') {
      return res.status(403).json({ message: 'Sem permissão para atualizar eventos' });
    }

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!event) {
      return res.status(404).json({ message: 'Evento não encontrado' });
    }

    res.json(event);
  } catch (error) {
    console.error('Erro ao atualizar evento:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const deleteEvent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    if (user.role !== 'Admin') {
      return res.status(403).json({ message: 'Sem permissão para deletar eventos' });
    }

    const event = await Event.findByIdAndDelete(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Evento não encontrado' });
    }

    res.json({ message: 'Evento deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar evento:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// ==== 4. src/controllers/notesController.ts (CORREÇÃO) ====
import { Response } from 'express';
import Note from '../models/Note';
import { AuthenticatedRequest } from '../types';

export const getNotes = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const notes = await Note.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(notes);
  } catch (error) {
    console.error('Erro ao buscar notas:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const createNote = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, content, category, priority, tags } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    if (user.role === 'Viewer') {
      return res.status(403).json({ message: 'Sem permissão para criar notas' });
    }

    const note = new Note({
      title,
      content,
      category,
      priority,
      tags,
      createdBy: user._id
    });

    const savedNote = await note.save();
    const populatedNote = await Note.findById(savedNote._id).populate('createdBy', 'name email');
    
    res.status(201).json(populatedNote);
  } catch (error) {
    console.error('Erro ao criar nota:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const getNoteById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const note = await Note.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('comments.createdBy', 'name email');
    
    if (!note) {
      return res.status(404).json({ message: 'Nota não encontrada' });
    }

    res.json(note);
  } catch (error) {
    console.error('Erro ao buscar nota:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const updateNote = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    if (user.role === 'Viewer') {
      return res.status(403).json({ message: 'Sem permissão para atualizar notas' });
    }

    const note = await Note.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('createdBy', 'name email');

    if (!note) {
      return res.status(404).json({ message: 'Nota não encontrada' });
    }

    res.json(note);
  } catch (error) {
    console.error('Erro ao atualizar nota:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const deleteNote = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    if (user.role !== 'Admin') {
      return res.status(403).json({ message: 'Sem permissão para deletar notas' });
    }

    const note = await Note.findByIdAndDelete(req.params.id);

    if (!note) {
      return res.status(404).json({ message: 'Nota não encontrada' });
    }

    res.json({ message: 'Nota deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar nota:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const addCommentToNote = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { content } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    const note = await Note.findById(req.params.id);
    
    if (!note) {
      return res.status(404).json({ message: 'Nota não encontrada' });
    }

    const comment = {
      content,
      createdBy: user._id,
      createdAt: new Date()
    };

    note.comments.push(comment);
    await note.save();

    const updatedNote = await Note.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('comments.createdBy', 'name email');

    res.json(updatedNote);
  } catch (error) {
    console.error('Erro ao adicionar comentário:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// ==== 5. src/routes/events.ts (CORREÇÃO) ====
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getEvents,
  createEvent,
  getEventById,
  updateEvent,
  deleteEvent
} from '../controllers/eventController';

const router = Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticateToken);

// CORREÇÃO: Usar RequestHandler corretamente
router.get('/', getEvents);
router.post('/', createEvent);
router.get('/:id', getEventById);
router.put('/:id', updateEvent);
router.delete('/:id', deleteEvent);

export default router;

// ==== 6. src/routes/notes.ts (CORREÇÃO) ====
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getNotes,
  createNote,
  getNoteById,
  updateNote,
  deleteNote,
  addCommentToNote
} from '../controllers/notesController';

const router = Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticateToken);

// CORREÇÃO: Usar RequestHandler corretamente
router.get('/', getNotes);
router.post('/', createNote);
router.get('/:id', getNoteById);
router.put('/:id', updateNote);
router.delete('/:id', deleteNote);

// Rota para comentários
router.post('/:id/comments', addCommentToNote);

export default router;