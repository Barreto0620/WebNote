
export interface Note {
  id: string;
  authorId: string;
  authorName: string;
  team: 'Support TI' | 'Sistemas MV';
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  id: string;
  noteId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: Date;
}

export interface NoteVersion {
  id: string;
  noteId: string;
  content: string;
  title: string;
  authorId: string;
  createdAt: Date;
  changeDescription?: string;
}

export type ViewMode = 'Support TI' | 'Sistemas MV' | 'Geral';
