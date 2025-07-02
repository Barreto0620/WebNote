import { Note, Comment } from '@/types';
import { api } from '@/config/api';

export const fetchNotes = async (
  queryParams: { search?: string; tag?: string; teamView?: string }
): Promise<Note[]> => {
  const searchParams = new URLSearchParams();
  Object.entries(queryParams).forEach(([key, value]) => {
    if (value) {
      searchParams.append(key, value);
    }
  });
  
  const endpoint = searchParams.toString() ? `notes?${searchParams.toString()}` : 'notes';
  const response = await api.get(endpoint);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Erro ao buscar notas:', errorText);
    throw new Error(`Erro ${response.status}: ${response.statusText}`);
  }

  return response.json();
};

export const createNoteApi = async (
  noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'author' | 'authorName' | '_id'> & 
  { authorId: string; authorName: string }
): Promise<Note> => {
  const response = await api.post('notes', noteData);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Erro ao criar nota:', errorText);
    throw new Error(`Erro ${response.status}: ${response.statusText}`);
  }

  return response.json();
};

export const updateNoteApi = async (id: string, noteData: Partial<Note>): Promise<Note> => {
  const response = await api.put(`notes/${id}`, noteData);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Erro ao atualizar nota:', errorText);
    throw new Error(`Erro ${response.status}: ${response.statusText}`);
  }

  return response.json();
};

export const deleteNoteApi = async (id: string): Promise<{ message: string }> => {
  const response = await api.delete(`notes/${id}`);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Erro ao deletar nota:', errorText);
    throw new Error(`Erro ${response.status}: ${response.statusText}`);
  }

  return response.json();
};

export const addCommentApi = async (noteId: string, content: string): Promise<Comment> => {
  const response = await api.post(`notes/${noteId}/comments`, { content });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Erro ao adicionar comentário:', errorText);
    throw new Error(`Erro ${response.status}: ${response.statusText}`);
  }

  return response.json();
};