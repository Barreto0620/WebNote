import { Schema, model, Document, Types } from 'mongoose';

// Interface para um item no histórico de versões
interface IVersionHistory {
  content: string;
  editedAt: Date;
  editor: Types.ObjectId; // Referência ao ID do usuário que editou
  editorName: string;     // Nome do editor para exibição
}

// Extende a interface INote para incluir o campo de histórico
export interface INote extends Document {
  title: string;
  content: string;
  author: Types.ObjectId;
  authorName: string;
  team: 'Geral' | 'Support TI' | 'Sistemas MV';
  tags: string[];
  versionHistory: IVersionHistory[]; // NOVO CAMPO: Array de histórico de versões
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
  versionHistory: { // DEFINIÇÃO DO NOVO CAMPO versionHistory
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
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Middleware para atualizar o updatedAt e capturar a versão anterior
NoteSchema.pre('save', function(next) {
  // Se é um documento novo (isNew), adiciona a primeira versão ao histórico
  if (this.isNew) {
    // A primeira versão é o conteúdo inicial
    this.versionHistory.push({
      content: this.content,
      editedAt: this.createdAt, // Usar createdAt da nota para a primeira versão
      editor: this.author,
      editorName: this.authorName
    });
  }
  // Sempre atualiza o updatedAt
  this.updatedAt = new Date();
  next();
});

// Para updates feitos com findOneAndUpdate (direto do controller, não usando .save())
// É mais robusto lidar com o histórico no controller ou usar um método customizado
// Mas se o seu update usa findByIdAndUpdate, este pre hook pode ser útil,
// porém ele não tem acesso ao 'user' logado facilmente aqui.
// Vamos lidar com o histórico no controller para PUT, para ter acesso ao req.user
/*
NoteSchema.pre('findOneAndUpdate', async function(next) {
  const docToUpdate = await this.model.findOne(this.getQuery());
  if (docToUpdate) {
    const update = this.getUpdate() as any; // Obtém os dados da atualização
    if (update && update.content) { // Se o conteúdo está sendo atualizado
      docToUpdate.versionHistory.push({
        content: docToUpdate.content,
        editedAt: new Date(),
        editor: req.user._id, // ISSO NÃO FUNCIONA AQUI! req não está disponível.
        editorName: req.user.name // Por isso vamos fazer no controller para PUT.
      });
      // Importante: Não chame docToUpdate.save() aqui, pois pode causar loop
      // Lidar com isso diretamente no controller é mais limpo.
    }
  }
  this.set({ updatedAt: new Date() });
  next();
});
*/

const Note = model<INote>('Note', NoteSchema);

export default Note;
