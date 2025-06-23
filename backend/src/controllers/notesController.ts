import { Request, Response, NextFunction } from 'express';
import Note, { INote } from '../models/Note';
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

// @desc    Obter todas as notas (filtradas por equipe ou todas para Admin/Viewer)
// @route   GET /api/notes
// @access  Private
export const getNotes = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;

    if (!user) {
      return res.status(401).json({ message: 'Não autorizado, usuário não autenticado.' });
    }

    let query: any = {};
    const { search, tag, teamView } = req.query;

    let allowedTeams: string[] = [];

    if (user.role === 'Admin') {
      // Admin pode ver todas as notas, sem restrição de equipe por default
    } else if (user.role === 'Viewer') {
      allowedTeams = ['Geral'];
    } else if (user.role === 'Support TI' || user.role === 'Sistemas MV') {
      allowedTeams = [user.role, 'Geral'];
    } else {
      return res.status(403).json({ message: 'Acesso negado para esta função.' });
    }

    if (allowedTeams.length > 0) {
      query.team = { $in: allowedTeams };
    }

    if (teamView && typeof teamView === 'string') {
        if (user.role !== 'Admin' && !allowedTeams.includes(teamView)) {
            return res.status(403).json({ message: `Acesso negado: Você não tem permissão para visualizar a equipe "${teamView}".` });
        }
        query.team = teamView;
    }

    if (search) {
      const searchRegex = new RegExp(search as string, 'i');
      query.$or = [
        { title: searchRegex },
        { content: searchRegex },
        { authorName: searchRegex },
        { tags: searchRegex }
      ];
    }

    if (tag && tag !== 'all') {
      query.tags = tag;
    }

    const notes = await Note.find(query).sort({ updatedAt: -1 });

    res.json(notes);
  } catch (error: any) {
    console.error('Erro ao obter notas:', error);
    res.status(500).json({ message: `Erro no servidor ao obter notas: ${error.message}` });
  }
};

// @desc    Criar uma nova nota
// @route   POST /api/notes
// @access  Private
export const createNote = async (req: AuthenticatedRequest, res: Response) => {
  const { title, content, team, tags } = req.body;
  const { user } = req;

  if (!user) {
    return res.status(401).json({ message: 'Não autorizado, usuário não autenticado.' });
  }

  if (user.role === 'Viewer') {
    return res.status(403).json({ message: 'Acesso negado: Visualizadores não podem criar notas.' });
  }

  if (!team || !['Geral', 'Support TI', 'Sistemas MV'].includes(team)) {
    return res.status(400).json({ message: 'Equipe inválida ou não fornecida.' });
  }

  if (user.role !== 'Admin' && user.role !== 'Viewer') {
    if (team !== 'Geral' && team !== user.role) {
      return res.status(403).json({ message: `Acesso negado: Você só pode criar notas para a equipe "${user.role}" ou "Geral".` });
    }
  }

  if (!title || !content) {
    return res.status(400).json({ message: 'Por favor, inclua título e conteúdo para a nota.' });
  }

  try {
    const newNote: INote = new Note({
      title,
      content,
      author: user._id,
      authorName: user.name,
      team: team,
      tags: tags || []
      // O 'pre save' hook no modelo já adiciona a primeira versão ao history
    });
    const savedNote = await newNote.save();
    res.status(201).json(savedNote);
  } catch (error: any) {
    console.error('Erro ao criar nota:', error);
    res.status(400).json({ message: `Erro ao criar nota: ${error.message}` });
  }
};

// @desc    Obter uma nota por ID
// @route   GET /api/notes/:id
// @access  Private
export const getNoteById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;

    if (!user) {
      return res.status(401).json({ message: 'Não autorizado.' });
    }

    if (!Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'ID da nota inválido.' });
    }

    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: 'Nota não encontrada.' });
    }

    if (user.role === 'Admin') {
      // Admin tem acesso total
    } else if (user.role === 'Viewer') {
      if (note.team !== 'Geral') {
        return res.status(403).json({ message: 'Acesso negado: Visualizadores só podem ver notas gerais.' });
      }
    } else if (user.role === 'Support TI' || user.role === 'Sistemas MV') {
      if (note.team !== 'Geral' && note.team !== user.role) {
         return res.status(403).json({ message: 'Acesso negado: Você só pode ver notas da sua equipe ou notas gerais.' });
      }
    } else {
        return res.status(403).json({ message: 'Acesso negado para esta função.' });
    }

    res.json(note); // Retorna a nota, que agora incluirá o versionHistory
  } catch (error: any) {
    console.error('Erro ao obter nota por ID:', error);
    res.status(500).json({ message: `Erro no servidor ao obter nota: ${error.message}` });
  }
};

// @desc    Atualizar uma nota
// @route   PUT /api/notes/:id
// @access  Private
export const updateNote = async (req: AuthenticatedRequest, res: Response) => {
  const { title, content, team, tags } = req.body;
  const { user } = req;

  if (!user) {
    return res.status(401).json({ message: 'Não autorizado.' });
  }

  if (!Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'ID da nota inválido.' });
  }

  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: 'Nota não encontrada.' });
    }

    if (user.role === 'Viewer') {
      return res.status(403).json({ message: 'Acesso negado: Visualizadores não podem atualizar notas.' });
    }
    
    const hasPermissionToUpdate = user.role === 'Admin' ||
                                  note.author.toString() === user._id.toString() ||
                                  note.team === user.role ||
                                  (note.team === 'Geral' && (user.role === 'Support TI' || user.role === 'Sistemas MV'));

    if (!hasPermissionToUpdate) {
      return res.status(403).json({ message: 'Acesso negado: Você não tem permissão para atualizar esta nota.' });
    }
    
    // CAPTURA A VERSÃO ATUAL ANTES DE ATUALIZAR O CONTEÚDO
    // Apenas se o conteúdo foi realmente alterado
    if (content !== undefined && content !== note.content) {
      note.versionHistory.push({
        content: note.content, // Conteúdo da versão anterior
        editedAt: new Date(),
        editor: user._id,
        editorName: user.name
      });
    }

    // Admins podem alterar a equipe da nota. Outras roles não.
    if (team && team !== note.team) {
        if (user.role === 'Admin') {
            if (!['Geral', 'Support TI', 'Sistemas MV'].includes(team)) {
                return res.status(400).json({ message: 'Equipe inválida fornecida.' });
            }
            note.team = team;
        } else {
            return res.status(403).json({ message: 'Acesso negado: Você não pode alterar a equipe da nota.' });
        }
    }

    note.title = title !== undefined ? title : note.title;
    note.content = content !== undefined ? content : note.content;
    note.tags = tags !== undefined ? tags : note.tags;

    const updatedNote = await note.save(); // Salva a nota com o histórico atualizado
    res.json(updatedNote);
  } catch (error: any) {
    console.error('Erro ao atualizar nota:', error);
    res.status(400).json({ message: `Erro ao atualizar nota: ${error.message}` });
  }
};

// @desc    Deletar uma nota
// @route   DELETE /api/notes/:id
// @access  Private
export const deleteNote = async (req: AuthenticatedRequest, res: Response) => {
  const { user } = req;

  if (!user) {
    return res.status(401).json({ message: 'Não autorizado.' });
  }

  if (!Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'ID da nota inválido.' });
  }

  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: 'Nota não encontrada.' });
    }

    if (user.role === 'Viewer') {
      return res.status(403).json({ message: 'Acesso negado: Visualizadores não podem deletar notas.' });
    }
    
    const hasPermissionToDelete = user.role === 'Admin' ||
                                  note.author.toString() === user._id.toString() ||
                                  note.team === user.role ||
                                  (note.team === 'Geral' && (user.role === 'Support TI' || user.role === 'Sistemas MV'));

    if (!hasPermissionToDelete) {
      return res.status(403).json({ message: 'Acesso negado: Você não tem permissão para deletar esta nota.' });
    }

    await Note.deleteOne({ _id: req.params.id });
    res.json({ message: 'Nota removida com sucesso.' });
  } catch (error: any) {
    console.error('Erro ao deletar nota:', error);
    res.status(500).json({ message: `Erro no servidor ao deletar nota: ${error.message}` });
  }
};
