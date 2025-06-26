import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Comment, Note } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, Send } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { addCommentApi, authenticatedFetch } from '@/services/notesApi';
import { useAuth } from '@/contexts/AuthContext';

interface NoteCommentsProps {
  noteId: string;
  onClose: () => void;
  onCommentAdded?: () => void; // NOVO: Callback opcional para quando um comentário é adicionado
}

const NoteComments: React.FC<NoteCommentsProps> = ({ noteId, onClose, onCommentAdded }) => {
  const { user } = useAuth();
  const [note, setNote] = useState<Note | null>(null);
  const [newCommentContent, setNewCommentContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNoteAndComments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedNote: Note = await authenticatedFetch(`/api/notes/${noteId}`);
      setNote(fetchedNote);
    } catch (err: any) {
      console.error('Erro ao carregar nota e comentários:', err);
      setError(err.message || 'Não foi possível carregar a nota e seus comentários.');
      toast({
        title: "Erro ao carregar comentários",
        description: err.message || "Não foi possível carregar a nota e seus comentários.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [noteId]);

  useEffect(() => {
    fetchNoteAndComments();
  }, [fetchNoteAndComments]);

  const handleAddComment = async () => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para comentar.",
        variant: "destructive",
      });
      return;
    }
    if (!newCommentContent.trim()) {
      toast({
        title: "Erro",
        description: "O comentário não pode estar vazio.",
        variant: "warning",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addCommentApi(noteId, newCommentContent);
      setNewCommentContent('');
      fetchNoteAndComments(); // Recarrega os comentários dentro deste componente
      
      // CHAMA O CALLBACK PARA INFORMAR O COMPONENTE PAI (MainContent)
      if (onCommentAdded) {
        onCommentAdded();
      }

      toast({ title: "Comentário adicionado!", description: "Seu comentário foi salvo com sucesso." });
    } catch (err: any) {
      console.error('Erro ao adicionar comentário:', err);
      toast({
        title: "Erro ao adicionar comentário",
        description: err.message || "Não foi possível adicionar o comentário.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canAddComment = () => {
    if (!user || !note) return false;

    // Admin pode comentar em qualquer nota
    if (user.role === 'Admin') return true;

    // Se o usuário é o autor da nota, ele pode comentar nela
    if (note.author === user.id) return true; // <-- ADICIONADO: Autor pode comentar

    // Usuários de equipe (Support TI, Sistemas MV) podem comentar em notas da sua equipe OU notas "Geral"
    if ((user.role === 'Support TI' || user.role === 'Sistemas MV') && (note.team === user.role || note.team === 'Geral')) return true;

    // Viewers podem comentar apenas em notas "Geral"
    if (user.role === 'Viewer' && note.team === 'Geral') return true;

    return false;
  };

  return (
    <Card className="w-full max-w-3xl mx-auto my-8 h-[calc(100vh-4rem)] flex flex-col">
      <CardHeader className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">Comentários da Nota</CardTitle>
          <Button variant="ghost" onClick={onClose} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
            <ArrowLeft className="w-5 h-5 mr-2" /> Voltar
          </Button>
        </div>
        {note && (
          <CardDescription className="text-gray-700 dark:text-gray-300 mt-2">
            Nota: <span className="font-semibold">{note.title}</span> - Equipe: <span className="font-medium text-blue-600 dark:text-blue-400">{note.team}</span>
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-6 space-y-6">
        {isLoading ? (
          <div className="text-center text-gray-500 dark:text-gray-400">Carregando comentários...</div>
        ) : error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : note?.comments.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400">Nenhum comentário ainda.</div>
        ) : (
          note?.comments
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
            .map((comment) => (
              <div key={comment._id} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span className="font-semibold">{comment.authorName}</span> em {format(new Date(comment.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </p>
                <p className="text-base text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                  {comment.content}
                </p>
              </div>
            ))
        )}
      </CardContent>
      {canAddComment() && (
        <CardFooter className="border-t pt-4 border-gray-200 dark:border-gray-700">
          <div className="flex w-full space-x-2">
            <Textarea
              placeholder="Adicionar um comentário..."
              value={newCommentContent}
              onChange={(e) => setNewCommentContent(e.target.value)}
              rows={3}
              className="flex-1 resize-none"
              disabled={isSubmitting}
            />
            <Button onClick={handleAddComment} disabled={isSubmitting}>
              {isSubmitting ? 'Enviando...' : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default NoteComments;
