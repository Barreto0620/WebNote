import React, { useState, useEffect, useCallback } from 'react';
import { Note, ViewMode } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { fetchNotes, createNoteApi, updateNoteApi, deleteNoteApi } from '@/services/notesApi';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import NoteCard from './NoteCard';
import NoteEditor from './NoteEditor';
import VersionHistory from './VersionHistory';
import { Plus, Search, Filter } from 'lucide-react';
import ConfirmationDialog from './ConfirmationDialog';
import NoteComments from './NoteComments';

interface MainContentProps {
  currentView: ViewMode;
}

const MainContent: React.FC<MainContentProps> = ({ currentView }) => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | undefined>();
  const [showVersionHistory, setShowVersionHistory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState<string>('');
  const [isLoadingNotes, setIsLoadingNotes] = useState(true);
  
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [noteToDeleteId, setNoteToDeleteId] = useState<string | null>(null);

  const [showCommentsPanel, setShowCommentsPanel] = useState<string | null>(null);

  const loadNotes = useCallback(async () => {
    if (!user) {
      setIsLoadingNotes(false);
      return;
    }
    setIsLoadingNotes(true);
    try {
      let teamViewForApi: string | undefined = undefined;

      if (user.role === 'Admin') {
        teamViewForApi = currentView === 'Geral' ? undefined : currentView;
      } else if (user.role === 'Viewer') {
        teamViewForApi = 'Geral';
      } else if (user.role === 'Support TI' || user.role === 'Sistemas MV') {
        teamViewForApi = currentView;
      }

      const fetchedNotes = await fetchNotes({
        search: searchTerm,
        tag: filterTag !== 'all' ? filterTag : undefined,
        teamView: teamViewForApi
      });
      setNotes(fetchedNotes);
    } catch (error: any) {
      console.error('Erro ao carregar notas:', error);
      toast({
        title: "Erro ao carregar notas",
        description: error.message || "Não foi possível carregar as notas do servidor.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingNotes(false);
    }
  }, [user, currentView, searchTerm, filterTag]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const filterNotes = () => {
    let filtered = [...notes];
    filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    setFilteredNotes(filtered);
  };

  useEffect(() => {
    filterNotes();
  }, [notes]);

  const handleCreateNote = () => {
    setEditingNote(undefined);
    setIsEditing(true);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setIsEditing(true);
  };

  const handleSaveNote = async (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'author' | 'authorName' | '_id' | 'comments' | 'versionHistory'>) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para salvar notas.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingNote) {
        await updateNoteApi(editingNote._id, { 
          title: noteData.title,
          content: noteData.content,
          team: noteData.team,
          tags: noteData.tags,
        });
        toast({ title: "Nota atualizada!", description: "Suas alterações foram salvas com sucesso." });
      } else {
        await createNoteApi({
          ...noteData,
          authorId: user.id,
          authorName: user.name,
        });
        toast({ title: "Nota criada!", description: "Nova nota criada com sucesso." });
      }
      loadNotes();
      setIsEditing(false);
      setEditingNote(undefined);
    } catch (error: any) {
      console.error('Erro ao salvar nota:', error);
      toast({
        title: "Erro ao salvar nota",
        description: error.message || "Não foi possível salvar a nota no servidor.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteNote = (noteId: string) => {
    setNoteToDeleteId(noteId);
    setShowConfirmDelete(true);
  };

  const confirmDelete = async () => {
    if (!noteToDeleteId) return;

    try {
      await deleteNoteApi(noteToDeleteId);
      loadNotes();
      toast({ title: "Nota excluída!", description: "A nota foi removida com sucesso." });
    } catch (error: any) {
      console.error('Erro ao deletar nota:', error);
      toast({
        title: "Erro ao excluir nota",
        description: error.message || "Não foi possível excluir a nota do servidor.",
        variant: "destructive",
      });
    } finally {
      setShowConfirmDelete(false);
      setNoteToDeleteId(null);
    }
  };

  const handleCancelDelete = () => {
    setShowConfirmDelete(false);
    setNoteToDeleteId(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingNote(undefined);
  };

  const handleViewComments = (noteId: string) => {
    setShowCommentsPanel(noteId);
  };

  const canCreateNote = () => {
    if (user?.role === 'Viewer') return false;
    if (currentView === 'Geral' && user?.role !== 'Admin') return false;
    if (user?.role === 'Admin') return true;
    return user?.role === currentView;
  };

  const getAllTags = () => {
    const allTags = notes.flatMap(note => note.tags);
    return Array.from(new Set(allTags)).sort();
  };

  const getViewTitle = () => {
    switch (currentView) {
      case 'Support TI': return 'Notas da Equipe Support TI';
      case 'Sistemas MV': return 'Notas da Equipe Sistemas MV';
      case 'Geral': return 'Visão Geral - Todas as Notas';
      case 'Admin': return 'Painel de Administração de Notas';
      case 'Viewer': return 'Visualização de Notas';
      default: return 'Notas';
    }
  };

  const getViewDescription = () => {
    switch (currentView) {
      case 'Support TI': return 'Documentações e procedimentos da equipe de suporte técnico.';
      case 'Sistemas MV': return 'Documentações e configurações dos sistemas MV.';
      case 'Geral': return 'Visualização consolidada de todas as notas da organização.';
      case 'Admin': return 'Acesso e gerenciamento completo de todas as notas.';
      case 'Viewer': return 'Acesso apenas para visualização das notas gerais.';
      default: return '';
    }
  };

  if (showVersionHistory) {
    return (
      <VersionHistory
        noteId={showVersionHistory}
        onClose={() => setShowVersionHistory(null)}
      />
    );
  }

  // Renderiza o painel de comentários se showCommentsPanel estiver ativo
  if (showCommentsPanel) {
    return (
      <NoteComments
        noteId={showCommentsPanel}
        onClose={() => setShowCommentsPanel(null)}
        onCommentAdded={() => loadNotes()} // <-- NOVO: Callback para recarregar MainContent após adicionar comentário
      />
    );
  }

  if (isEditing) {
    return (
      <div className="p-4 md:p-6">
        <NoteEditor
          note={editingNote}
          onSave={handleSaveNote}
          onCancel={handleCancelEdit}
          defaultTeam={currentView === 'Geral' && user?.role !== 'Admin' ? 'Geral' : currentView as 'Support TI' | 'Sistemas MV' | 'Geral'}
          userRole={user?.role}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-6 min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Cabeçalho da página de notas */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 space-y-2 md:space-y-0">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
              {getViewTitle()}
            </h1>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">
              {getViewDescription()}
            </p>
          </div>
          {/* Botão para criar nova nota, visível apenas se o usuário tiver permissão */}
          {canCreateNote() && (
            <Button
              onClick={handleCreateNote}
              className="bg-green-600 hover:bg-green-700 text-white w-full md:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Nota
            </Button>
          )}
        </div>

        {/* Componentes de Busca e Filtros */}
        <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar notas, autores ou tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterTag} onValueChange={setFilterTag}>
            <SelectTrigger className="w-full md:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filtrar por tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as tags</SelectItem>
              {getAllTags().map((tag) => (
                <SelectItem key={tag} value={tag}>
                  #{tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Exibição do status de carregamento, notas filtradas ou mensagem de "sem notas" */}
      {isLoadingNotes ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          Carregando notas...
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-base md:text-lg mb-4">
            {searchTerm || filterTag 
              ? 'Nenhuma nota encontrada com os filtros aplicados.'
              : currentView === 'Geral' 
                ? 'Nenhuma nota foi criada ainda.'
                : `Nenhuma nota da equipe ${currentView} foi criada ainda.`
            }
          </p>
          {canCreateNote() && !searchTerm && !filterTag && (
            <Button
              onClick={handleCreateNote}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Nota
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredNotes.map((note) => (
            <NoteCard
              key={note._id}
              note={note}
              onEdit={handleEditNote}
              onDelete={handleDeleteNote}
              onViewHistory={(noteId) => setShowVersionHistory(noteId)}
              onViewComments={handleViewComments}
              showComments={currentView === 'Geral'}
              canEditOrDelete={
                user?.role === 'Admin' ||
                (user?.role !== 'Viewer' &&
                 (note.author === user?.id || note.team === user?.role || (note.team === 'Geral' && (user?.role === 'Support TI' || user?.role === 'Sistemas MV')))
                )
              }
            />
          ))}
        </div>
      )}

      {/* Estatísticas de notas */}
      {!isLoadingNotes && filteredNotes.length > 0 && (
        <div className="mt-6 md:mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Mostrando {filteredNotes.length} de {notes.length} nota{notes.length !== 1 ? 's' : ''}
            {searchTerm && ` para "${searchTerm}"`}
            {filterTag && filterTag !== 'all' && ` com tag "${filterTag}"`}
          </p>
        </div>
      )}

      {/* Componente do modal de confirmação de exclusão */}
      <ConfirmationDialog
        isOpen={showConfirmDelete}
        onConfirm={confirmDelete}
        onCancel={handleCancelDelete}
        title="Confirmar Exclusão"
        description="Tem certeza que deseja excluir esta nota? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
      />
    </div>
  );
};

export default MainContent;
