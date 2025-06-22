import React, { useState, useEffect } from 'react';
import MainContent from '@/components/MainContent';
import Sidebar from '@/components/Sidebar'; // Importa o Sidebar
import { useAuth } from '@/contexts/AuthContext'; // Para obter a role do usuário
// Certifique-se de importar ViewMode se estiver em um arquivo separado como '@/types'
// Caso contrário, defina-a aqui como um tipo.
type ViewMode = 'Geral' | 'Support TI' | 'Sistemas MV' | 'Admin' | 'Viewer'; 

const NotesPage: React.FC = () => {
  const { user } = useAuth();
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
    <div className="flex min-h-screen">
      {/* Sidebar: Passa a view atual e a função para mudar a view */}
      <Sidebar currentView={currentView} onViewChange={handleViewChange} />
      
      {/* MainContent: Exibe as notas com base na view atual */}
      <MainContent currentView={currentView} />
    </div>
  );
};

export default NotesPage;
