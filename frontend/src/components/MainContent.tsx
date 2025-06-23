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
import ConfirmationDialog from './ConfirmationDialog'; // Importa o componente do modal

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
  
  // Novos estados para o modal de confirmação de exclusão
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [noteToDeleteId, setNoteToDeleteId] = useState<string | null>(null);


  // Função para carregar notas do backend
  const loadNotes = useCallback(async () => {
    if (!user) {
      setIsLoadingNotes(false);
      return; // Não carrega notas se o usuário não estiver logado
    }
    setIsLoadingNotes(true);
    try {
      let teamViewForApi: string | undefined = undefined;

      // Define o parâmetro `teamView` a ser enviado para a API, baseado na role do usuário
      // e na `currentView` selecionada na Sidebar.
      if (user.role === 'Admin') {
        // Admins podem ver todas as notas (quando 'Geral') ou filtrar por uma equipe específica
        teamViewForApi = currentView === 'Geral' ? undefined : currentView;
      } else if (user.role === 'Viewer') {
        // Viewers só podem ver notas 'Geral'
        teamViewForApi = 'Geral';
      } else if (user.role === 'Support TI' || user.role === 'Sistemas MV') {
        // Usuários de equipe podem ver notas da sua própria equipe e 'Geral'
        teamViewForApi = currentView; // A API vai lidar com 'Geral' ou a equipe específica
      }

      const fetchedNotes = await fetchNotes({
        search: searchTerm,
        tag: filterTag !== 'all' ? filterTag : undefined,
        teamView: teamViewForApi // Passa a view para o backend para filtragem
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
  }, [user, currentView, searchTerm, filterTag]); // Adiciona dependências

  // Efeito para carregar as notas ao montar o componente ou mudar as dependências
  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  // Função para filtrar e ordenar notas localmente (após a API já ter filtrado)
  const filterNotes = () => {
    let filtered = [...notes]; // Começa com as notas já recebidas do backend
    // Apenas a ordenação é feita no frontend agora
    filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    setFilteredNotes(filtered);
  };

  // Efeito para re-filtrar/ordenar quando as notas carregadas mudam
  useEffect(() => {
    filterNotes();
  }, [notes]);

  // Handler para iniciar a criação de uma nova nota
  const handleCreateNote = () => {
    setEditingNote(undefined);
    setIsEditing(true);
  };

  // Handler para iniciar a edição de uma nota existente
  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setIsEditing(true);
  };

  // Handler para salvar (criar ou atualizar) uma nota
  const handleSaveNote = async (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'author' | 'authorName' | '_id'>) => {
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
        // Atualizar nota existente: usa editingNote._id
        await updateNoteApi(editingNote._id, { 
          title: noteData.title,
          content: noteData.content,
          team: noteData.team,
          tags: noteData.tags,
        });
        toast({ title: "Nota atualizada!", description: "Suas alterações foram salvas com sucesso." });
      } else {
        // Criar nova nota: envia dados para a API
        await createNoteApi({
          ...noteData,
          authorId: user.id, // ID do usuário logado
          authorName: user.name, // Nome do usuário logado
        });
        toast({ title: "Nota criada!", description: "Nova nota criada com sucesso." });
      }
      loadNotes(); // Recarrega as notas do backend após salvar
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

  // Handler para iniciar o processo de exclusão (abre o modal)
  const handleDeleteNote = (noteId: string) => {
    setNoteToDeleteId(noteId); // Armazena o ID da nota a ser deletada
    setShowConfirmDelete(true); // Exibe o modal de confirmação
  };

  // Handler chamado ao confirmar a exclusão no modal
  const confirmDelete = async () => {
    if (!noteToDeleteId) return; // Garante que há um ID para deletar

    try {
      await deleteNoteApi(noteToDeleteId); // Chama a API para deletar
      loadNotes(); // Recarrega as notas do backend
      toast({ title: "Nota excluída!", description: "A nota foi removida com sucesso." });
    } catch (error: any) {
      console.error('Erro ao deletar nota:', error);
      toast({
        title: "Erro ao excluir nota",
        description: error.message || "Não foi possível excluir a nota do servidor.",
        variant: "destructive",
      });
    } finally {
      // Sempre esconde o modal e limpa o ID, independentemente do sucesso/falha
      setShowConfirmDelete(false);
      setNoteToDeleteId(null);
    }
  };

  // Handler chamado ao cancelar a exclusão no modal
  const handleCancelDelete = () => {
    setShowConfirmDelete(false);
    setNoteToDeleteId(null);
  };

  // Handler para cancelar a edição/criação de nota
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingNote(undefined);
  };

  // Lógica de permissão para criar notas (controle no frontend)
  const canCreateNote = () => {
    if (user?.role === 'Viewer') return false; // Viewers não podem criar notas
    // Se a view atual é 'Geral', apenas Admins podem criar notas nesta categoria
    if (currentView === 'Geral' && user?.role !== 'Admin') return false;
    if (user?.role === 'Admin') return true; // Admins podem criar em qualquer view
    // Outras roles (Support TI, Sistemas MV) só podem criar notas se a view atual corresponder à sua role
    return user?.role === currentView;
  };

  // Obtém todas as tags únicas das notas carregadas
  const getAllTags = () => {
    const allTags = notes.flatMap(note => note.tags);
    return Array.from(new Set(allTags)).sort();
  };

  // Retorna o título da visualização atual
  const getViewTitle = () => {
    switch (currentView) {
      case 'Support TI': return 'Notas da Equipe Support TI';
      case 'Sistemas MV': return 'Notas da Equipe Sistemas MV';
      case 'Geral': return 'Visão Geral - Todas as Notas';
      case 'Admin': return 'Painel de Administração de Notas'; // Titulo para Admin view
      case 'Viewer': return 'Visualização de Notas'; // Titulo para Viewer view
      default: return 'Notas';
    }
  };

  // Retorna a descrição da visualização atual
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

  // Renderiza o histórico de versões se showVersionHistory estiver ativo
  if (showVersionHistory) {
    return (
      <VersionHistory
        noteId={showVersionHistory}
        onClose={() => setShowVersionHistory(null)}
      />
    );
  }

  // Renderiza o editor de notas se isEditing estiver ativo
  if (isEditing) {
    return (
      <div className="p-4 md:p-6">
        <NoteEditor
          note={editingNote}
          onSave={handleSaveNote}
          onCancel={handleCancelEdit}
          // Passa a currentView como defaultTeam, a menos que seja Geral e o usuário não seja Admin
          defaultTeam={currentView === 'Geral' && user?.role !== 'Admin' ? 'Geral' : currentView as 'Support TI' | 'Sistemas MV' | 'Geral'}
          userRole={user?.role} // Passa a role do usuário para controle de permissão no editor
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
              key={note._id} // Usa note._id como a chave única
              note={note}
              onEdit={handleEditNote}
              onDelete={handleDeleteNote} // Chama o handler que abre o modal
              onViewHistory={(noteId) => setShowVersionHistory(noteId)}
              showComments={currentView === 'Geral'} // Condicionalmente mostra comentários (se implementado)
              // Lógica para determinar se o usuário pode editar ou deletar a nota
              canEditOrDelete={
                user?.role === 'Admin' || // Admin sempre pode
                (user?.role !== 'Viewer' && // Não é Viewer E
                 (note.author === user?.id || // É o autor DA NOTA OU
                  note.team === user?.role || // A nota pertence à equipe do usuário OU
                  (note.team === 'Geral' && (user?.role === 'Support TI' || user?.role === 'Sistemas MV'))) // A nota é 'Geral' e o usuário é TI/MV
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
