import { Event } from '@/types'; // Importa a interface Event
import { authenticatedFetch } from './notesApi'; // Reutiliza authenticatedFetch do notesApi

// Define a URL base da sua API a partir das variáveis de ambiente
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Obtém eventos do backend, com filtros opcionais.
 * @param queryParams Objeto com os parâmetros de query (month, year, teamView)
 * @returns Um array de eventos
 */
export const fetchEvents = async (
  queryParams: { month?: number; year?: number; teamView?: string }
): Promise<Event[]> => {
  const url = new URL(`${API_BASE_URL}/events`);
  Object.keys(queryParams).forEach(key => {
    const value = (queryParams as any)[key];
    if (value !== undefined && value !== null) { // Garante que apenas valores definidos sejam adicionados
      url.searchParams.append(key, value.toString());
    }
  });

  return authenticatedFetch(url.toString());
};

/**
 * Cria um novo evento no backend.
 * @param eventData Os dados do novo evento
 * @returns O evento criado
 */
export const createEventApi = async (eventData: Omit<Event, '_id' | 'createdAt' | 'updatedAt' | 'author' | 'authorName'> & { authorId: string; authorName: string }): Promise<Event> => {
  return authenticatedFetch(`${API_BASE_URL}/events`, {
    method: 'POST',
    body: JSON.stringify(eventData),
  });
};

/**
 * Atualiza um evento existente no backend.
 * @param id O ID do evento a ser atualizado
 * @param eventData Os dados do evento para atualização
 * @returns O evento atualizado
 */
export const updateEventApi = async (id: string, eventData: Partial<Event>): Promise<Event> => {
  return authenticatedFetch(`${API_BASE_URL}/events/${id}`, {
    method: 'PUT',
    body: JSON.stringify(eventData),
  });
};

/**
 * Deleta um evento do backend.
 * @param id O ID do evento a ser deletado
 * @returns Uma mensagem de sucesso
 */
export const deleteEventApi = async (id: string): Promise<{ message: string }> => {
  return authenticatedFetch(`${API_BASE_URL}/events/${id}`, {
    method: 'DELETE',
  });
};

/**
 * Obtém um único evento por ID.
 * @param id O ID do evento.
 * @returns O evento encontrado.
 */
export const getEventByIdApi = async (id: string): Promise<Event> => {
  return authenticatedFetch(`${API_BASE_URL}/events/${id}`);
};
