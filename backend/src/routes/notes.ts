import { Router } from 'express';
import { getNotes, createNote, getNoteById, updateNote, deleteNote } from '../controllers/notesController';

const router = Router();

router.route('/')
  .get(getNotes)
  .post(createNote);

router.route('/:id')
  .get(getNoteById)
  .put(updateNote)
  .delete(deleteNote);

export default router;