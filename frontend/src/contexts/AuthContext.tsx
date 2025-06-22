import React, { createContext, useContext, useState, useEffect } from 'react';

// Ajuste a interface User para refletir o que vem do backend
export interface User {
  id: string; // O _id do MongoDB
  email: string;
  name: string;
  role: 'Admin' | 'Support TI' | 'Sistemas MV' | 'Viewer';
  token: string; // Adicionar o token JWT
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define a URL base da sua API a partir das variáveis de ambiente
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar se existe uma sessão no localStorage ao carregar a aplicação
    const storedUser = localStorage.getItem('mario_covas_user');
    const storedToken = localStorage.getItem('mario_covas_token'); // Também armazena o token
    if (storedUser && storedToken) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        // Anexa o token ao objeto do usuário para manter a consistência
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
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        // Armazena o usuário e o token
        const loggedInUser: User = {
          id: data._id,
          email: data.email,
          name: data.name,
          role: data.role,
          token: data.token, // O token vem do backend
        };
        setUser(loggedInUser);
        localStorage.setItem('mario_covas_user', JSON.stringify(loggedInUser));
        localStorage.setItem('mario_covas_token', loggedInUser.token); // Armazena o token separadamente também
        setIsLoading(false);
        return true;
      } else {
        const errorData = await response.json();
        console.error('Erro no login:', errorData.message);
        setIsLoading(false);
        return false;
      }
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
