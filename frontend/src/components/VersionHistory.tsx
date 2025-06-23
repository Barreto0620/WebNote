import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Note, VersionHistoryEntry } from '@/types'; // Importa Note e VersionHistoryEntry
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { authenticatedFetch } from '@/services/notesApi';

interface VersionHistoryProps {
  noteId: string;
  onClose: () => void;
}

const VersionHistory: React.FC<VersionHistoryProps> = ({ noteId, onClose }) => {
  // Estado para armazenar as versões da nota. Agora virá do backend.
  const [noteVersions, setNoteVersions] = useState<VersionHistoryEntry[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVersionHistory = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Chamada à API para obter a nota principal pelo ID
        const note: Note = await authenticatedFetch(`/api/notes/${noteId}`);

        if (note) {
          // Acessa o array versionHistory da nota e o ordena (mais recente primeiro)
          const sortedHistory = note.versionHistory
            .sort((a, b) => new Date(b.editedAt).getTime() - new Date(a.editedAt).getTime())
            .map((version, index) => ({
              ...version,
              isCurrent: index === 0 // Marca a versão mais recente como atual
            }));
          setNoteVersions(sortedHistory);
        } else {
          setError('Nota não encontrada para histórico.');
        }

      } catch (err: any) {
        console.error('Erro ao buscar histórico de versões (catch block):', err);
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
  }, [noteId]);

  return (
    <Card className="w-full max-w-3xl mx-auto my-8 h-[calc(100vh-4rem)] flex flex-col">
      <CardHeader className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">Histórico de Versões</CardTitle>
          <Button variant="ghost" onClick={onClose} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
            <ArrowLeft className="w-5 h-5 mr-2" /> Voltar
          </Button>
        </div>
        <CardDescription className="text-gray-700 dark:text-gray-300">
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
              <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">
                {version.isCurrent ? 'Versão Atual' : `Versão ${noteVersions.length - index}`}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Editado por {version.editorName} em {format(new Date(version.editedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
              </p>
              <pre className="whitespace-pre-wrap text-sm font-mono bg-gray-100 dark:bg-gray-900 p-3 rounded-md border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">
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
