
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { ViewMode } from '@/types';
import { User, Settings, Users, FileText, Sun, Moon, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getAvailableViews = (): { view: ViewMode; label: string; icon: React.ReactNode }[] => {
    const views = [];
    
    if (user?.role === 'Support TI' || user?.role === 'Admin') {
      views.push({
        view: 'Support TI' as ViewMode,
        label: 'Support TI',
        icon: <Settings className="w-4 h-4" />
      });
    }
    
    if (user?.role === 'Sistemas MV' || user?.role === 'Admin') {
      views.push({
        view: 'Sistemas MV' as ViewMode,
        label: 'Sistemas MV',
        icon: <FileText className="w-4 h-4" />
      });
    }
    
    views.push({
      view: 'Geral' as ViewMode,
      label: 'Visão Geral',
      icon: <Users className="w-4 h-4" />
    });
    
    return views;
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleViewChange = (view: ViewMode) => {
    onViewChange(view);
    setIsMobileMenuOpen(false); // Fechar menu mobile após seleção
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">
          Mario Covas
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

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
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
        {/* Desktop Header */}
        <div className="hidden md:block p-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            Mario Covas
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Notas Internas
          </p>
        </div>

        {/* Mobile Header in Sidebar */}
        <div className="md:hidden p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              Mario Covas
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
              <User className="w-4 h-4 text-white" />
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

        {/* Navegação */}
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

        {/* Rodapé */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleTheme}
            className="w-full justify-start"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span className="ml-2">
              {isDark ? 'Modo Claro' : 'Modo Escuro'}
            </span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
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
