
import { Note, Comment, NoteVersion } from '@/types';

const NOTES_KEY = 'mario_covas_notes';
const COMMENTS_KEY = 'mario_covas_comments';
const VERSIONS_KEY = 'mario_covas_versions';

// Notes storage
export const getNotes = (): Note[] => {
  const stored = localStorage.getItem(NOTES_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveNote = (note: Note): void => {
  const notes = getNotes();
  const existingIndex = notes.findIndex(n => n.id === note.id);
  
  if (existingIndex >= 0) {
    // Create version before updating
    const oldNote = notes[existingIndex];
    saveVersion({
      id: `${note.id}_${Date.now()}`,
      noteId: note.id,
      content: oldNote.content,
      title: oldNote.title,
      authorId: oldNote.authorId,
      createdAt: new Date(oldNote.updatedAt),
      changeDescription: 'Versão anterior'
    });
    
    notes[existingIndex] = note;
  } else {
    notes.push(note);
  }
  
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
};

export const deleteNote = (noteId: string): void => {
  const notes = getNotes().filter(n => n.id !== noteId);
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  
  // Also delete related comments and versions
  const comments = getComments().filter(c => c.noteId !== noteId);
  localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments));
  
  const versions = getVersions().filter(v => v.noteId !== noteId);
  localStorage.setItem(VERSIONS_KEY, JSON.stringify(versions));
};

// Comments storage
export const getComments = (): Comment[] => {
  const stored = localStorage.getItem(COMMENTS_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveComment = (comment: Comment): void => {
  const comments = getComments();
  comments.push(comment);
  localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments));
};

export const getCommentsForNote = (noteId: string): Comment[] => {
  return getComments().filter(c => c.noteId === noteId);
};

// Versions storage
export const getVersions = (): NoteVersion[] => {
  const stored = localStorage.getItem(VERSIONS_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveVersion = (version: NoteVersion): void => {
  const versions = getVersions();
  versions.push(version);
  localStorage.setItem(VERSIONS_KEY, JSON.stringify(versions));
};

export const getVersionsForNote = (noteId: string): NoteVersion[] => {
  return getVersions()
    .filter(v => v.noteId === noteId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

// Initialize with sample data
export const initializeSampleData = (): void => {
  if (getNotes().length === 0) {
    const sampleNotes: Note[] = [
      {
        id: '1',
        authorId: '2',
        authorName: 'Usuário TI',
        team: 'Support TI',
        title: 'Procedimento de Backup do Servidor',
        content: '# Procedimento de Backup\n\nEste documento descreve o processo completo de backup dos servidores corporativos.\n\n## Passos:\n1. Verificar espaço em disco\n2. Executar script de backup\n3. Validar integridade dos dados\n\n```bash\n#!/bin/bash\nbackup_script.sh --verify\n```',
        tags: ['backup', 'servidor', 'procedimento'],
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15')
      },
      {
        id: '2',
        authorId: '3',
        authorName: 'Usuário MV',
        team: 'Sistemas MV',
        title: 'Configuração do Sistema MV2000',
        content: '# Configuração MV2000\n\nDocumentação para configuração inicial do sistema MV2000.\n\n## Requisitos:\n- Windows Server 2019+\n- SQL Server 2017+\n- 16GB RAM mínimo\n\n## Instalação:\n1. Executar installer como administrador\n2. Configurar banco de dados\n3. Testar conectividade',
        tags: ['mv2000', 'configuração', 'instalação'],
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-12')
      }
    ];
    
    sampleNotes.forEach(note => saveNote(note));
  }
};
