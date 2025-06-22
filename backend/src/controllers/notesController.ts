import { Request, Response } from 'express';
import Note, { INote } from '../models/Note';

// @desc    Obter todas as notas
// @route   GET /api/notes
// @access  Public
export const getNotes = async (req: Request, res: Response) => {
  try {
    const notes = await Note.find().sort({ createdAt: -1 });
    res.json(notes);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Criar uma nova nota
// @route   POST /api/notes
// @access  Public
export const createNote = async (req: Request, res: Response) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ message: 'Por favor, inclua título e conteúdo para a nota.' });
  }

  try {
    const newNote: INote = new Note({ title, content });
    const savedNote = await newNote.save();
    res.status(201).json(savedNote);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Obter uma nota por ID
// @route   GET /api/notes/:id
// @access  Public
export const getNoteById = async (req: Request, res: Response) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ message: 'Nota não encontrada.' });
    }
    res.json(note);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Atualizar uma nota
// @route   PUT /api/notes/:id
// @access  Public
export const updateNote = async (req: Request, res: Response) => {
  const { title, content } = req.body;

  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ message: 'Nota não encontrada.' });
    }

    note.title = title || note.title;
    note.content = content || note.content;
    note.updatedAt = new Date(); // Atualiza explicitamente o updatedAt

    const updatedNote = await note.save();
    res.json(updatedNote);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Deletar uma nota
// @route   DELETE /api/notes/:id
// @access  Public
export const deleteNote = async (req: Request, res: Response) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ message: 'Nota não encontrada.' });
    }

    await Note.deleteOne({ _id: req.params.id }); // Use deleteOne para Mongoose >= 6
    res.json({ message: 'Nota removida com sucesso.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};