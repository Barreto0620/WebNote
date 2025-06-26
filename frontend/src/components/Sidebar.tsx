import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { ViewMode } from '@/types'; // Certifique-se de que ViewMode está em '@/types'
import {
  Home,        // Ícone para Visão Geral
  Briefcase,   // Ícone para Support TI
  HardDrive,   // Ícone para Sistemas MV
  Shield,      // Ícone para Admin
  Sun, Moon,   // Ícones para tema
  LogOut,      // Ícone para Sair
  Key,         // NOVO ÍCONE: Para alterar senha
  Menu, X,     // Ícones para menu mobile
  User as UserIcon // Importa User como UserIcon para evitar conflito com 'user' prop do useAuth
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface SidebarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onLogout: () => void; // Adiciona a prop onLogout
  onChangePassword: () => void; // NOVO: Adiciona a prop onChangePassword para o modal
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, onLogout, onChangePassword }) => {
  const { user, logout: authLogout } = useAuth(); // Renomeia 'logout' do hook para 'authLogout'
  const { isDark, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Função para chamar o logout passado via props
  const handleLogout = () => {
    onLogout(); // Chama a função de logout recebida via props
    // Opcional: Fechar menu mobile após sair
    setIsMobileMenuOpen(false);
  };

  const getAvailableViews = (): { view: ViewMode; label: string; icon: React.ReactNode }[] => {
    const views = [];
    
    // Adiciona "Visão Geral" sempre
    views.push({
      view: 'Geral' as ViewMode,
      label: 'Visão Geral',
      icon: <Home className="w-4 h-4" />
    });

    // Adiciona vistas de equipe com base na role do usuário
    if (user?.role === 'Support TI' || user?.role === 'Admin') {
      views.push({
        view: 'Support TI' as ViewMode,
        label: 'Suporte TI',
        icon: <Briefcase className="w-4 h-4" />
      });
    }
    
    if (user?.role === 'Sistemas MV' || user?.role === 'Admin') {
      views.push({
        view: 'Sistemas MV' as ViewMode,
        label: 'Sistemas MV',
        icon: <HardDrive className="w-4 h-4" />
      });
    }

    if (user?.role === 'Admin') {
      views.push({
        view: 'Admin' as ViewMode,
        label: 'Administração',
        icon: <Shield className="w-4 h-4" />
      });
    }
    
    return views;
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleViewChange = (view: ViewMode) => {
    onViewChange(view);
    setIsMobileMenuOpen(false); // Fechar menu mobile após seleção
  };

  if (!user) {
    return null; // Não renderiza a sidebar se não houver usuário logado
  }

  return (
    <>
      {/* Mobile Header (Cabeçalho para telas pequenas) */}
      <div className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">
          Note HEMC
        </h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleMobileMenu}
          className="p-2"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Mobile Menu Overlay (Fundo escuro quando o menu mobile está aberto) */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar (Barra Lateral principal) */}
      <div className={`
        fixed md:relative
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 
        flex flex-col h-full md:h-screen
        transition-transform duration-300 ease-in-out
        z-50 md:z-auto
        top-0 md:top-auto
        left-0
      `}>
        {/* Desktop Header (Cabeçalho para telas grandes) */}
        <div className="hidden md:block p-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            Note HEMC
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Notas Internas
          </p>
        </div>

        {/* Mobile Header in Sidebar (Cabeçalho interno da Sidebar para mobile) */}
        <div className="md:hidden p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              Note HEMC
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Notas Internas
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Informações do Usuário */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <UserIcon className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user?.role}
              </p>
            </div>
          </div>
        </div>

        {/* Navegação Principal */}
        <div className="flex-1 p-4">
          <nav className="space-y-2">
            {getAvailableViews().map(({ view, label, icon }) => (
              <Button
                key={view}
                variant={currentView === view ? "default" : "ghost"}
                className={`w-full justify-start ${
                  currentView === view 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                onClick={() => handleViewChange(view)}
              >
                {icon}
                <span className="ml-2">{label}</span>
              </Button>
            ))}
          </nav>
        </div>

        {/* Rodapé da Sidebar (Botões de Ação) */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          {/* Botão de Alterar Senha */}
          <Button
            variant="ghost"
            className="w-full justify-start text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={onChangePassword}
          >
            <Key className="w-4 h-4 mr-2" />
            Alterar Senha
          </Button>

          {/* Botão de Modo Escuro/Claro */}
          <Button
            variant="ghost"
            className="w-full justify-start text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={toggleTheme}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span className="ml-2">
              {isDark ? 'Modo Claro' : 'Modo Escuro'}
            </span>
          </Button>
          
          {/* Botão de Sair */}
          <Button
            variant="ghost"
            className="w-full justify-start text-left text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            <span className="ml-2">Sair</span>
          </Button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;