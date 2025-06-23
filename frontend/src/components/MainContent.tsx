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

  const loadNotes = useCallback(async () => {
    if (!user) {
      setIsLoadingNotes(false);
      return;
    }
    setIsLoadingNotes(true);
    try {
      let teamViewForApi: string | undefined = undefined;

      // Apenas Admins e usuários de equipe podem ter suas views específicas filtradas
      // Viewers sempre veem o que o backend permite para 'Geral'
      if (user.role === 'Admin' || user.role === 'Viewer') {
        // Admins podem ver todas as notas (sem filtro de team na query inicial)
        // Viewers só veem notas 'Geral'. Se a currentView for 'Geral', passamos 'Geral'
        // ou não passamos nada para o backend se a lógica for que o backend já sabe o que o viewer pode ver.
        // Para consistência, se a view for "Geral" para Admin/Viewer, pedimos "Geral".
        if (currentView === 'Geral') {
          teamViewForApi = 'Geral';
        } else if (user.role === 'Admin') {
          // Admin pode ver notas de qualquer equipe se ele mudar a view no sidebar
          teamViewForApi = currentView === 'Support TI' || currentView === 'Sistemas MV' ? currentView : undefined;
        } else {
          // Se for Viewer e não 'Geral', não deveria ter acesso a outras views pelo sidebar,
          // mas para garantir, se for uma view de equipe, não passamos filtro.
          // O backend deve recusar acesso.
        }
      } else if (user.role === 'Support TI' || user.role === 'Sistemas MV') {
        // Usuários de equipe veem notas da sua própria equipe e 'Geral'
        // Se a currentView é a da equipe, passamos a da equipe. Se for 'Geral', passamos 'Geral'.
        teamViewForApi = currentView;
      }

      // Se a currentView é 'Geral' e o user.role é 'Admin', não precisamos de teamViewForApi
      // pois o Admin vê tudo.
      if (user.role === 'Admin' && currentView === 'Geral') {
        teamViewForApi = undefined;
      }

      const fetchedNotes = await fetchNotes({
        search: searchTerm,
        tag: filterTag !== 'all' ? filterTag : undefined,
        teamView: teamViewForApi // Passa a view atual para o backend para filtragem
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

  const handleSaveNote = async (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'author' | 'authorName' | '_id'>) => { // Removido '_id' também
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
        // ATENÇÃO AQUI: Use editingNote._id para a atualização
        await updateNoteApi(editingNote._id, { // <-- Alterado de editingNote.id para editingNote._id
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

  const handleDeleteNote = async (noteId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta nota?')) {
      return;
    }

    try {
      await deleteNoteApi(noteId);
      loadNotes();
      toast({ title: "Nota excluída!", description: "A nota foi removida com sucesso." });
    } catch (error: any) {
      console.error('Erro ao deletar nota:', error);
      toast({
        title: "Erro ao excluir nota",
        description: error.message || "Não foi possível excluir a nota do servidor.",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingNote(undefined);
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

  if (isEditing) {
    return (
      <div className="p-4 md:p-6">
        <NoteEditor
          note={editingNote}
          onSave={handleSaveNote}
          onCancel={handleCancelEdit}
          defaultTeam={currentView === 'Geral' && user?.role !== 'Admin' ? 'Geral' : currentView as 'Support TI' | 'Sistemas MV' | 'Geral'} // Ajusta o defaultTeam
          userRole={user?.role}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-6 min-h-screen bg-gray-50 dark:bg-gray-900">
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
              key={note._id} // Use note._id como key
              note={note}
              onEdit={handleEditNote}
              onDelete={handleDeleteNote}
              onViewHistory={(noteId) => setShowVersionHistory(noteId)}
              showComments={currentView === 'Geral'}
              canEditOrDelete={
                user?.role === 'Admin' ||
                (user?.role !== 'Viewer' &&
                 (note.author === user?.id || note.team === user?.role || (note.team === 'Geral' && user?.role !== 'Viewer')) // Editado: Equipe TI/MV podem editar notas gerais.
                )
              }
            />
          ))}
        </div>
      )}

      {!isLoadingNotes && filteredNotes.length > 0 && (
        <div className="mt-6 md:mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Mostrando {filteredNotes.length} de {notes.length} nota{notes.length !== 1 ? 's' : ''}
            {searchTerm && ` para "${searchTerm}"`}
            {filterTag && filterTag !== 'all' && ` com tag "${filterTag}"`}
          </p>
        </div>
      )}
    </div>
  );
};

export default MainContent;
