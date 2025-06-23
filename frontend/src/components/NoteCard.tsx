import React from 'react';
import { Note } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Edit, Trash2, History, MessageCircle } from 'lucide-react';

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (noteId: string) => void; // noteId agora é o _id
  onViewHistory: (noteId: string) => void;
  showComments: boolean;
  canEditOrDelete: boolean;
}

const NoteCard: React.FC<NoteCardProps> = ({
  note,
  onEdit,
  onDelete,
  onViewHistory,
  showComments,
  canEditOrDelete,
}) => {
  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <CardTitle className="text-xl font-semibold truncate">
          {note.title}
        </CardTitle>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Por {note.authorName} em {format(new Date(note.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Equipe: <span className="font-medium text-blue-600 dark:text-blue-400">{note.team}</span>
        </p>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-base text-gray-800 dark:text-gray-200 line-clamp-4">
          {note.content}
        </p>
        {note.tags && note.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {note.tags.map((tag) => (
              <span key={tag} className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full text-xs font-medium">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center mt-4 border-t pt-4 border-gray-100 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Atualizado: {format(new Date(note.updatedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
        </div>
        <div className="flex space-x-2">
          {canEditOrDelete && (
            <>
              <Button variant="ghost" size="icon" onClick={() => onEdit(note)} className="text-blue-500 hover:text-blue-600">
                <Edit className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onDelete(note._id)} className="text-red-500 hover:text-red-600"> {/* <-- Alterado para note._id */}
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" onClick={() => onViewHistory(note._id)} className="text-gray-500 hover:text-gray-600"> {/* <-- Alterado para note._id */}
            <History className="w-4 h-4" />
          </Button>
          {showComments && (
            <Button variant="ghost" size="icon" className="text-purple-500 hover:text-purple-600">
              <MessageCircle className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default NoteCard;
