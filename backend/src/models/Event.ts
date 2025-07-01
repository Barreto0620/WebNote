import { Schema, model, Document, Types } from 'mongoose';

// Interface para o documento do evento
export interface IEvent extends Document {
  title: string;
  description?: string; // Descrição opcional
  eventDate: Date;
  eventTime?: string; // Horário do evento (ex: "10:00", "14:30")
  notificationType: 'Email' | 'Slack' | 'Both' | 'None'; // Tipo de notificação
  eventType: 'Meeting' | 'Maintenance' | 'Training' | 'Other'; // Tipo de evento
  author: Types.ObjectId; // Referência ao ID do usuário criador
  authorName: string;     // Nome do usuário criador
  team: 'Geral' | 'Support TI' | 'Sistemas MV'; // Equipe à qual o evento pertence
  createdAt: Date;
  updatedAt: Date;
}

// Define o esquema do evento
const EventSchema = new Schema<IEvent>({
  title: {
    type: String,
    required: [true, 'O título do evento é obrigatório.']
  },
  description: {
    type: String
  },
  eventDate: {
    type: Date,
    required: [true, 'A data do evento é obrigatória.']
  },
  eventTime: {
    type: String // Armazenar como string para flexibilidade (ex: "10:00", "14:30")
  },
  notificationType: {
    type: String,
    enum: ['Email', 'Slack', 'Both', 'None'], // Tipos de notificação permitidos
    default: 'None',
    required: [true, 'O tipo de notificação é obrigatório.']
  },
  eventType: {
    type: String,
    enum: ['Meeting', 'Maintenance', 'Training', 'Other'], // Tipos de evento permitidos
    default: 'Other',
    required: [true, 'O tipo de evento é obrigatório.']
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
    required: [true, 'A equipe do evento é obrigatória.']
  }
}, {
  timestamps: true // Adiciona `createdAt` e `updatedAt` automaticamente
});

// Índices para otimizar consultas (ex: filtrar por data e equipe)
EventSchema.index({ eventDate: 1, team: 1 });
EventSchema.index({ team: 1 });


const Event = model<IEvent>('Event', EventSchema);

export default Event;