import { Schema, model, Document, Types } from 'mongoose';

// Interface para um item no histórico de versões
interface IVersionHistory {
  content: string;
  editedAt: Date;
  editor: Types.ObjectId; // Referência ao ID do usuário que editou
  editorName: string;     // Nome do editor para exibição
}

// NOVA INTERFACE: Para um item de comentário
interface IComment {
  _id?: Types.ObjectId; // ID opcional para o comentário (será gerado pelo MongoDB)
  content: string;
  author: Types.ObjectId; // Referência ao ID do usuário que comentou
  authorName: string;     // Nome do autor do comentário
  createdAt: Date;
}

// Extende a interface INote para incluir o campo de histórico E comentários
export interface INote extends Document {
  title: string;
  content: string;
  author: Types.ObjectId;
  authorName: string;
  team: 'Geral' | 'Support TI' | 'Sistemas MV';
  tags: string[];
  versionHistory: IVersionHistory[];
  comments: IComment[]; // NOVO CAMPO: Array de comentários
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema = new Schema<INote>({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  authorName: { type: String, required: true },
  team: {
    type: String,
    enum: ['Geral', 'Support TI', 'Sistemas MV'],
    required: true,
    default: 'Geral'
  },
  tags: {
    type: [String],
    default: []
  },
  versionHistory: {
    type: [
      {
        content: { type: String, required: true },
        editedAt: { type: Date, default: Date.now },
        editor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        editorName: { type: String, required: true }
      }
    ],
    default: []
  },
  comments: { // DEFINIÇÃO DO NOVO CAMPO 'comments'
    type: [
      {
        content: { type: String, required: true },
        author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        authorName: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    default: []
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Middleware para atualizar o updatedAt e capturar a versão anterior
NoteSchema.pre('save', function(next) {
  if (this.isNew) {
    this.versionHistory.push({
      content: this.content,
      editedAt: this.createdAt,
      editor: this.author,
      editorName: this.authorName
    });
  }
  this.updatedAt = new Date();
  next();
});

const Note = model<INote>('Note', NoteSchema);

export default Note;
