// frontend/src/types.ts

// Interface para um item no histórico de versões no frontend
export interface VersionHistoryEntry {
  content: string;
  editedAt: string; // Vem como string ISO do backend
  editor: string; // ID do editor
  editorName: string; // Nome do editor
}

// NOVA INTERFACE: Para um item de comentário no frontend
export interface Comment {
  _id: string; // ID do comentário (gerado pelo MongoDB)
  content: string;
  author: string; // ID do autor (string do ObjectId do MongoDB)
  authorName: string; // Nome do autor do comentário
  createdAt: string; // Data de criação como string ISO
}

export interface Note {
  _id: string; // O _id do MongoDB como string (ID real)
  title: string;
  content: string;
  author: string; // ID do autor (string do ObjectId do MongoDB)
  authorName: string;
  team: 'Geral' | 'Support TI' | 'Sistemas MV'; // Certifique-se de que os valores correspondem aos do backend
  tags: string[];
  versionHistory: VersionHistoryEntry[]; // Array de histórico de versões
  comments: Comment[]; // NOVO CAMPO: Array de comentários
  createdAt: string; // As datas vêm como strings ISO do MongoDB
  updatedAt: string; // As datas vêm como strings ISO do MongoDB
}

// NOVA INTERFACE: Para eventos do calendário
export interface Event {
  _id: string; // ID do evento
  title: string;
  description?: string;
  eventDate: string; // Vem como string ISO do backend
  eventTime?: string; // HH:MM
  notificationType: 'none' | 'hourBefore' | 'dayBefore';
  eventType: 'general' | 'birthday' | 'reminder';
  author: string; // ID do usuário que criou o evento
  authorName: string;
  team: 'Geral' | 'Support TI' | 'Sistemas MV';
  createdAt: string;
  updatedAt: string;
}

// ATUALIZAR ViewMode para incluir 'Calendar'
export type ViewMode = 'Geral' | 'Support TI' | 'Sistemas MV' | 'Admin' | 'Viewer' | 'Calendar';
