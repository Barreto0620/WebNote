import { Schema, model, Document, Types } from 'mongoose';

// Interface para um item no histórico de versão da nota
export interface IVersionHistory {
  content: string;
  editedAt: Date;
  editor: Types.ObjectId; // Referência ao ID do usuário que editou
  editorName: string;     // Nome do usuário que editou (para facilitar a exibição)
}

// Interface para um comentário em uma nota
export interface IComment {
  _id?: Types.ObjectId;   // O MongoDB adiciona _id automaticamente
  content: string;
  author: Types.ObjectId; // Referência ao ID do usuário que comentou
  authorName: string;     // Nome do usuário que comentou
  createdAt: Date;
}

// Interface principal para o documento da nota
export interface INote extends Document {
  title: string;
  content: string;
  author: Types.ObjectId; // Referência ao ID do usuário criador
  authorName: string;     // Nome do usuário criador
  team: 'Geral' | 'Support TI' | 'Sistemas MV'; // Equipe à qual a nota pertence
  tags: string[];         // Array de tags para categorização
  versionHistory: IVersionHistory[]; // Histórico de versões do conteúdo da nota
  comments: IComment[];   // Array de comentários
  createdAt: Date;
  updatedAt: Date;
}

// Esquema para o histórico de versão
const VersionHistorySchema = new Schema<IVersionHistory>({
  content: { type: String, required: true },
  editedAt: { type: Date, default: Date.now },
  editor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  editorName: { type: String, required: true }
}, { _id: false }); // Não gera _id para subdocumentos no histórico se não for necessário identificá-los individualmente

// Esquema para o comentário
const CommentSchema = new Schema<IComment>({
  content: { type: String, required: true },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: false // Comentários têm seu próprio createdAt
});

// Esquema principal da nota
const NoteSchema = new Schema<INote>({
  title: {
    type: String,
    required: [true, 'O título da nota é obrigatório.']
  },
  content: {
    type: String,
    required: [true, 'O conteúdo da nota é obrigatório.']
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User', // Referência ao modelo 'User'
    required: true
  },
  authorName: {
    type: String,
    required: true
  },
  team: {
    type: String,
    enum: ['Geral', 'Support TI', 'Sistemas MV'], // Limita as equipes permitidas
    required: [true, 'A equipe da nota é obrigatória.']
  },
  tags: {
    type: [String], // Array de strings
    default: []
  },
  versionHistory: {
    type: [VersionHistorySchema],
    default: []
  },
  comments: {
    type: [CommentSchema],
    default: []
  }
}, {
  timestamps: true // Adiciona `createdAt` e `updatedAt` automaticamente
});

// Middleware `pre('save')` para adicionar a versão inicial ao histórico
NoteSchema.pre('save', function (next) {
  // Se é uma nova nota e o histórico está vazio, adicione a versão inicial
  if (this.isNew && this.versionHistory.length === 0) {
    this.versionHistory.push({
      content: this.content,
      editedAt: this.createdAt || new Date(), // Usa createdAt se disponível, senão new Date()
      editor: this.author,
      editorName: this.authorName
    });
  }
  next();
});

const Note = model<INote>('Note', NoteSchema);

export default Note;