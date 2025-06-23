import React, { useState, useEffect } from 'react';
import { Note } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface NoteEditorProps {
  note?: Note;
  onSave: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'author' | 'authorName' | '_id'>) => void;
  onCancel: () => void;
  defaultTeam: 'Geral' | 'Support TI' | 'Sistemas MV';
  userRole?: 'Admin' | 'Support TI' | 'Sistemas MV' | 'Viewer';
}

const NoteEditor: React.FC<NoteEditorProps> = ({ note, onSave, onCancel, defaultTeam, userRole }) => {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  // Garante que o team inicial seja um dos tipos válidos
  const [team, setTeam] = useState<typeof defaultTeam>(note?.team || defaultTeam);
  const [tagsInput, setTagsInput] = useState(note?.tags.join(', ') || '');

  useEffect(() => {
    setTitle(note?.title || '');
    setContent(note?.content || '');
    setTeam(note?.team || defaultTeam);
    setTagsInput(note?.tags.join(', ') || '');
  }, [note, defaultTeam]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    onSave({ title, content, team, tags });
  };

  const isTeamEditable = userRole === 'Admin';

  // Define as opções de equipe visíveis no Select
  const getTeamOptions = () => {
    if (userRole === 'Admin') {
      return ['Geral', 'Support TI', 'Sistemas MV'];
    } else if (userRole === 'Support TI') {
      return ['Geral', 'Support TI'];
    } else if (userRole === 'Sistemas MV') {
      return ['Geral', 'Sistemas MV'];
    }
    return []; // Viewers ou roles desconhecidas não devem ver o select
  };

  const teamOptions = getTeamOptions();

  return (
    <Card className="w-full max-w-2xl mx-auto my-8">
      <CardHeader>
        <CardTitle>{note ? 'Editar Nota' : 'Criar Nova Nota'}</CardTitle>
        <CardDescription>
          {note ? 'Faça alterações na nota existente.' : 'Preencha os detalhes para criar uma nova nota.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título da nota"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Conteúdo</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escreva o conteúdo da nota aqui..."
              required
              rows={8}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="team">Equipe</Label>
            <Select value={team} onValueChange={setTeam} disabled={!isTeamEditable}>
              <SelectTrigger id="team" className="w-full">
                <SelectValue placeholder="Selecione a equipe" />
              </SelectTrigger>
              <SelectContent>
                {teamOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                        {option}
                    </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!isTeamEditable && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Apenas administradores podem alterar a equipe da nota.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (separadas por vírgulas)</Label>
            <Input
              id="tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Ex: documentacao, urgentes, sistemaX"
            />
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" onClick={handleSubmit} className="bg-green-600 hover:bg-green-700 text-white">
          Salvar Nota
        </Button>
      </CardFooter>
    </Card>
  );
};

export default NoteEditor;
