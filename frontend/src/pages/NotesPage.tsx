import React, { useState, useEffect } from 'react';
import MainContent from '@/components/MainContent';
import Sidebar from '@/components/Sidebar'; // Importa o Sidebar
import { useAuth } from '@/contexts/AuthContext'; // Para obter a role do usuário e a função de logout
import ChangePasswordForm from '@/components/ChangePasswordForm'; // Importa o formulário de alteração de senha
import { Dialog, DialogContent } from '@/components/ui/dialog'; // Importa Dialog e DialogContent do Shadcn UI

// Certifique-se de importar ViewMode se estiver em um arquivo separado como '@/types'
type ViewMode = 'Geral' | 'Support TI' | 'Sistemas MV' | 'Admin' | 'Viewer'; 

const NotesPage: React.FC = () => {
  const { user, logout } = useAuth(); // Importa logout do useAuth
  // Estado para controlar a visualização atual das notas
  // Inicializa com a visualização baseada na role do usuário, ou 'Geral' se não for uma role específica de equipe.
  const [currentView, setCurrentView] = useState<ViewMode>(() => {
    // Define a view inicial com base na role do usuário
    if (user?.role === 'Admin' || user?.role === 'Viewer') {
      return 'Geral'; // Admins e Viewers começam com a visão geral
    } else if (user?.role === 'Support TI') {
      return 'Support TI';
    } else if (user?.role === 'Sistemas MV') {
      return 'Sistemas MV';
    }
    return 'Geral'; // Padrão se a role não for reconhecida ou não houver usuário
  });

  // NOVO ESTADO: Para controlar a visibilidade do modal de alteração de senha
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  // Atualiza a view se a role do usuário mudar (ex: após refresh e re-login)
  useEffect(() => {
    if (user) {
      if (user.role === 'Admin' || user.role === 'Viewer') {
        setCurrentView('Geral');
      } else if (user.role === 'Support TI') {
        setCurrentView('Support TI');
      } else if (user.role === 'Sistemas MV') {
        setCurrentView('Sistemas MV');
      }
    }
  }, [user]); // Roda quando o objeto 'user' muda

  const handleViewChange = (view: ViewMode) => {
    setCurrentView(view);
  };

  return (
    <div className="flex min-h-screen w-full"> {/* Adicionado w-full para ocupar 100% da largura */}
      {/* Sidebar: Passa a view atual, a função para mudar a view, a função de logout e o handler para alterar senha */}
      <Sidebar
        currentView={currentView}
        onViewChange={handleViewChange}
        onLogout={logout} // Passa a função de logout diretamente do useAuth
        onChangePassword={() => setShowChangePasswordModal(true)} // Abre o modal de alteração de senha
      />
      
      {/* MainContent: Exibe as notas com base na view atual */}
      <MainContent currentView={currentView} />

      {/* Modal de Alteração de Senha */}
      <Dialog open={showChangePasswordModal} onOpenChange={setShowChangePasswordModal}>
        <DialogContent className="sm:max-w-[425px]"> {/* Ajuste a largura máxima conforme necessário */}
          <ChangePasswordForm onClose={() => setShowChangePasswordModal(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NotesPage;
