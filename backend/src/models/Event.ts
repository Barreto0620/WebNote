import { Schema, model, Document, Types } from 'mongoose';

// Define a interface para um documento de Evento
export interface IEvent extends Document {
  title: string; // Título do evento (ex: "Reunião de Equipe", "Aniversário do João")
  description?: string; // Descrição detalhada do evento
  eventDate: Date; // A data específica do evento (formato ISO Date)
  eventTime?: string; // Opcional: Hora do evento (formato HH:MM, ex: "14:30")
  notificationType: 'none' | 'hourBefore' | 'dayBefore'; // Tipo de notificação
  eventType: 'general' | 'birthday' | 'reminder'; // Categoria do evento
  author: Types.ObjectId; // ID do usuário que criou o evento
  authorName: string; // Nome do usuário que criou o evento
  team: 'Geral' | 'Support TI' | 'Sistemas MV'; // Equipe à qual o evento está associado
  createdAt: Date; // Timestamp de criação
  updatedAt: Date; // Timestamp da última atualização
}

// Define o Schema Mongoose para o Evento
const EventSchema = new Schema<IEvent>({
  title: { type: String, required: true },
  description: { type: String },
  eventDate: { type: Date, required: true },
  eventTime: {
    type: String,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, // Valida formato HH:MM
    required: false // Hora é opcional
  },
  notificationType: {
    type: String,
    enum: ['none', 'hourBefore', 'dayBefore'],
    default: 'none',
    required: true
  },
  eventType: {
    type: String,
    enum: ['general', 'birthday', 'reminder'],
    default: 'general',
    required: true
  },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String, required: true },
  team: {
    type: String,
    enum: ['Geral', 'Support TI', 'Sistemas MV'],
    required: true,
  },
}, {
  timestamps: true, // Adiciona automaticamente createdAt e updatedAt
});

// Cria o modelo 'Event'
const Event = model<IEvent>('Event', EventSchema);

export default Event;
