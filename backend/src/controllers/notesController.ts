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

// Define todas as roles de equipe que podem ter acesso cruzado na "Visão Geral"
const ALL_TEAM_ROLES = ['Support TI', 'Sistemas MV'];

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
    const { search, tag, teamView } = req.query; // teamView vem do frontend (ex: 'Geral', 'Support TI', 'Sistemas MV')

    // Lógica principal para determinar quais notas o usuário pode ver com base na sua role e na teamView solicitada
    if (teamView && typeof teamView === 'string') {
        // ADMIN: Pode ver qualquer teamView solicitada (Admin é superusuário).
        if (user.role === 'Admin') {
            query.team = teamView;
        } 
        // VIEWER: Só pode ver 'Geral'. Se tentar outra coisa, barra.
        else if (user.role === 'Viewer') {
            if (teamView !== 'Geral') {
                return res.status(403).json({ message: `Acesso negado: Visualizadores só podem ver notas da equipe Geral.` });
            }
            query.team = 'Geral';
        } 
        // USUÁRIOS DE EQUIPE (Support TI, Sistemas MV):
        else if (ALL_TEAM_ROLES.includes(user.role)) { // Verifica se a role do usuário é uma das equipes
            if (teamView === 'Geral') {
                // Se um usuário de equipe pede a "Visão Geral", ele deve ver:
                // 1. Notas da sua própria equipe (user.role)
                // 2. Notas da equipe 'Geral'
                // 3. Notas das OUTRAS equipes específicas (ex: se é Support TI, vê Sistemas MV)
                query.team = { $in: [...ALL_TEAM_ROLES, 'Geral'] }; // <-- MUDANÇA CHAVE AQUI!
            } else if (teamView === user.role) {
                // Se um usuário de equipe pede a visão da sua própria equipe (ex: "Sistemas MV" clica em "Sistemas MV"),
                // ele vê APENAS as notas da sua própria equipe.
                query.team = user.role;
            } else {
                // Se um usuário de equipe tenta ver notas de OUTRA equipe específica diretamente (que não a dele nem Geral), barra.
                // Ex: "Sistemas MV" tenta clicar em uma aba específica "Support TI" (que não existe na sidebar do front, mas é uma rota possível)
                return res.status(403).json({ message: `Acesso negado: Você não tem permissão para visualizar a equipe "${teamView}".` });
            }
        } else {
            // Outras roles não definidas (fallback de segurança)
            return res.status(403).json({ message: 'Acesso negado para esta função.' });
        }
    } else {
        // Se NENHUM 'teamView' foi especificado na query (e.g., carga inicial do MainContent):
        // ADMINS: Vêem tudo (nenhum filtro de equipe padrão aqui).
        if (user.role === 'Admin') {
            // Nenhum filtro de 'query.team' por padrão para admin, ele vê todas as notas.
        } 
        // VIEWERS: Vêem apenas 'Geral' por padrão.
        else if (user.role === 'Viewer') {
            query.team = 'Geral'; 
        } 
        // USUÁRIOS DE EQUIPE (Support TI, Sistemas MV): Vêem todas as notas de equipes E as notas 'Geral' por padrão.
        else if (ALL_TEAM_ROLES.includes(user.role)) {
            query.team = { $in: [...ALL_TEAM_ROLES, 'Geral'] }; // <-- MUDANÇA CHAVE AQUI TAMBÉM!
        } else {
            return res.status(403).json({ message: 'Acesso negado para esta função.' });
        }
    }

    // Aplicar filtros de busca e tags (estes filtros se combinam com o filtro de equipe)
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

  // Usuários de equipe só podem criar notas para sua própria equipe ou 'Geral'
  if (ALL_TEAM_ROLES.includes(user.role)) {
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

    // Lógica de permissão para visualizar uma nota específica
    if (user.role === 'Admin') {
      // Admin tem acesso total
    } else if (user.role === 'Viewer') {
      if (note.team !== 'Geral') {
        return res.status(403).json({ message: 'Acesso negado: Visualizadores só podem ver notas gerais.' });
      }
    } else if (ALL_TEAM_ROLES.includes(user.role)) { // Se é um usuário de equipe
      // Usuários de equipe podem ver: suas próprias notas, notas da sua equipe, notas 'Geral', ou notas de OUTRAS equipes específicas
      const canView = note.author.toString() === user._id.toString() || // É o autor da nota
                      note.team === user.role || // Nota da sua equipe
                      note.team === 'Geral' || // Nota Geral
                      (ALL_TEAM_ROLES.includes(note.team) && note.team !== user.role); // <-- NOVO: Permite ver notas de OUTRAS equipes específicas

      if (!canView) {
         return res.status(403).json({ message: 'Acesso negado: Você não tem permissão para ver esta nota.' });
      }
    } else {
        return res.status(403).json({ message: 'Acesso negado para esta função.' });
    }

    res.json(note); // Retorna a nota, que agora incluirá o versionHistory e os comments
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
    
    // Permissão para atualizar: Admin, Autor, ou Equipe + Geral (como antes)
    const hasPermissionToUpdate = user.role === 'Admin' ||
                                  note.author.toString() === user._id.toString() ||
                                  note.team === user.role ||
                                  (note.team === 'Geral' && ALL_TEAM_ROLES.includes(user.role));

    if (!hasPermissionToUpdate) {
      return res.status(403).json({ message: 'Acesso negado: Você não tem permissão para atualizar esta nota.' });
    }
    
    // CAPTURA A VERSÃO ATUAL ANTES DE ATUALIZAR O CONTEÚDO
    if (content !== undefined && content !== note.content) {
      note.versionHistory.push({
        content: note.content,
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

    const updatedNote = await note.save();
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
    
    // Permissão para deletar: Admin, Autor, ou Equipe + Geral (como antes)
    const hasPermissionToDelete = user.role === 'Admin' ||
                                  note.author.toString() === user._id.toString() ||
                                  note.team === user.role ||
                                  (note.team === 'Geral' && ALL_TEAM_ROLES.includes(user.role));

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


// @desc    Adicionar um comentário a uma nota
// @route   POST /api/notes/:id/comments
// @access  Private
export const addCommentToNote = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params; // ID da nota
  const { content } = req.body; // Conteúdo do comentário
  const { user } = req; // Usuário autenticado

  if (!user) {
    return res.status(401).json({ message: 'Não autorizado, usuário não autenticado.' });
  }

  if (!Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'ID da nota inválido.' });
  }

  if (!content || content.trim() === '') {
    return res.status(400).json({ message: 'O conteúdo do comentário não pode estar vazio.' });
  }

  try {
    const note = await Note.findById(id);

    if (!note) {
      return res.status(404).json({ message: 'Nota não encontrada.' });
    }

    // LÓGICA DE PERMISSÕES DEFINITIVA PARA COMENTAR:
    const canComment = user.role === 'Admin' || // Admin sempre pode
                       note.author.toString() === user._id.toString() || // O autor da nota pode comentar
                       (user.role === 'Viewer' && note.team === 'Geral') || // Viewer só em notas Gerais
                       (
                         ALL_TEAM_ROLES.includes(user.role) && // Se é um usuário de equipe
                         (note.team === user.role || // Pode comentar em notas da sua equipe
                          note.team === 'Geral' || // Em notas Gerais
                          (ALL_TEAM_ROLES.includes(note.team) && note.team !== user.role) // <-- NOVO: Pode comentar em notas de OUTRAS equipes específicas
                         )
                       );

    if (!canComment) {
      return res.status(403).json({ message: 'Acesso negado: Você não tem permissão para comentar nesta nota.' });
    }

    const newComment = {
      content,
      author: user._id,
      authorName: user.name,
      createdAt: new Date(),
    };

    note.comments.push(newComment); // Adiciona o novo comentário ao array
    await note.save(); // Salva a nota com o novo comentário

    // Retorna o comentário recém-adicionado (o último do array, que terá um _id do MongoDB)
    const savedComment = note.comments[note.comments.length - 1];
    res.status(201).json(savedComment);

  } catch (error: any) {
    console.error('Erro ao adicionar comentário:', error);
    res.status(500).json({ message: `Erro no servidor ao adicionar comentário: ${error.message}` });
  }
};
