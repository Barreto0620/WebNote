import { Note } from '@/types';
import { User } from '@/contexts/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ADICIONE ESTE LOG PARA VERIFICAR A URL BASE
console.log('API_BASE_URL carregado em notesApi:', API_BASE_URL);

const getToken = (): string | null => {
  return localStorage.getItem('mario_covas_token');
};

export const authenticatedFetch = async (url: string, options?: RequestInit) => {
  const token = getToken();
  if (!token) {
    throw new Error('Usuário não autenticado. Por favor, faça login.');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...(options?.headers || {}),
  };

  // ADICIONE ESTE LOG PARA VERIFICAR A URL COMPLETA DA REQUISIÇÃO
  console.log('Realizando fetch para:', url);

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || 'Erro desconhecido na requisição');
  }

  return response.json();
};

export const fetchNotes = async (
  queryParams: { search?: string; tag?: string; teamView?: string }
): Promise<Note[]> => {
  const url = new URL(`${API_BASE_URL}/notes`);
  Object.keys(queryParams).forEach(key => {
    const value = (queryParams as any)[key];
    if (value) {
      url.searchParams.append(key, value);
    }
  });

  return authenticatedFetch(url.toString());
};

export const createNoteApi = async (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'author' | 'authorName'> & { authorId: string; authorName: string }): Promise<Note> => {
  return authenticatedFetch(`${API_BASE_URL}/notes`, {
    method: 'POST',
    body: JSON.stringify(noteData),
  });
};

export const updateNoteApi = async (id: string, noteData: Partial<Note>): Promise<Note> => {
  return authenticatedFetch(`${API_BASE_URL}/notes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(noteData),
  });
};

export const deleteNoteApi = async (id: string): Promise<{ message: string }> => {
  return authenticatedFetch(`${API_BASE_URL}/notes/${id}`, {
    method: 'DELETE',
  });
};
