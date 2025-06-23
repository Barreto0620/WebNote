// frontend/src/types.ts

// Interface para um item no histórico de versões no frontend
export interface VersionHistoryEntry {
  content: string;
  editedAt: string; // Vem como string ISO do backend
  editor: string; // ID do editor
  editorName: string; // Nome do editor
}

export interface Note {
  _id: string; // O _id do MongoDB como string (ID real)
  title: string;
  content: string;
  author: string; // ID do autor (string do ObjectId do MongoDB)
  authorName: string;
  team: 'Geral' | 'Support TI' | 'Sistemas MV'; // Certifique-se de que os valores correspondem aos do backend
  tags: string[];
  versionHistory: VersionHistoryEntry[]; // NOVO CAMPO: Array de histórico de versões
  createdAt: string; // As datas vêm como strings ISO do MongoDB
  updatedAt: string; // As datas vêm como strings ISO do MongoDB
}

// Certifique-se de que estes tipos de ViewMode estão alinhados com as roles do seu AuthContext
export type ViewMode = 'Geral' | 'Support TI' | 'Sistemas MV' | 'Admin' | 'Viewer';
