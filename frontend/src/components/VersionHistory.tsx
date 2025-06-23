import React, { useState, useEffect } from 'react';
// import { getVersionsForNote, getNotes } from '@/lib/storage'; // REMOVER esta linha
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Note } from '@/types'; // Importa a interface Note
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { authenticatedFetch } from '@/services/notesApi'; // Importar authenticatedFetch do notesApi.ts

interface VersionHistoryProps {
  noteId: string;
  onClose: () => void;
}

// Extende a interface Note para incluir o histórico de versões (se você for implementar isso no backend)
// Por enquanto, usaremos uma estrutura mock para o histórico, se o backend ainda não a fornece.
// No futuro, a Note do backend deve ter algo como:
// interface Note {
//   // ...
//   versionHistory?: Array<{
//     content: string;
//     editedAt: string;
//     editorId: string;
//     editorName: string;
//   }>;
// }

const VersionHistory: React.FC<VersionHistoryProps> = ({ noteId, onClose }) => {
  const [noteVersions, setNoteVersions] = useState<any[]>([]); // Altere 'any' para a estrutura do seu histórico
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVersionHistory = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // No momento, seu backend Note.ts e notesController.ts não têm suporte
        // para histórico de versões. Você precisaria adicionar isso lá (ex: um array de objetos no NoteSchema).
        // Por agora, vamos simular um histórico ou apenas buscar a nota principal.

        // Opção 1: Se o backend não tem histórico, pegamos a nota atual
        // e mostramos como "versão única" ou mockamos algo.
        // Se o backend tiver uma rota específica como /api/notes/:id/history
        // você a usaria aqui.
        
        // Exemplo: Buscar a nota principal e simular um histórico simples
        const note: Note = await authenticatedFetch(`/api/notes/${noteId}`);
        if (note) {
          // Se seu backend tivesse note.versionHistory, você faria:
          // setNoteVersions(note.versionHistory.sort((a,b) => new Date(b.editedAt).getTime() - new Date(a.editedAt).getTime()));
          
          // Por enquanto, simula um histórico com a versão atual e talvez uma "anterior" mockada
          const simulatedHistory = [
            {
              content: note.content,
              editedAt: note.updatedAt,
              editorName: note.authorName, // Usando o autor da nota como "editor" para a versão atual
              isCurrent: true
            },
            // Você pode adicionar mais versões mockadas para teste, se quiser
            // Ex: { content: "Conteúdo antigo da nota", editedAt: "2025-06-20T10:00:00Z", editorName: "Usuário Antigo" }
          ];
          setNoteVersions(simulatedHistory);
        } else {
          setError('Nota não encontrada para histórico.');
        }

      } catch (err: any) {
        console.error('Erro ao buscar histórico de versões:', err);
        setError(err.message || 'Erro ao carregar histórico de versões.');
        toast({
          title: "Erro ao carregar histórico",
          description: err.message || "Não foi possível carregar o histórico de versões.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchVersionHistory();
  }, [noteId]); // Roda quando o noteId muda

  return (
    <Card className="w-full max-w-3xl mx-auto my-8 h-[calc(100vh-4rem)] flex flex-col">
      <CardHeader className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold">Histórico de Versões</CardTitle>
          <Button variant="ghost" onClick={onClose} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
            <ArrowLeft className="w-5 h-5 mr-2" /> Voltar
          </Button>
        </div>
        <CardDescription>
          Visualize as versões anteriores desta nota.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-6 space-y-6">
        {isLoading ? (
          <div className="text-center text-gray-500 dark:text-gray-400">Carregando histórico...</div>
        ) : error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : noteVersions.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400">Nenhum histórico de versão disponível.</div>
        ) : (
          noteVersions.map((version, index) => (
            <div key={index} className={`p-4 rounded-lg shadow-sm border ${version.isCurrent ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
              <h3 className="font-semibold text-lg mb-2">
                {version.isCurrent ? 'Versão Atual' : `Versão ${noteVersions.length - index}`}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Editado por {version.editorName} em {format(new Date(version.editedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
              </p>
              <pre className="whitespace-pre-wrap text-sm font-mono bg-gray-100 dark:bg-gray-900 p-3 rounded-md border border-gray-200 dark:border-gray-600">
                {version.content}
              </pre>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default VersionHistory;
