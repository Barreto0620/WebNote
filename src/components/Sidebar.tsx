
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { ViewMode } from '@/types';
import { User, Settings, Users, FileText, Sun, Moon, LogOut } from 'lucide-react';

interface SidebarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

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
      label: 'Geral',
      icon: <Users className="w-4 h-4" />
    });
    
    return views;
  };

  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">
          Mario Covas
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Notas Internas
        </p>
      </div>

      {/* User Info */}
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

      {/* Navigation */}
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
              onClick={() => onViewChange(view)}
            >
              {icon}
              <span className="ml-2">{label}</span>
            </Button>
          ))}
        </nav>
      </div>

      {/* Footer */}
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
  );
};

export default Sidebar;
