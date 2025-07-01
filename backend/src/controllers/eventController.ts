import { Request, Response } from 'express';
import Event, { IEvent } from '../models/Event'; // Importa o modelo de evento e sua interface
import { Types } from 'mongoose'; // Usado para validar ObjectId

// Define as roles de equipe para uso em validações de permissão
const ALL_TEAM_ROLES = ['Support TI', 'Sistemas MV'];

// @desc    Obter todos os eventos (com filtros de equipe, mês/ano e busca)
// @route   GET /api/events
// @access  Private
export const getEvents = async (req: Request, res: Response) => {
  try {
    const { user } = req; // O usuário autenticado é anexado pelo middleware 'protect'
    if (!user) {
      return res.status(401).json({ message: 'Não autorizado: usuário não autenticado.' });
    }

    let query: any = {}; // Objeto de query para o Mongoose
    const { month, year, teamView } = req.query; // Parâmetros de query para filtragem

    // Lógica de permissão e filtragem de eventos por equipe
    let allowedTeamsForUser: string[] = [];
    if (user.role === 'Admin') {
      // Admins podem ver todos os eventos, a menos que um `teamView` específico seja solicitado.
    } else if (user.role === 'Viewer') {
      allowedTeamsForUser = ['Geral']; // Viewers só veem eventos 'Geral'
    } else if (ALL_TEAM_ROLES.includes(user.role)) {
      allowedTeamsForUser = [user.role, 'Geral']; // Usuários de equipe veem eventos da sua equipe e 'Geral'
    } else {
      return res.status(403).json({ message: 'Acesso negado para esta função de usuário.' });
    }

    // Aplica o filtro de equipe padrão baseado na role do usuário
    if (allowedTeamsForUser.length > 0) {
      query.team = { $in: allowedTeamsForUser };
    }

    // Se um `teamView` específico for solicitado, verifica permissão e aplica
    if (teamView && typeof teamView === 'string') {
      if (user.role !== 'Admin' && !allowedTeamsForUser.includes(teamView)) {
        // Se não for Admin e a teamView solicitada não estiver entre as equipes permitidas para o usuário
        return res.status(403).json({ message: `Acesso negado: Você não tem permissão para visualizar eventos da equipe "${teamView}".` });
      }
      query.team = teamView; // Sobrescreve/define o filtro de equipe com a teamView solicitada
    }

    // Filtrar por mês e ano se ambos forem fornecidos
    if (month && year) {
      const numMonth = Number(month);
      const numYear = Number(year);

      if (isNaN(numMonth) || isNaN(numYear) || numMonth < 1 || numMonth > 12) {
        return res.status(400).json({ message: 'Mês ou ano inválidos para filtragem.' });
      }

      const startOfMonth = new Date(numYear, numMonth - 1, 1); // Mês é 0-indexado no JS (janeiro = 0)
      const endOfMonth = new Date(numYear, numMonth, 0, 23, 59, 59, 999); // Último dia do mês

      query.eventDate = {
        $gte: startOfMonth,
        $lte: endOfMonth,
      };
    } else if (month || year) {
        // Se apenas um for fornecido, informa que ambos são necessários
        return res.status(400).json({ message: 'Para filtrar por período, tanto o mês quanto o ano devem ser fornecidos.' });
    }

    // Busca os eventos no banco de dados com a query construída e ordena por data e hora
    const events = await Event.find(query).sort({ eventDate: 1, eventTime: 1 });

    res.json(events);
  } catch (error: any) {
    console.error('Erro ao obter eventos:', error);
    res.status(500).json({ message: `Erro no servidor ao obter eventos: ${error.message}` });
  }
};

// @desc    Criar um novo evento
// @route   POST /api/events
// @access  Private
export const createEvent = async (req: Request, res: Response) => {
  const { title, description, eventDate, eventTime, notificationType, eventType, team } = req.body;
  const { user } = req;

  if (!user) {
    return res.status(401).json({ message: 'Não autorizado: usuário não autenticado.' });
  }

  // Viewers não têm permissão para criar eventos
  if (user.role === 'Viewer') {
    return res.status(403).json({ message: 'Acesso negado: Visualizadores não podem criar eventos.' });
  }

  // Valida que a equipe fornecida é uma das permitidas
  if (!team || !['Geral', 'Support TI', 'Sistemas MV'].includes(team)) {
    return res.status(400).json({ message: 'Equipe inválida ou não fornecida. Equipes válidas: Geral, Support TI, Sistemas MV.' });
  }

  // Usuários de equipe (Support TI, Sistemas MV) só podem criar eventos para sua própria equipe ou 'Geral'
  if (ALL_TEAM_ROLES.includes(user.role)) {
    if (team !== 'Geral' && team !== user.role) {
      return res.status(403).json({ message: `Acesso negado: Você só pode criar eventos para a equipe "${user.role}" ou "Geral".` });
    }
  }

  // Validação de campos obrigatórios do evento
  if (!title || !eventDate || !notificationType || !eventType) {
    return res.status(400).json({ message: 'Por favor, inclua título, data, tipo de notificação e tipo de evento para o evento.' });
  }

  try {
    // Cria uma nova instância de Evento
    const newEvent: IEvent = new Event({
      title,
      description,
      eventDate: new Date(eventDate), // Converte a string da data para um objeto Date
      eventTime,
      notificationType,
      eventType,
      author: user._id, // Define o autor como o usuário autenticado
      authorName: user.name,
      team,
    });
    const savedEvent = await newEvent.save(); // Salva o novo evento no banco de dados
    res.status(201).json(savedEvent); // Retorna o evento criado com status 201
  } catch (error: any) {
    console.error('Erro ao criar evento:', error);
    res.status(400).json({ message: `Erro ao criar evento: ${error.message}` });
  }
};

// @desc    Obter um evento por ID
// @route   GET /api/events/:id
// @access  Private
export const getEventById = async (req: Request, res: Response) => {
  try {
    const { user } = req;
    if (!user) {
      return res.status(401).json({ message: 'Não autorizado.' });
    }

    // Valida se o ID fornecido é um ObjectId válido do MongoDB
    if (!Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'ID do evento inválido.' });
    }

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Evento não encontrado.' });
    }

    // Lógica de permissão para visualizar um evento específico
    if (user.role === 'Admin') {
      // Admins têm acesso total
    } else if (user.role === 'Viewer') {
      // Viewers só podem ver eventos da equipe 'Geral'
      if (event.team !== 'Geral') {
        return res.status(403).json({ message: 'Acesso negado: Visualizadores só podem ver eventos gerais.' });
      }
    } else if (ALL_TEAM_ROLES.includes(user.role)) {
      // Usuários de equipe podem ver eventos da sua própria equipe ou eventos 'Geral'
      if (event.team !== 'Geral' && event.team !== user.role) {
          return res.status(403).json({ message: 'Acesso negado: Você só pode ver eventos da sua equipe ou eventos gerais.' });
      }
    } else {
        return res.status(403).json({ message: 'Acesso negado para esta função de usuário.' });
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
export const updateEvent = async (req: Request, res: Response) => {
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

    // Viewers não podem atualizar eventos
    if (user.role === 'Viewer') {
      return res.status(403).json({ message: 'Acesso negado: Visualizadores não podem atualizar eventos.' });
    }
    
    // Lógica de permissões para atualização de evento:
    // Admin sempre pode.
    // O autor do evento pode atualizar.
    // Usuários de equipe podem atualizar eventos que pertencem à sua própria equipe ou eventos 'Geral'.
    const hasPermissionToUpdate = user.role === 'Admin' ||
                                  event.author.toString() === user._id.toString() ||
                                  (ALL_TEAM_ROLES.includes(user.role) && (event.team === user.role || event.team === 'Geral'));

    if (!hasPermissionToUpdate) {
      return res.status(403).json({ message: 'Acesso negado: Você não tem permissão para atualizar este evento.' });
    }
    
    // Admins são os únicos que podem alterar a equipe de um evento.
    if (team !== undefined && team !== event.team) { // Verifica se `team` foi fornecido e é diferente
        if (user.role === 'Admin') {
            if (!['Geral', 'Support TI', 'Sistemas MV'].includes(team)) {
                return res.status(400).json({ message: 'Equipe inválida fornecida.' });
            }
            event.team = team;
        } else {
            return res.status(403).json({ message: 'Acesso negado: Você não pode alterar a equipe do evento.' });
        }
    }

    // Atualiza apenas os campos que foram fornecidos na requisição
    event.title = title !== undefined ? title : event.title;
    event.description = description !== undefined ? description : event.description;
    event.eventDate = eventDate !== undefined ? new Date(eventDate) : event.eventDate;
    event.eventTime = eventTime !== undefined ? eventTime : event.eventTime;
    event.notificationType = notificationType !== undefined ? notificationType : event.notificationType;
    event.eventType = eventType !== undefined ? eventType : event.eventType;

    const updatedEvent = await event.save(); // Salva as alterações
    res.json(updatedEvent); // Retorna o evento atualizado
  } catch (error: any) {
    console.error('Erro ao atualizar evento:', error);
    res.status(400).json({ message: `Erro ao atualizar evento: ${error.message}` });
  }
};

// @desc    Deletar um evento
// @route   DELETE /api/events/:id
// @access  Private
export const deleteEvent = async (req: Request, res: Response) => {
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

    // Viewers não podem deletar eventos
    if (user.role === 'Viewer') {
      return res.status(403).json({ message: 'Acesso negado: Visualizadores não podem deletar eventos.' });
    }
    
    // Lógica de permissões para exclusão de evento:
    // Admin sempre pode.
    // O autor do evento pode deletar.
    // Usuários de equipe podem deletar eventos que pertencem à sua própria equipe ou eventos 'Geral'.
    const hasPermissionToDelete = user.role === 'Admin' ||
                                  event.author.toString() === user._id.toString() ||
                                  (ALL_TEAM_ROLES.includes(user.role) && (event.team === user.role || event.team === 'Geral'));

    if (!hasPermissionToDelete) {
      return res.status(403).json({ message: 'Acesso negado: Você não tem permissão para deletar este evento.' });
    }

    await Event.deleteOne({ _id: req.params.id }); // Deleta o evento do banco de dados
    res.json({ message: 'Evento removido com sucesso.' });
  } catch (error: any) {
    console.error('Erro ao deletar evento:', error);
    res.status(500).json({ message: `Erro no servidor ao deletar evento: ${error.message}` });
  }
};