
import React, { useState, useEffect } from 'react';
import { Note, ViewMode } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { getNotes, saveNote, deleteNote, initializeSampleData } from '@/lib/storage';
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

  useEffect(() => {
    initializeSampleData();
    loadNotes();
  }, []);

  useEffect(() => {
    filterNotes();
  }, [notes, currentView, searchTerm, filterTag]);

  const loadNotes = () => {
    const allNotes = getNotes();
    setNotes(allNotes);
  };

  const filterNotes = () => {
    let filtered = notes;

    // Filter by view
    if (currentView !== 'Geral') {
      filtered = filtered.filter(note => note.team === currentView);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(note => 
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.authorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by tag
    if (filterTag && filterTag !== 'all') {
      filtered = filtered.filter(note => note.tags.includes(filterTag));
    }

    // Sort by updated date (newest first)
    filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    setFilteredNotes(filtered);
  };

  const handleCreateNote = () => {
    setEditingNote(undefined);
    setIsEditing(true);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setIsEditing(true);
  };

  const handleSaveNote = (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date();
    const note: Note = {
      ...noteData,
      id: editingNote?.id || `note_${Date.now()}`,
      createdAt: editingNote?.createdAt || now,
      updatedAt: now
    };

    saveNote(note);
    loadNotes();
    setIsEditing(false);
    setEditingNote(undefined);
    
    toast({
      title: editingNote ? "Nota atualizada!" : "Nota criada!",
      description: editingNote ? "Suas alterações foram salvas com sucesso." : "Nova nota criada com sucesso.",
    });
  };

  const handleDeleteNote = (noteId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta nota?')) {
      deleteNote(noteId);
      loadNotes();
      toast({
        title: "Nota excluída!",
        description: "A nota foi removida com sucesso.",
      });
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingNote(undefined);
  };

  const canCreateNote = () => {
    if (currentView === 'Geral') return false;
    if (user?.role === 'Admin') return true;
    if (user?.role === 'Viewer') return false;
    return user?.role === currentView;
  };

  const getAllTags = () => {
    const allTags = notes.flatMap(note => note.tags);
    return Array.from(new Set(allTags)).sort();
  };

  const getViewTitle = () => {
    switch (currentView) {
      case 'Support TI':
        return 'Notas da Equipe Support TI';
      case 'Sistemas MV':
        return 'Notas da Equipe Sistemas MV';
      case 'Geral':
        return 'Todas as Notas - Visualização Geral';
      default:
        return 'Notas';
    }
  };

  const getViewDescription = () => {
    switch (currentView) {
      case 'Support TI':
        return 'Documentações e procedimentos da equipe de suporte técnico';
      case 'Sistemas MV':
        return 'Documentações e configurações dos sistemas MV';
      case 'Geral':
        return 'Visualização consolidada de todas as notas da organização';
      default:
        return '';
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
      <div className="p-6">
        <NoteEditor
          note={editingNote}
          onSave={handleSaveNote}
          onCancel={handleCancelEdit}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {getViewTitle()}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {getViewDescription()}
            </p>
          </div>
          {canCreateNote() && (
            <Button
              onClick={handleCreateNote}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Nota
            </Button>
          )}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
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
            <SelectTrigger className="w-full sm:w-48">
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

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onEdit={handleEditNote}
              onDelete={handleDeleteNote}
              onViewHistory={(noteId) => setShowVersionHistory(noteId)}
              showComments={currentView === 'Geral'}
            />
          ))}
        </div>
      )}

      {/* Stats */}
      {filteredNotes.length > 0 && (
        <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
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
