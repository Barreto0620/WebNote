// frontend/src/types.ts
export interface Note {
  _id: string; // O _id do MongoDB como string (real ID)
  id?: string; // Opcional, caso Mongoose mapeie _id para id automaticamente
  title: string;
  content: string;
  author: string; // ID do autor (string do ObjectId do MongoDB)
  authorName: string;
  team: 'Geral' | 'Support TI' | 'Sistemas MV'; // Certifique-se de que os valores correspondem aos do backend
  tags: string[];
  createdAt: string; // As datas vêm como strings ISO do MongoDB
  updatedAt: string;
  // Adicione este campo se implementar o histórico de versões real no backend
  // versionHistory?: Array<{
  //   content: string;
  //   editedAt: string;
  //   editorId: string;
  //   editorName: string;
  // }>;
}

// Certifique-se de que estes tipos de ViewMode estão alinhados com as roles do seu AuthContext
export type ViewMode = 'Geral' | 'Support TI' | 'Sistemas MV' | 'Admin' | 'Viewer';
