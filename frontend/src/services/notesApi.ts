import { Note, Comment } from '@/types'; // Importa Comment
import { User } from '@/contexts/AuthContext';

// IMPORTANT: O API_BASE_URL foi redefinido no vite.config.ts para proxy
// Então, o valor aqui não é crucial, mas as chamadas devem começar com '/api'
// para que o proxy do Vite atue.
// Se você está usando o vite.config.ts com proxy, esta linha pode ser assim:
const API_BASE_URL = ''; // Deixe vazio se o proxy está configurado para /api/*

// ESTE LOG É CRÍTICO! Ele nos dirá o valor exato de API_BASE_URL que o Vite está injetando.
console.log('--- DEBUG: API_BASE_URL carregado em notesApi:', import.meta.env.VITE_API_BASE_URL);


const getToken = (): string | null => {
  return localStorage.getItem('mario_covas_token');
};

export const authenticatedFetch = async (endpoint: string, options?: RequestInit) => { // endpoint agora começa com /api
  const token = getToken();
  if (!token) {
    throw new Error('Usuário não autenticado. Por favor, faça login.');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...(options?.headers || {}),
  };

  // ESTE LOG É CRÍTICO! Ele nos dirá a URL COMPLETA que a requisição está tentando alcançar.
  const fullUrl = `${endpoint}`; // Usa o endpoint diretamente, o proxy cuida do base path
  console.log('--- DEBUG: Realizando fetch para:', fullUrl);


  const response = await fetch(fullUrl, { ...options, headers });

  if (!response.ok) {
    const errorText = await response.text(); // Lê como texto primeiro para pegar HTML
    console.error('--- DEBUG: Resposta de erro da API (texto):', errorText);
    let errorMessage = `Erro ${response.status}: ${response.statusText}`;
    try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorMessage;
    } catch (parseError) {
        // Se não for JSON, usa o texto bruto ou parte dele
        errorMessage = `Resposta não JSON: ${errorText.substring(0, 100)}...`;
    }
    throw new Error(errorMessage);
  }

  return response.json();
};

export const fetchNotes = async (
  queryParams: { search?: string; tag?: string; teamView?: string }
): Promise<Note[]> => {
  const url = new URL(`${import.meta.env.VITE_API_BASE_URL}/notes`); // Usa a URL completa aqui para formar query params
  Object.keys(queryParams).forEach(key => {
    const value = (queryParams as any)[key];
    if (value) {
      url.searchParams.append(key, value);
    }
  });

  // Passa o caminho que o proxy vai interceptar
  return authenticatedFetch(`/api/notes?${url.searchParams.toString()}`);
};

export const createNoteApi = async (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'author' | 'authorName' | '_id'> & { authorId: string; authorName: string }): Promise<Note> => {
  return authenticatedFetch(`/api/notes`, {
    method: 'POST',
    body: JSON.stringify(noteData),
  });
};

export const updateNoteApi = async (id: string, noteData: Partial<Note>): Promise<Note> => {
  return authenticatedFetch(`/api/notes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(noteData),
  });
};

export const deleteNoteApi = async (id: string): Promise<{ message: string }> => {
  return authenticatedFetch(`/api/notes/${id}`, {
    method: 'DELETE',
  });
};

// NOVA FUNÇÃO: Adicionar comentário a uma nota
export const addCommentApi = async (noteId: string, content: string): Promise<Comment> => {
  return authenticatedFetch(`/api/notes/${noteId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
};
