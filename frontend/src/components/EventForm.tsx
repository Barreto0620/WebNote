import React, { useState, useEffect } from 'react';
import { Event } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from '@/contexts/AuthContext'; // Para obter a role do usuário

interface EventFormProps {
  event?: Event; // Evento existente para edição
  onSave: (eventData: Omit<Event, '_id' | 'createdAt' | 'updatedAt' | 'author' | 'authorName'>) => void;
  onCancel: () => void;
  defaultDate?: Date; // Data padrão para um novo evento
}

const EventForm: React.FC<EventFormProps> = ({ event, onSave, onCancel, defaultDate }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState(event?.title || '');
  const [description, setDescription] = useState(event?.description || '');
  const [eventDate, setEventDate] = useState<string>(
    event?.eventDate 
      ? new Date(event.eventDate).toISOString().split('T')[0] // Formata para 'YYYY-MM-DD'
      : defaultDate ? defaultDate.toISOString().split('T')[0] : ''
  );
  const [eventTime, setEventTime] = useState(event?.eventTime || '');
  const [notificationType, setNotificationType] = useState<Event['notificationType']>(event?.notificationType || 'none');
  const [eventType, setEventType] = useState<Event['eventType']>(event?.eventType || 'general');
  const [team, setTeam] = useState<Event['team']>(event?.team || (user?.role === 'Admin' ? 'Geral' : user?.role === 'Support TI' ? 'Support TI' : user?.role === 'Sistemas MV' ? 'Sistemas MV' : 'Geral'));


  // Resetar estados quando um novo evento é selecionado para edição ou defaultDate muda
  useEffect(() => {
    setTitle(event?.title || '');
    setDescription(event?.description || '');
    setEventDate(
      event?.eventDate 
        ? new Date(event.eventDate).toISOString().split('T')[0]
        : defaultDate ? defaultDate.toISOString().split('T')[0] : ''
    );
    setEventTime(event?.eventTime || '');
    setNotificationType(event?.notificationType || 'none');
    setEventType(event?.eventType || 'general');
    setTeam(event?.team || (user?.role === 'Admin' ? 'Geral' : user?.role === 'Support TI' ? 'Support TI' : user?.role === 'Sistemas MV' ? 'Sistemas MV' : 'Geral'));
  }, [event, defaultDate, user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validação básica
    if (!title || !eventDate) {
      alert('Por favor, preencha o título e a data do evento.');
      return;
    }

    onSave({
      title,
      description,
      eventDate,
      eventTime: eventTime || undefined, // Garante que seja undefined se vazio
      notificationType,
      eventType,
      team,
    });
  };

  // Funções para controle de permissão do campo 'team'
  const isTeamEditable = user?.role === 'Admin';
  const getTeamOptions = () => {
    if (user?.role === 'Admin') {
      return ['Geral', 'Support TI', 'Sistemas MV'];
    } else if (user?.role === 'Support TI') {
      return ['Geral', 'Support TI'];
    } else if (user?.role === 'Sistemas MV') {
      return ['Geral', 'Sistemas MV'];
    }
    return ['Geral']; // Viewers ou outros só podem criar/ver 'Geral'
  };
  const teamOptions = getTeamOptions();


  return (
    <Card className="w-full max-w-2xl mx-auto my-8">
      <CardHeader>
        <CardTitle>{event ? 'Editar Evento' : 'Criar Novo Evento'}</CardTitle>
        <CardDescription>
          {event ? 'Faça alterações no evento existente.' : 'Preencha os detalhes para criar um novo evento.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título do Evento</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Reunião Mensal, Aniversário do João"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição (Opcional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes do evento..."
              rows={3}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="eventDate">Data do Evento</Label>
              <Input
                id="eventDate"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventTime">Hora do Evento (Opcional)</Label>
              <Input
                id="eventTime"
                type="time"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="notificationType">Tipo de Notificação</Label>
              <Select value={notificationType} onValueChange={setNotificationType}>
                <SelectTrigger id="notificationType">
                  <SelectValue placeholder="Selecione o tipo de notificação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  <SelectItem value="hourBefore">1 Hora Antes</SelectItem>
                  <SelectItem value="dayBefore">1 Dia Antes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventType">Tipo de Evento</Label>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger id="eventType">
                  <SelectValue placeholder="Selecione o tipo de evento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Geral</SelectItem>
                  <SelectItem value="birthday">Aniversário</SelectItem>
                  <SelectItem value="reminder">Lembrete</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="team">Equipe do Evento</Label>
            <Select value={team} onValueChange={setTeam} disabled={!isTeamEditable}>
              <SelectTrigger id="team" className="w-full">
                <SelectValue placeholder="Selecione a equipe" />
              </SelectTrigger>
              <SelectContent>
                {teamOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!isTeamEditable && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Apenas administradores podem alterar a equipe do evento.
              </p>
            )}
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" onClick={handleSubmit} className="bg-green-600 hover:bg-green-700 text-white">
          Salvar Evento
        </Button>
      </CardFooter>
    </Card>
  );
};

export default EventForm;
