
import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'Admin' | 'Support TI' | 'Sistemas MV' | 'Viewer';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Generic users for testing
const MOCK_USERS: Record<string, { password: string; user: User }> = {
  'admin@example.com': {
    password: 'Admin@123',
    user: {
      id: '1',
      email: 'admin@example.com',
      name: 'Administrador',
      role: 'Admin'
    }
  },
  'ti_user@example.com': {
    password: 'TiUser@123',
    user: {
      id: '2',
      email: 'ti_user@example.com',
      name: 'Usuário TI',
      role: 'Support TI'
    }
  },
  'mv_user@example.com': {
    password: 'MvUser@123',
    user: {
      id: '3',
      email: 'mv_user@example.com',
      name: 'Usuário MV',
      role: 'Sistemas MV'
    }
  },
  'viewer@example.com': {
    password: 'Viewer@123',
    user: {
      id: '4',
      email: 'viewer@example.com',
      name: 'Visualizador',
      role: 'Viewer'
    }
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('mario_covas_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockUser = MOCK_USERS[email];
    if (mockUser && mockUser.password === password) {
      setUser(mockUser.user);
      localStorage.setItem('mario_covas_user', JSON.stringify(mockUser.user));
      setIsLoading(false);
      return true;
    }
    
    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('mario_covas_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
