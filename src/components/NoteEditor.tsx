
import React, { useState } from 'react';
import { Note } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface NoteEditorProps {
  note?: Note;
  onSave: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ note, onSave, onCancel }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [team, setTeam] = useState<'Support TI' | 'Sistemas MV'>(note?.team || 'Support TI');
  const [tags, setTags] = useState<string[]>(note?.tags || []);
  const [newTag, setNewTag] = useState('');

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !user) return;

    onSave({
      authorId: user.id,
      authorName: user.name,
      team,
      title: title.trim(),
      content: content.trim(),
      tags
    });
  };

  const getAvailableTeams = () => {
    const teams: Array<'Support TI' | 'Sistemas MV'> = [];
    
    if (user?.role === 'Support TI' || user?.role === 'Admin') {
      teams.push('Support TI');
    }
    
    if (user?.role === 'Sistemas MV' || user?.role === 'Admin') {
      teams.push('Sistemas MV');
    }
    
    return teams;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        {note ? 'Editar Nota' : 'Nova Nota'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="title">Título</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Digite o título da nota..."
            required
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="team">Equipe</Label>
          <Select value={team} onValueChange={(value: 'Support TI' | 'Sistemas MV') => setTeam(value)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Selecione a equipe" />
            </SelectTrigger>
            <SelectContent>
              {getAvailableTeams().map((teamOption) => (
                <SelectItem key={teamOption} value={teamOption}>
                  {teamOption}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="content">Conteúdo (Markdown)</Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Digite o conteúdo da nota em Markdown...&#10;&#10;Exemplo:&#10;# Título&#10;## Subtítulo&#10;**Negrito** e *itálico*&#10;```&#10;código aqui&#10;```"
            required
            className="mt-1 min-h-[200px] font-mono"
          />
        </div>

        <div>
          <Label>Tags</Label>
          <div className="flex flex-wrap gap-2 mt-2 mb-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                #{tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex space-x-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Adicionar tag..."
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              className="flex-1"
            />
            <Button type="button" onClick={handleAddTag} variant="outline">
              Adicionar
            </Button>
          </div>
        </div>

        <div className="flex space-x-3 pt-4">
          <Button 
            type="submit" 
            className="bg-green-600 hover:bg-green-700 text-white"
            disabled={!title.trim() || !content.trim()}
          >
            {note ? 'Salvar Alterações' : 'Criar Nota'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NoteEditor;
