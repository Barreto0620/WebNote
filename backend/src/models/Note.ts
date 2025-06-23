import { Schema, model, Document, Types } from 'mongoose'; // Importe Types para ObjectId

// Extende a interface INote para incluir o autor e a equipe
export interface INote extends Document {
  title: string;
  content: string;
  author: Types.ObjectId; // Referência ao ID do usuário que criou a nota
  authorName: string;     // Nome do autor para facilitar a exibição
  team: 'Geral' | 'Support TI' | 'Sistemas MV'; // Equipe/Departamento ao qual a nota pertence
  tags: string[];         // Array de tags
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema = new Schema<INote>({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: {
    type: Schema.Types.ObjectId, // Tipo ObjectId para referência a outro documento
    required: true,
    ref: 'User' // Referencia a coleção 'User'
  },
  authorName: { type: String, required: true },
  team: {
    type: String,
    enum: ['Geral', 'Support TI', 'Sistemas MV'], // Define as equipes permitidas
    required: true,
    default: 'Geral' // Valor padrão
  },
  tags: {
    type: [String], // Array de strings
    default: []
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Atualiza o updatedAt antes de salvar
NoteSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Middleware para atualizar updatedAt também em findOneAndUpdate (para updates)
NoteSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

const Note = model<INote>('Note', NoteSchema);

export default Note;
