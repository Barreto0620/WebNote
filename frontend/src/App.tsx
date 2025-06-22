import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from '@/contexts/ThemeContext'; // Importe ThemeProvider
import React from 'react'; // Importe React

// Importe os componentes de página necessários
import NotFound from "./pages/NotFound";
import LoginPage from "./components/LoginForm"; // Página de Login
import NotesPage from "./pages/NotesPage"; // A página principal para usuários logados

const queryClient = new QueryClient();

// Componente para proteger rotas
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  // ADICIONAR LOGS PARA DEPURAR O FLUXO DE AUTENTICAÇÃO
  React.useEffect(() => {
    console.log('ProtectedRoute: isLoading', isLoading);
    console.log('ProtectedRoute: user', user);
    if (!isLoading && !user) {
      console.log('ProtectedRoute: Redirecionando para /login');
    } else if (!isLoading && user) {
      console.log('ProtectedRoute: Usuário logado, permitindo acesso');
    }
  }, [isLoading, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-lg text-gray-500 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        Carregando autenticação...
      </div>
    );
  }

  // Se o usuário não estiver logado, redireciona para a página de login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      {/* O ThemeProvider deve envolver os componentes que usam useTheme, como Sidebar */}
      <ThemeProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Rota para a página de login */}
              <Route path="/login" element={<LoginPage />} />

              {/* A rota raiz '/' agora aponta diretamente para NotesPage, que conterá o Sidebar */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <NotesPage />
                  </ProtectedRoute>
                }
              />
              
              {/* Rota de fallback para páginas não encontradas */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
