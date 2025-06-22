import { Schema, model, Document } from 'mongoose';

export interface INote extends Document {
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema = new Schema<INote>({
  title: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Atualiza o updatedAt antes de salvar
NoteSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Note = model<INote>('Note', NoteSchema);

export default Note;