import { Event } from '@/types';
import { api } from '@/config/api';

export const fetchEvents = async (
  queryParams: { month?: number; year?: number; teamView?: string }
): Promise<Event[]> => {
  const searchParams = new URLSearchParams();
  Object.entries(queryParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, value.toString());
    }
  });

  const endpoint = searchParams.toString() ? `events?${searchParams.toString()}` : 'events';
  const response = await api.get(endpoint);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Erro ao buscar eventos:', errorText);
    throw new Error(`Erro ${response.status}: ${response.statusText}`);
  }

  return response.json();
};

export const createEventApi = async (
  eventData: Omit<Event, '_id' | 'createdAt' | 'updatedAt' | 'author' | 'authorName'> & 
  { authorId: string; authorName: string }
): Promise<Event> => {
  const response = await api.post('events', eventData);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Erro ao criar evento:', errorText);
    throw new Error(`Erro ${response.status}: ${response.statusText}`);
  }

  return response.json();
};

export const updateEventApi = async (id: string, eventData: Partial<Event>): Promise<Event> => {
  const response = await api.put(`events/${id}`, eventData);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Erro ao atualizar evento:', errorText);
    throw new Error(`Erro ${response.status}: ${response.statusText}`);
  }

  return response.json();
};

export const deleteEventApi = async (id: string): Promise<{ message: string }> => {
  const response = await api.delete(`events/${id}`);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Erro ao deletar evento:', errorText);
    throw new Error(`Erro ${response.status}: ${response.statusText}`);
  }

  return response.json();
};

export const getEventByIdApi = async (id: string): Promise<Event> => {
  const response = await api.get(`events/${id}`);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Erro ao buscar evento:', errorText);
    throw new Error(`Erro ${response.status}: ${response.statusText}`);
  }

  return response.json();
};