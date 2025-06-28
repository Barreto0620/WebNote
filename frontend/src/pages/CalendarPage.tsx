import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Event, ViewMode } from '@/types';
import { fetchEvents, createEventApi, updateEventApi, deleteEventApi } from '@/services/eventsApi';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, X, Calendar as CalendarIcon, Clock, CircleDot, Bell } from 'lucide-react';
import EventForm from '@/components/EventForm'; // Importa o formulário de eventos
import ConfirmationDialog from '@/components/ConfirmationDialog'; // Para o modal de confirmação de exclusão
import { Dialog, DialogContent } from '@/components/ui/dialog'; // Para o modal de edição/criação

interface CalendarPageProps {
  // A CalendarPage pode aceitar uma teamView padrão, mas será geralmente 'Geral' ou admin
  teamView?: 'Geral' | 'Support TI' | 'Sistemas MV' | 'Admin'; 
}

const CalendarPage: React.FC<CalendarPageProps> = ({ teamView = 'Geral' }) => {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | undefined>(undefined);
  const [selectedDateForNewEvent, setSelectedDateForNewEvent] = useState<Date | undefined>(undefined);

  // Estados para o modal de confirmação de exclusão
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [eventToDeleteId, setEventToDeleteId] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    if (!user) {
      setIsLoadingEvents(false);
      return;
    }
    setIsLoadingEvents(true);
    try {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);

      // A API espera mês e ano para filtragem
      const month = start.getMonth() + 1; // getMonth é 0-indexed
      const year = start.getFullYear();

      let teamViewForApi: string | undefined = undefined;
      if (user.role === 'Admin') {
        teamViewForApi = teamView === 'Geral' ? undefined : teamView; // Admins veem tudo se 'Geral', ou filtram
      } else if (user.role === 'Viewer') {
        teamViewForApi = 'Geral'; // Viewers só veem 'Geral'
      } else if (user.role === 'Support TI' || user.role === 'Sistemas MV') {
        teamViewForApi = teamView; // Usuários de equipe veem da sua equipe ou 'Geral'
      }

      const fetchedEvents = await fetchEvents({ month, year, teamView: teamViewForApi });
      setEvents(fetchedEvents);
    } catch (error: any) {
      console.error('Erro ao carregar eventos:', error);
      toast({
        title: 'Erro ao carregar eventos',
        description: error.message || 'Não foi possível carregar os eventos do servidor.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingEvents(false);
    }
  }, [user, currentMonth, teamView]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const firstDayOfMonth = startOfMonth(currentMonth);
  const startingDayIndex = firstDayOfMonth.getDay(); // 0 = Domingo, 1 = Segunda...

  // Cria células vazias para preencher o início da semana antes do primeiro dia do mês
  const emptyCellsStart = Array.from({ length: startingDayIndex }).map((_, i) => (
    <div key={`empty-start-${i}`} className="p-2 border rounded-md min-h-[100px] flex flex-col justify-between bg-gray-50 dark:bg-gray-800 text-gray-400"></div>
  ));

  const handleDayClick = (date: Date) => {
    setSelectedDateForNewEvent(date);
    setIsEditingEvent(true);
    setEditingEvent(undefined); // Certifica que é um novo evento
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setIsEditingEvent(true);
  };

  const handleSaveEvent = async (eventData: Omit<Event, '_id' | 'createdAt' | 'updatedAt' | 'author' | 'authorName'>) => {
    if (!user) {
      toast({ title: "Erro", description: "Você precisa estar logado para salvar eventos.", variant: "destructive" });
      return;
    }

    try {
      if (editingEvent) {
        await updateEventApi(editingEvent._id, {
          ...eventData,
          eventDate: eventData.eventDate, // Garante que a data seja passada corretamente
        });
        toast({ title: "Evento atualizado!", description: "Suas alterações foram salvas com sucesso." });
      } else {
        await createEventApi({
          ...eventData,
          authorId: user.id,
          authorName: user.name,
          eventDate: eventData.eventDate, // Garante que a data seja passada corretamente
        });
        toast({ title: "Evento criado!", description: "Novo evento criado com sucesso." });
      }
      loadEvents();
      setIsEditingEvent(false);
      setEditingEvent(undefined);
      setSelectedDateForNewEvent(undefined);
    } catch (error: any) {
      console.error('Erro ao salvar evento:', error);
      toast({
        title: "Erro ao salvar evento",
        description: error.message || "Não foi possível salvar o evento no servidor.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEvent = (eventId: string) => {
    setEventToDeleteId(eventId);
    setShowConfirmDelete(true);
  };

  const confirmDeleteEvent = async () => {
    if (!eventToDeleteId) return;
    try {
      await deleteEventApi(eventToDeleteId);
      loadEvents();
      toast({ title: "Evento excluído!", description: "O evento foi removido com sucesso." });
    } catch (error: any) {
      console.error('Erro ao deletar evento:', error);
      toast({
        title: "Erro ao excluir evento",
        description: error.message || "Não foi possível excluir o evento do servidor.",
        variant: "destructive",
      });
    } finally {
      setShowConfirmDelete(false);
      setEventToDeleteId(null);
    }
  };

  const handleCancelDeleteEvent = () => {
    setShowConfirmDelete(false);
    setEventToDeleteId(null);
  };

  const handleCancelEdit = () => {
    setIsEditingEvent(false);
    setEditingEvent(undefined);
    setSelectedDateForNewEvent(undefined);
  };

  // Determina se o usuário pode criar/editar/deletar eventos
  const canManageEvents = (eventAuthorId?: string, eventTeam?: string) => {
    if (!user) return false;
    if (user.role === 'Admin') return true; // Admin pode tudo
    if (user.role === 'Viewer') return false; // Viewer não pode gerenciar

    // Usuários de equipe podem gerenciar eventos que eles criaram,
    // ou eventos da sua própria equipe, ou eventos 'Geral' se eles forem de equipe.
    const isEventOfMyTeam = eventTeam && (eventTeam === user.role || eventTeam === 'Geral');
    const isMyEvent = eventAuthorId && eventAuthorId === user.id;

    return isEventOfMyTeam || isMyEvent;
  };

  return (
    <div className="flex-1 p-4 md:p-6 min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center">Calendário de Eventos</h1>

      {/* Navegação do Mês */}
      <div className="flex items-center justify-between mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="text-gray-700 dark:text-gray-300">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-xl font-semibold">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </h2>
        <Button variant="ghost" size="icon" onClick={handleNextMonth} className="text-gray-700 dark:text-gray-300">
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Cabeçalho dos Dias da Semana */}
      <div className="grid grid-cols-7 gap-2 mb-2 text-center font-semibold text-gray-700 dark:text-gray-300">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
          <div key={day} className="p-2 bg-gray-200 dark:bg-gray-700 rounded-md">{day}</div>
        ))}
      </div>

      {/* Grid do Calendário */}
      {isLoadingEvents ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          Carregando calendário...
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-2 auto-rows-fr">
          {emptyCellsStart}
          {daysInMonth.map((date, index) => {
            const dayEvents = events.filter(event => isSameDay(parseISO(event.eventDate), date));
            const isToday = isSameDay(date, new Date());
            const isCurrentMonth = isSameMonth(date, currentMonth);

            return (
              <div
                key={date.toISOString()}
                className={`p-2 border rounded-md min-h-[120px] flex flex-col relative 
                  ${isCurrentMonth ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700' : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-400'}
                  ${isToday ? 'border-2 border-green-500 dark:border-green-400 ring-2 ring-green-200 dark:ring-green-700' : ''}
                  ${canManageEvents() ? 'hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer' : ''}
                `}
                onClick={() => canManageEvents() && handleDayClick(date)}
              >
                <div className={`font-semibold text-right ${isToday ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                  {format(date, 'd')}
                </div>
                <div className="flex-1 overflow-y-auto mt-1 space-y-1">
                  {dayEvents.map(event => (
                    <div
                      key={event._id}
                      className={`flex items-center text-xs p-1 rounded-md cursor-pointer 
                        ${event.eventType === 'birthday' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 
                          event.eventType === 'reminder' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' : 
                          'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'}
                        hover:opacity-80 transition-opacity flex-shrink-0
                      `}
                      onClick={(e) => { e.stopPropagation(); handleEditEvent(event); }} // Impede que o clique no evento abra o form de novo evento no dia
                      title={event.description || event.title}
                    >
                      {event.eventType === 'birthday' && <CircleDot className="w-3 h-3 mr-1" />}
                      {event.eventType === 'reminder' && <Bell className="w-3 h-3 mr-1" />}
                      {event.eventTime && <Clock className="w-3 h-3 mr-1" />}
                      <span className="truncate flex-1">{event.title}</span>
                      {canManageEvents(event.author, event.team) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-4 h-4 p-0 ml-1 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                          onClick={(e) => { e.stopPropagation(); handleDeleteEvent(event._id); }}
                          title="Excluir evento"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                {canManageEvents() && isCurrentMonth && ( // Botão flutuante para adicionar evento
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute bottom-1 right-1 w-6 h-6 p-0 rounded-full bg-green-500 text-white hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700"
                    onClick={(e) => { e.stopPropagation(); handleDayClick(date); }}
                    title="Adicionar evento"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Criação/Edição de Eventos */}
      <Dialog open={isEditingEvent} onOpenChange={handleCancelEdit}>
        <DialogContent className="sm:max-w-[600px] p-6">
          <EventForm
            event={editingEvent}
            onSave={handleSaveEvent}
            onCancel={handleCancelEdit}
            defaultDate={selectedDateForNewEvent}
          />
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmationDialog
        isOpen={showConfirmDelete}
        onConfirm={confirmDeleteEvent}
        onCancel={handleCancelDeleteEvent}
        title="Confirmar Exclusão de Evento"
        description="Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita."
        confirmText="Excluir Evento"
        cancelText="Cancelar"
      />
    </div>
  );
};

export default CalendarPage;
