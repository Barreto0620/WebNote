import { Request, Response } from 'express';
import Note, { INote } from '../models/Note'; // Importa o modelo de nota e sua interface
import { Types } from 'mongoose'; // Usado para validar ObjectId

// Define todas as roles de equipe para uso em validações de permissão
const ALL_TEAM_ROLES = ['Support TI', 'Sistemas MV'];

// @desc    Obter todas as notas (com filtros de busca, tags e equipe)
// @route   GET /api/notes
// @access  Private
export const getNotes = async (req: Request, res: Response) => {
  try {
    const { user } = req; // O usuário autenticado é anexado pelo middleware 'protect'

    if (!user) {
      return res.status(401).json({ message: 'Não autorizado: usuário não autenticado.' });
    }

    let query: any = {}; // Objeto de query para o Mongoose
    const { search, tag, teamView } = req.query; // Parâmetros de query para filtragem

    // Lógica principal para determinar quais notas o usuário pode ver com base na sua role e na `teamView` solicitada
    if (teamView && typeof teamView === 'string') {
        // ADMIN: Pode ver notas de qualquer equipe solicitada.
        if (user.role === 'Admin') {
            query.team = teamView;
        } 
        // VIEWER: Só pode ver notas da equipe 'Geral'. Se tentar ver outra, acesso negado.
        else if (user.role === 'Viewer') {
            if (teamView !== 'Geral') {
                return res.status(403).json({ message: `Acesso negado: Visualizadores só podem ver notas da equipe Geral.` });
            }
            query.team = 'Geral';
        } 
        // USUÁRIOS DE EQUIPE (Support TI, Sistemas MV):
        else if (ALL_TEAM_ROLES.includes(user.role)) {
            if (teamView === 'Geral') {
                // Se um usuário de equipe pede a "Visão Geral", ele vê notas de TODAS as equipes e 'Geral'.
                query.team = { $in: [...ALL_TEAM_ROLES, 'Geral'] }; 
            } else if (teamView === user.role) {
                // Se um usuário de equipe pede a visão da sua própria equipe, ele vê APENAS as notas dessa equipe.
                query.team = user.role;
            } else {
                // Se um usuário de equipe tenta ver notas de OUTRA equipe específica diretamente (não 'Geral'), acesso negado.
                return res.status(403).json({ message: `Acesso negado: Você não tem permissão para visualizar notas da equipe "${teamView}".` });
            }
        } else {
            // Outras roles não definidas (fallback de segurança)
            return res.status(403).json({ message: 'Acesso negado para esta função de usuário.' });
        }
    } else {
        // Se NENHUM 'teamView' foi especificado na query (e.g., carga inicial da página):
        // ADMINS: Vêem todas as notas por padrão.
        if (user.role === 'Admin') {
            // Nenhuma restrição de equipe na query para admin (ele vê tudo).
        } 
        // VIEWERS: Vêem apenas notas da equipe 'Geral' por padrão.
        else if (user.role === 'Viewer') {
            query.team = 'Geral'; 
        } 
        // USUÁRIOS DE EQUIPE (Support TI, Sistemas MV): Vêem notas de TODAS as equipes e 'Geral' por padrão.
        else if (ALL_TEAM_ROLES.includes(user.role)) {
            query.team = { $in: [...ALL_TEAM_ROLES, 'Geral'] }; 
        } else {
          return res.status(403).json({ message: 'Acesso negado para esta função de usuário.' });
        }
    }

    // Aplicar filtros de busca por texto (combina com o filtro de equipe)
    if (search) {
      const searchRegex = new RegExp(search as string, 'i'); // Case-insensitive
      query.$or = [
        { title: searchRegex },
        { content: searchRegex },
        { authorName: searchRegex },
        { tags: searchRegex } // Busca também nas tags
      ];
    }

    // Aplicar filtro por tag específica (combina com outros filtros)
    if (tag && tag !== 'all') { // 'all' pode ser um valor para não filtrar por tag
      query.tags = tag;
    }

    // Busca as notas no banco de dados com a query construída e ordena pela última atualização
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
export const createNote = async (req: Request, res: Response) => {
  const { title, content, team, tags } = req.body;
  const { user } = req;

  if (!user) {
    return res.status(401).json({ message: 'Não autorizado: usuário não autenticado.' });
  }

  // Viewers não podem criar notas
  if (user.role === 'Viewer') {
    return res.status(403).json({ message: 'Acesso negado: Visualizadores não podem criar notas.' });
  }

  // Valida que a equipe fornecida é uma das permitidas
  if (!team || !['Geral', 'Support TI', 'Sistemas MV'].includes(team)) {
    return res.status(400).json({ message: 'Equipe inválida ou não fornecida. Equipes válidas: Geral, Support TI, Sistemas MV.' });
  }

  // Usuários de equipe só podem criar notas para sua própria equipe ou 'Geral'
  if (ALL_TEAM_ROLES.includes(user.role)) {
    if (team !== 'Geral' && team !== user.role) {
      return res.status(403).json({ message: `Acesso negado: Você só pode criar notas para a equipe "${user.role}" ou "Geral".` });
    }
  }

  // Validação de campos obrigatórios
  if (!title || !content) {
    return res.status(400).json({ message: 'Por favor, inclua título e conteúdo para a nota.' });
  }

  try {
    // Cria uma nova instância de Nota
    const newNote: INote = new Note({
      title,
      content,
      author: user._id, // Define o autor como o usuário autenticado
      authorName: user.name,
      team: team,
      tags: tags || [] // Define tags, default para array vazio se não fornecido
      // O 'pre save' hook no modelo Note já adiciona a primeira versão ao histórico
    });
    const savedNote = await newNote.save(); // Salva a nova nota
    res.status(201).json(savedNote); // Retorna a nota criada com status 201
  } catch (error: any) {
    console.error('Erro ao criar nota:', error);
    res.status(400).json({ message: `Erro ao criar nota: ${error.message}` });
  }
};

// @desc    Obter uma nota por ID
// @route   GET /api/notes/:id
// @access  Private
export const getNoteById = async (req: Request, res: Response) => {
  try {
    const { user } = req;

    if (!user) {
      return res.status(401).json({ message: 'Não autorizado.' });
    }

    // Valida se o ID da nota é um ObjectId válido do MongoDB
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
      // Viewers só podem ver notas da equipe 'Geral'
      if (note.team !== 'Geral') {
        return res.status(403).json({ message: 'Acesso negado: Visualizadores só podem ver notas gerais.' });
      }
    } else if (ALL_TEAM_ROLES.includes(user.role)) { // Se é um usuário de equipe (Support TI, Sistemas MV)
      // Usuários de equipe podem ver:
      // 1. Notas das quais são autores
      // 2. Notas da sua própria equipe
      // 3. Notas da equipe 'Geral'
      // 4. Notas de OUTRAS equipes específicas (para permitir a "Visão Geral" sem ser Admin)
      const canView = note.author.toString() === user._id.toString() ||
                      note.team === user.role ||
                      note.team === 'Geral' ||
                      (ALL_TEAM_ROLES.includes(note.team) && note.team !== user.role); // Acesso a outras equipes específicas

      if (!canView) {
          return res.status(403).json({ message: 'Acesso negado: Você não tem permissão para ver esta nota.' });
      }
    } else {
        return res.status(403).json({ message: 'Acesso negado para esta função de usuário.' });
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
export const updateNote = async (req: Request, res: Response) => {
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

    // Viewers não podem atualizar notas
    if (user.role === 'Viewer') {
      return res.status(403).json({ message: 'Acesso negado: Visualizadores não podem atualizar notas.' });
    }
    
    // Lógica de permissões para atualização:
    // Admin sempre pode.
    // O autor da nota pode atualizar.
    // Usuários de equipe podem atualizar notas que pertencem à sua própria equipe ou notas 'Geral'.
    const hasPermissionToUpdate = user.role === 'Admin' ||
                                  note.author.toString() === user._id.toString() ||
                                  (ALL_TEAM_ROLES.includes(user.role) && (note.team === user.role || note.team === 'Geral'));

    if (!hasPermissionToUpdate) {
      return res.status(403).json({ message: 'Acesso negado: Você não tem permissão para atualizar esta nota.' });
    }
    
    // Captura a versão atual do conteúdo ANTES de aplicar as atualizações
    // Adiciona ao histórico apenas se o conteúdo foi realmente modificado.
    if (content !== undefined && content !== note.content) {
      note.versionHistory.push({
        content: note.content,
        editedAt: new Date(),
        editor: user._id,
        editorName: user.name
      });
    }

    // Admins são os únicos que podem alterar a equipe de uma nota.
    if (team !== undefined && team !== note.team) {
        if (user.role === 'Admin') {
            if (!['Geral', 'Support TI', 'Sistemas MV'].includes(team)) {
                return res.status(400).json({ message: 'Equipe inválida fornecida.' });
            }
            note.team = team;
        } else {
            return res.status(403).json({ message: 'Acesso negado: Você não pode alterar a equipe da nota.' });
        }
    }

    // Atualiza os campos da nota, usando os valores fornecidos ou mantendo os existentes
    note.title = title !== undefined ? title : note.title;
    note.content = content !== undefined ? content : note.content;
    note.tags = tags !== undefined ? tags : note.tags;

    const updatedNote = await note.save(); // Salva as alterações, incluindo o histórico de versão
    res.json(updatedNote);
  } catch (error: any) {
    console.error('Erro ao atualizar nota:', error);
    res.status(400).json({ message: `Erro ao atualizar nota: ${error.message}` });
  }
};

// @desc    Deletar uma nota
// @route   DELETE /api/notes/:id
// @access  Private
export const deleteNote = async (req: Request, res: Response) => {
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

    // Viewers não podem deletar notas
    if (user.role === 'Viewer') {
      return res.status(403).json({ message: 'Acesso negado: Visualizadores não podem deletar notas.' });
    }
    
    // Lógica de permissões para exclusão:
    // Admin sempre pode.
    // O autor da nota pode deletar.
    // Usuários de equipe podem deletar notas que pertencem à sua própria equipe ou notas 'Geral'.
    const hasPermissionToDelete = user.role === 'Admin' ||
                                  note.author.toString() === user._id.toString() ||
                                  (ALL_TEAM_ROLES.includes(user.role) && (note.team === user.role || note.team === 'Geral'));

    if (!hasPermissionToDelete) {
      return res.status(403).json({ message: 'Acesso negado: Você não tem permissão para deletar esta nota.' });
    }

    await Note.deleteOne({ _id: req.params.id }); // Deleta a nota
    res.json({ message: 'Nota removida com sucesso.' });
  } catch (error: any) {
    console.error('Erro ao deletar nota:', error);
    res.status(500).json({ message: `Erro no servidor ao deletar nota: ${error.message}` });
  }
};


// @desc    Adicionar um comentário a uma nota
// @route   POST /api/notes/:id/comments
// @access  Private
export const addCommentToNote = async (req: Request, res: Response) => {
  const { id } = req.params; // ID da nota
  const { content } = req.body; // Conteúdo do comentário
  const { user } = req; // Usuário autenticado

  if (!user) {
    return res.status(401).json({ message: 'Não autorizado: usuário não autenticado.' });
  }

  if (!Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'ID da nota inválido.' });
  }

  // Validação do conteúdo do comentário
  if (!content || content.trim() === '') {
    return res.status(400).json({ message: 'O conteúdo do comentário não pode estar vazio.' });
  }

  try {
    const note = await Note.findById(id);

    if (!note) {
      return res.status(404).json({ message: 'Nota não encontrada.' });
    }

    // LÓGICA DE PERMISSÕES PARA COMENTAR:
    const canComment = user.role === 'Admin' || // Admin sempre pode comentar
                       note.author.toString() === user._id.toString() || // O autor da nota pode comentar
                       (user.role === 'Viewer' && note.team === 'Geral') || // Viewer só pode comentar em notas 'Geral'
                       (
                         ALL_TEAM_ROLES.includes(user.role) && // Se é um usuário de equipe
                         (note.team === user.role || // Pode comentar em notas da sua equipe
                          note.team === 'Geral' || // Pode comentar em notas 'Geral'
                          (ALL_TEAM_ROLES.includes(note.team) && note.team !== user.role) // Pode comentar em notas de OUTRAS equipes específicas
                         )
                       );

    if (!canComment) {
      return res.status(403).json({ message: 'Acesso negado: Você não tem permissão para comentar nesta nota.' });
    }

    // Cria o novo objeto de comentário
    const newComment = {
      content,
      author: user._id,
      authorName: user.name,
      createdAt: new Date(),
    };

    note.comments.push(newComment); // Adiciona o novo comentário ao array de comentários da nota
    await note.save(); // Salva a nota com o novo comentário

    // Retorna o comentário recém-adicionado (o último do array, que terá um _id do MongoDB)
    const savedComment = note.comments[note.comments.length - 1];
    res.status(201).json(savedComment);

  } catch (error: any) {
    console.error('Erro ao adicionar comentário:', error);
    res.status(500).json({ message: `Erro no servidor ao adicionar comentário: ${error.message}` });
  }
};