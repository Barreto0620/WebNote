import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button'; // Importe Button se você usar em algum lugar aqui

interface ConfirmationDialogProps {
  isOpen: boolean; // Controla a visibilidade do modal
  onConfirm: () => void; // Função a ser executada ao confirmar
  onCancel: () => void; // Função a ser executada ao cancelar
  title: string; // Título do modal (ex: "Confirmar Exclusão")
  description: string; // Descrição do modal (ex: "Tem certeza que deseja excluir esta nota?")
  confirmText?: string; // Texto do botão de confirmação (padrão: "Confirmar")
  cancelText?: string; // Texto do botão de cancelamento (padrão: "Cancelar")
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onCancel}> {/* onOpenChange para fechar clicando fora ou com ESC */}
      <AlertDialogContent className="w-11/12 max-w-md mx-auto rounded-lg shadow-lg dark:bg-gray-800">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-bold text-gray-900 dark:text-white">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-gray-700 dark:text-gray-300">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex justify-end gap-2 mt-4">
          <AlertDialogCancel asChild>
            <Button variant="outline" onClick={onCancel} className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
              {cancelText}
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button onClick={onConfirm} className="bg-red-600 hover:bg-red-700 text-white">
              {confirmText}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmationDialog;
