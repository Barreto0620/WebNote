import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // Importa hooks do react-query

// Componentes UI do Shadcn
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast'; // Para toasts do Shadcn

interface Note {
  _id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

const API_URL = 'http://localhost:5000/api/notes'; // A URL DO SEU BACKEND!

const NotesPage = () => {
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const { toast } = useToast(); // Hook para mostrar toasts do Shadcn
  const queryClient = useQueryClient(); // Cliente do React Query para invalidar caches

  // Query para buscar todas as notas
  const { data: notes, isLoading, isError, error } = useQuery<Note[], Error>({
    queryKey: ['notes'], // Chave única para esta query
    queryFn: async () => {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error(`Erro ao carregar notas: ${response.statusText}`);
      }
      return response.json();
    },
  });

  // Mutação para criar uma nova nota
  const createNoteMutation = useMutation<Note, Error, { title: string; content: string }>({
    mutationFn: async (newNoteData) => {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newNoteData),
      });
      if (!response.ok) {
        throw new Error(`Erro ao criar nota: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] }); // Invalida a cache 'notes' para recarregar
      setNewNoteTitle('');
      setNewNoteContent('');
      toast({
        title: "Sucesso!",
        description: "Nota criada com sucesso.",
        duration: 3000,
      });
    },
    onError: (err) => {
      toast({
        title: "Erro",
        description: `Falha ao criar nota: ${err.message}`,
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  // Mutação para deletar uma nota
  const deleteNoteMutation = useMutation<void, Error, string>({ // void porque não esperamos retorno
    mutationFn: async (id) => {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`Erro ao deletar nota: ${response.statusText}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] }); // Invalida a cache 'notes'
      toast({
        title: "Sucesso!",
        description: "Nota deletada com sucesso.",
        duration: 3000,
      });
    },
    onError: (err) => {
      toast({
        title: "Erro",
        description: `Falha ao deletar nota: ${err.message}`,
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newNoteTitle.trim() && newNoteContent.trim()) {
      createNoteMutation.mutate({ title: newNoteTitle, content: newNoteContent });
    } else {
      toast({
        title: "Atenção",
        description: "Título e conteúdo da nota não podem ser vazios.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleDelete = (id: string) => {
    deleteNoteMutation.mutate(id);
  };

  if (isLoading) return (
    <div className="container mx-auto p-4 max-w-2xl text-center">
      <p>Carregando notas...</p>
    </div>
  );

  if (isError) return (
    <div className="container mx-auto p-4 max-w-2xl text-center">
      <p className="text-red-500">Erro: {error?.message}</p>
      <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['notes'] })}>Tentar Novamente</Button>
    </div>
  );

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-3xl font-bold text-center mb-6">Minhas Notas Internas</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Criar Nova Nota</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              placeholder="Título da Nota"
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              disabled={createNoteMutation.isPending}
            />
            <Textarea
              placeholder="Conteúdo da Nota"
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              disabled={createNoteMutation.isPending}
            />
            <Button type="submit" disabled={createNoteMutation.isPending}>
              {createNoteMutation.isPending ? 'Criando...' : 'Adicionar Nota'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <h2 className="text-2xl font-bold mb-4">Notas Existentes</h2>
      <div className="grid gap-4">
        {notes?.length === 0 ? (
          <p className="text-center text-gray-600">Nenhuma nota encontrada. Crie uma!</p>
        ) : (
          notes?.map((note) => (
            <Card key={note._id}>
              <CardHeader>
                <CardTitle>{note.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-between items-start">
                <div>
                  <p className="text-gray-700 mb-2">{note.content}</p>
                  <p className="text-sm text-gray-500">Criado em: {new Date(note.createdAt).toLocaleString()}</p>
                  <p className="text-sm text-gray-500">Atualizado em: {new Date(note.updatedAt).toLocaleString()}</p>
                </div>
                <Button variant="destructive" onClick={() => handleDelete(note._id)} disabled={deleteNoteMutation.isPending}>
                  Deletar
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default NotesPage;