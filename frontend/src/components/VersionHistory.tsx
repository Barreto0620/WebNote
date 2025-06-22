
import React, { useState, useEffect } from 'react';
import { NoteVersion, Note } from '@/types';
import { getVersionsForNote, getNotes } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, User } from 'lucide-react';

interface VersionHistoryProps {
  noteId: string;
  onClose: () => void;
}

const VersionHistory: React.FC<VersionHistoryProps> = ({ noteId, onClose }) => {
  const [versions, setVersions] = useState<NoteVersion[]>([]);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<NoteVersion | null>(null);

  useEffect(() => {
    const noteVersions = getVersionsForNote(noteId);
    const notes = getNotes();
    const note = notes.find(n => n.id === noteId);
    
    setVersions(noteVersions);
    setCurrentNote(note || null);
  }, [noteId]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderMarkdownPreview = (content: string) => {
    return content
      .replace(/^# (.*$)/gm, '<h1 class="text-lg font-bold mb-2">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-base font-semibold mb-2">$1</h2>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-sm">$1</code>')
      .replace(/\n/g, '<br />');
  };

  return (
    <div className="flex-1 p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={onClose}
          className="mb-4 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Histórico de Versões
        </h1>
        {currentNote && (
          <p className="text-gray-600 dark:text-gray-400">
            {currentNote.title}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Versions List */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Versões Anteriores
          </h2>
          
          {versions.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  Nenhuma versão anterior encontrada.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {/* Current Version */}
              {currentNote && (
                <Card className="border-green-200 dark:border-green-800">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">
                        Versão Atual
                      </CardTitle>
                      <Badge variant="default" className="bg-green-600">
                        Atual
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 mb-2">
                      <div className="flex items-center">
                        <User className="w-3 h-3 mr-1" />
                        {currentNote.authorName}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatDate(currentNote.updatedAt)}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {currentNote.title}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedVersion(null)}
                      className="mt-2"
                    >
                      Visualizar
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Previous versions */}
              {versions.map((version, index) => (
                <Card key={version.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">
                        Versão #{versions.length - index}
                      </CardTitle>
                      <Badge variant="secondary">
                        Anterior
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 mb-2">
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatDate(version.createdAt)}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                      {version.title}
                    </p>
                    {version.changeDescription && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        {version.changeDescription}
                      </p>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedVersion(version)}
                      className="mt-1"
                    >
                      Visualizar
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Version Preview */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Visualização
          </h2>
          
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-base">
                {selectedVersion ? selectedVersion.title : currentNote?.title || 'Selecione uma versão'}
              </CardTitle>
              {selectedVersion ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Versão de {formatDate(selectedVersion.createdAt)}
                </p>
              ) : currentNote ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Versão atual - {formatDate(currentNote.updatedAt)}
                </p>
              ) : null}
            </CardHeader>
            <CardContent>
              {selectedVersion || currentNote ? (
                <div 
                  className="prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: renderMarkdownPreview(
                      selectedVersion ? selectedVersion.content : (currentNote?.content || '')
                    ) 
                  }}
                />
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  Selecione uma versão para visualizar o conteúdo
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VersionHistory;
