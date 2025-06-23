import { Note } from '@/types'; // Assumindo que sua interface Note está aqui
import { User } from '@/contexts/AuthContext'; // Importa a interface User para tipagem

// Define a URL base da sua API a partir das variáveis de ambiente do Vite
// Certifique-se de que o frontend/.env tenha VITE_API_BASE_URL=http://localhost:5000/api
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Função auxiliar para obter o token JWT do localStorage
const getToken = (): string | null => {
  return localStorage.getItem('mario_covas_token');
};

/**
 * Função auxiliar para fazer requisições autenticadas.
 * AGORA EXPORTADA!
 */
export const authenticatedFetch = async (url: string, options?: RequestInit) => { // <-- ADICIONADO 'export' AQUI!
  const token = getToken();
  if (!token) {
    throw new Error('Usuário não autenticado. Por favor, faça login.');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...(options?.headers || {}), // Mescla com quaisquer outros cabeçalhos fornecidos
  };

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    // Tenta ler a mensagem de erro do backend
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || 'Erro desconhecido na requisição');
  }

  return response.json();
};

/**
 * Obtém todas as notas do backend, com suporte a filtros.
 * @param queryParams Objeto com os parâmetros de query (search, tag, teamView)
 * @returns Um array de notas
 */
export const fetchNotes = async (
  queryParams: { search?: string; tag?: string; teamView?: string }
): Promise<Note[]> => {
  const url = new URL(`${API_BASE_URL}/notes`);
  // Adiciona parâmetros de query à URL
  Object.keys(queryParams).forEach(key => {
    const value = (queryParams as any)[key];
    if (value) {
      url.searchParams.append(key, value);
    }
  });

  return authenticatedFetch(url.toString());
};

/**
 * Cria uma nova nota no backend.
 * @param noteData Os dados da nova nota (sem id, createdAt, updatedAt)
 * @returns A nota criada, com ID e datas
 */
export const createNoteApi = async (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'author' | 'authorName'> & { authorId: string; authorName: string }): Promise<Note> => {
  return authenticatedFetch(`${API_BASE_URL}/notes`, {
    method: 'POST',
    body: JSON.stringify(noteData),
  });
};

/**
 * Atualiza uma nota existente no backend.
 * @param id O ID da nota a ser atualizada
 * @param noteData Os dados da nota para atualização
 * @returns A nota atualizada
 */
export const updateNoteApi = async (id: string, noteData: Partial<Note>): Promise<Note> => {
  return authenticatedFetch(`${API_BASE_URL}/notes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(noteData),
  });
};

/**
 * Deleta uma nota do backend.
 * @param id O ID da nota a ser deletada
 * @returns Uma mensagem de sucesso
 */
export const deleteNoteApi = async (id: string): Promise<{ message: string }> => {
  return authenticatedFetch(`${API_BASE_URL}/notes/${id}`, {
    method: 'DELETE',
  });
};
