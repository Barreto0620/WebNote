
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ViewMode } from '@/types';
import LoginForm from '@/components/LoginForm';
import Sidebar from '@/components/Sidebar';
import MainContent from '@/components/MainContent';

const Index = () => {
  const { user, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<ViewMode>('Geral');

  useEffect(() => {
    // Definir visualização padrão baseada no papel do usuário
    if (user) {
      if (user.role === 'Support TI') {
        setCurrentView('Support TI');
      } else if (user.role === 'Sistemas MV') {
        setCurrentView('Sistemas MV');
      } else {
        setCurrentView('Geral');
      }
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col md:flex-row w-full">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      <MainContent currentView={currentView} />
    </div>
  );
};

// Envolver componente principal com providers
const IndexWithProviders = () => {
  return (
    <ThemeProvider>
      <Index />
    </ThemeProvider>
  );
};

export default IndexWithProviders;
