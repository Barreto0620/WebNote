import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginApi } from '@/services/authApi';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'Admin' | 'Support TI' | 'Sistemas MV' | 'Viewer';
  token: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar se existe uma sessão no localStorage ao carregar a aplicação
    const storedUser = localStorage.getItem('mario_covas_user');
    const storedToken = localStorage.getItem('mario_covas_token');
    
    if (storedUser && storedToken) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        setUser({ ...parsedUser, token: storedToken });
      } catch (e) {
        console.error("Failed to parse stored user data:", e);
        localStorage.removeItem('mario_covas_user');
        localStorage.removeItem('mario_covas_token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const data = await loginApi({ email, password });
      
      const loggedInUser: User = {
        id: data._id,
        email: data.email,
        name: data.name,
        role: data.role,
        token: data.token,
      };
      
      setUser(loggedInUser);
      localStorage.setItem('mario_covas_user', JSON.stringify(loggedInUser));
      localStorage.setItem('mario_covas_token', loggedInUser.token);
      
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Erro na requisição de login:', error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('mario_covas_user');
    localStorage.removeItem('mario_covas_token');
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