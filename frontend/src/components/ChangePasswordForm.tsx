// Este arquivo foi entregue como "novo", o que implica que estava vazio ou não existia.
// Para devolver a versão "exata", seria um arquivo vazio.
// No entanto, para que o contexto de desenvolvimento faça sentido, estou devolvendo
// a versão mais recente que foi trabalhada, que é a de "Design Aprimorado para Modal".
// Se você realmente queria um arquivo vazio, por favor, me informe.

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import { changePasswordApi } from '@/services/authApi';

interface ChangePasswordFormProps {
  onClose: () => void; // Callback para fechar o formulário
}

const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({ onClose }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      toast({
        title: "Campos Obrigatórios",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast({
        title: "Senhas Não Correspondem",
        description: "A nova senha e a confirmação da nova senha não coincidem.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Senha Fraca",
        description: "A nova senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await changePasswordApi({ currentPassword, newPassword });
      toast({
        title: "Sucesso!",
        description: "Sua senha foi alterada com sucesso.",
        variant: "default",
      });
      onClose(); // Fecha o formulário após o sucesso
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
      toast({
        title: "Erro ao alterar senha",
        description: error.message || "Não foi possível alterar a senha. Verifique a senha atual.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-md w-full flex flex-col p-6 rounded-lg shadow-xl bg-white dark:bg-gray-800">
      <CardHeader className="pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">Alterar Senha</CardTitle>
          <Button variant="ghost" onClick={onClose} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
            <ArrowLeft className="w-5 h-5 mr-2" /> Voltar
          </Button>
        </div>
        <CardDescription className="text-gray-700 dark:text-gray-300 mt-2">
          Preencha os campos abaixo para alterar sua senha.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-0 pt-6 space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Senha Atual</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">Nova Senha</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-new-password">Confirmar Nova Senha</Label>
            <Input
              id="confirm-new-password"
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>
        </form>
      </CardContent>
      <CardFooter className="border-t pt-4 border-gray-200 dark:border-gray-700 mt-6">
        <Button type="submit" onClick={handleSubmit} disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
          {isSubmitting ? 'Alterando...' : 'Alterar Senha'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ChangePasswordForm;
