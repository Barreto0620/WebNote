import { Request, Response } from 'express';
import Event, { IEvent } from '../models/Event';
import { Types } from 'mongoose';

// Estende a interface Request para incluir 'user' do middleware de autenticação
interface AuthenticatedRequest extends Request {
  user?: {
    _id: Types.ObjectId;
    email: string;
    name: string;
    role: 'Admin' | 'Support TI' | 'Sistemas MV' | 'Viewer';
  };
}

// @desc    Obter todos os eventos (filtrados por equipe, mês/ano, ou todos para Admin)
// @route   GET /api/events
// @access  Private
export const getEvents = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;
    if (!user) {
      return res.status(401).json({ message: 'Não autorizado, usuário não autenticado.' });
    }

    let query: any = {};
    const { month, year, teamView } = req.query; // Adiciona month, year e teamView

    // Lógica de filtragem de permissão por equipe
    let allowedTeams: string[] = [];
    if (user.role === 'Admin') {
      // Admin pode ver todos os eventos
    } else if (user.role === 'Viewer') {
      allowedTeams = ['Geral']; // Viewers só veem eventos 'Geral'
    } else if (user.role === 'Support TI' || user.role === 'Sistemas MV') {
      allowedTeams = [user.role, 'Geral']; // Usuários de equipe veem da sua equipe e 'Geral'
    } else {
      return res.status(403).json({ message: 'Acesso negado para esta função.' });
    }

    if (allowedTeams.length > 0) {
      query.team = { $in: allowedTeams };
    }

    // Filtrar por equipe específica se teamView for fornecido e o usuário tiver permissão
    if (teamView && typeof teamView === 'string') {
      if (user.role !== 'Admin' && !allowedTeams.includes(teamView)) {
        return res.status(403).json({ message: `Acesso negado: Você não tem permissão para visualizar eventos da equipe "${teamView}".` });
      }
      query.team = teamView;
    }

    // Filtrar por mês e ano se fornecidos
    if (month && year) {
      const startOfMonth = new Date(Number(year), Number(month) - 1, 1); // Mês é 0-indexado no JS
      const endOfMonth = new Date(Number(year), Number(month), 0, 23, 59, 59, 999); // Último dia do mês

      query.eventDate = {
        $gte: startOfMonth,
        $lte: endOfMonth,
      };
    } else if (month || year) {
        // Se apenas um for fornecido, retornar erro ou ajustar lógica. Por simplicidade, requer ambos.
        return res.status(400).json({ message: 'Ambos, mês e ano, devem ser fornecidos para filtrar por período.' });
    }

    const events = await Event.find(query).sort({ eventDate: 1, eventTime: 1 }); // Ordena por data e hora

    res.json(events);
  } catch (error: any) {
    console.error('Erro ao obter eventos:', error);
    res.status(500).json({ message: `Erro no servidor ao obter eventos: ${error.message}` });
  }
};

// @desc    Criar um novo evento
// @route   POST /api/events
// @access  Private
export const createEvent = async (req: AuthenticatedRequest, res: Response) => {
  const { title, description, eventDate, eventTime, notificationType, eventType, team } = req.body;
  const { user } = req;

  if (!user) {
    return res.status(401).json({ message: 'Não autorizado, usuário não autenticado.' });
  }

  if (user.role === 'Viewer') {
    return res.status(403).json({ message: 'Acesso negado: Visualizadores não podem criar eventos.' });
  }

  // Valida que a equipe fornecida é válida
  if (!team || !['Geral', 'Support TI', 'Sistemas MV'].includes(team)) {
    return res.status(400).json({ message: 'Equipe inválida ou não fornecida.' });
  }

  // Usuários de equipe só podem criar eventos para sua própria equipe ou 'Geral'
  if (user.role !== 'Admin' && user.role !== 'Viewer') {
    if (team !== 'Geral' && team !== user.role) {
      return res.status(403).json({ message: `Acesso negado: Você só pode criar eventos para a equipe "${user.role}" ou "Geral".` });
    }
  }

  if (!title || !eventDate || !notificationType || !eventType) {
    return res.status(400).json({ message: 'Por favor, inclua título, data, tipo de notificação e tipo de evento.' });
  }

  try {
    const newEvent: IEvent = new Event({
      title,
      description,
      eventDate: new Date(eventDate), // Converte a string da data para objeto Date
      eventTime,
      notificationType,
      eventType,
      author: user._id,
      authorName: user.name,
      team,
    });
    const savedEvent = await newEvent.save();
    res.status(201).json(savedEvent);
  } catch (error: any) {
    console.error('Erro ao criar evento:', error);
    res.status(400).json({ message: `Erro ao criar evento: ${error.message}` });
  }
};

// @desc    Obter um evento por ID
// @route   GET /api/events/:id
// @access  Private
export const getEventById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;
    if (!user) {
      return res.status(401).json({ message: 'Não autorizado.' });
    }

    if (!Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'ID do evento inválido.' });
    }

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Evento não encontrado.' });
    }

    // Verifica permissão para visualizar o evento
    if (user.role === 'Admin') {
      // Admin tem acesso total
    } else if (user.role === 'Viewer') {
      if (event.team !== 'Geral') {
        return res.status(403).json({ message: 'Acesso negado: Visualizadores só podem ver eventos gerais.' });
      }
    } else if (user.role === 'Support TI' || user.role === 'Sistemas MV') {
      if (event.team !== 'Geral' && event.team !== user.role) {
         return res.status(403).json({ message: 'Acesso negado: Você só pode ver eventos da sua equipe ou eventos gerais.' });
      }
    } else {
        return res.status(403).json({ message: 'Acesso negado para esta função.' });
    }

    res.json(event);
  } catch (error: any) {
    console.error('Erro ao obter evento por ID:', error);
    res.status(500).json({ message: `Erro no servidor ao obter evento: ${error.message}` });
  }
};

// @desc    Atualizar um evento
// @route   PUT /api/events/:id
// @access  Private
export const updateEvent = async (req: AuthenticatedRequest, res: Response) => {
  const { title, description, eventDate, eventTime, notificationType, eventType, team } = req.body;
  const { user } = req;

  if (!user) {
    return res.status(401).json({ message: 'Não autorizado.' });
  }

  if (!Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'ID do evento inválido.' });
  }

  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Evento não encontrado.' });
    }

    if (user.role === 'Viewer') {
      return res.status(403).json({ message: 'Acesso negado: Visualizadores não podem atualizar eventos.' });
    }
    
    const hasPermissionToUpdate = user.role === 'Admin' ||
                                  event.author.toString() === user._id.toString() ||
                                  event.team === user.role ||
                                  (event.team === 'Geral' && (user.role === 'Support TI' || user.role === 'Sistemas MV'));

    if (!hasPermissionToUpdate) {
      return res.status(403).json({ message: 'Acesso negado: Você não tem permissão para atualizar este evento.' });
    }
    
    // Admins podem alterar a equipe do evento. Outras roles não.
    if (team && team !== event.team) {
        if (user.role === 'Admin') {
            if (!['Geral', 'Support TI', 'Sistemas MV'].includes(team)) {
                return res.status(400).json({ message: 'Equipe inválida fornecida.' });
            }
            event.team = team;
        } else {
            return res.status(403).json({ message: 'Acesso negado: Você não pode alterar a equipe do evento.' });
        }
    }

    event.title = title !== undefined ? title : event.title;
    event.description = description !== undefined ? description : event.description;
    event.eventDate = eventDate !== undefined ? new Date(eventDate) : event.eventDate;
    event.eventTime = eventTime !== undefined ? eventTime : event.eventTime;
    event.notificationType = notificationType !== undefined ? notificationType : event.notificationType;
    event.eventType = eventType !== undefined ? eventType : event.eventType;

    const updatedEvent = await event.save();
    res.json(updatedEvent);
  } catch (error: any) {
    console.error('Erro ao atualizar evento:', error);
    res.status(400).json({ message: `Erro ao atualizar evento: ${error.message}` });
  }
};

// @desc    Deletar um evento
// @route   DELETE /api/events/:id
// @access  Private
export const deleteEvent = async (req: AuthenticatedRequest, res: Response) => {
  const { user } = req;

  if (!user) {
    return res.status(401).json({ message: 'Não autorizado.' });
  }

  if (!Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'ID do evento inválido.' });
  }

  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Evento não encontrado.' });
    }

    if (user.role === 'Viewer') {
      return res.status(403).json({ message: 'Acesso negado: Visualizadores não podem deletar eventos.' });
    }
    
    const hasPermissionToDelete = user.role === 'Admin' ||
                                  event.author.toString() === user._id.toString() ||
                                  event.team === user.role ||
                                  (event.team === 'Geral' && (user.role === 'Support TI' || user.role === 'Sistemas MV'));

    if (!hasPermissionToDelete) {
      return res.status(403).json({ message: 'Acesso negado: Você não tem permissão para deletar este evento.' });
    }

    await Event.deleteOne({ _id: req.params.id });
    res.json({ message: 'Evento removido com sucesso.' });
  } catch (error: any) {
    console.error('Erro ao deletar evento:', error);
    res.status(500).json({ message: `Erro no servidor ao deletar evento: ${error.message}` });
  }
};
