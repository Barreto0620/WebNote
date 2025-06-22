import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"; // <-- ADICIONAR Navigate
import { AuthProvider, useAuth } from "@/contexts/AuthContext"; // <-- IMPORTAR useAuth
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import NotesPage from "./pages/NotesPage";
import LoginPage from "./components/LoginForm.tsx"; // <-- NOVA LINHA: Importar a página de Login

const queryClient = new QueryClient();

// Componente para proteger rotas
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-lg text-gray-500">
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
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Rota para a página de login */}
            <Route path="/login" element={<LoginPage />} />

            {/* Rotas protegidas */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <NotesPage /> {/* Agora NotesPage é uma rota protegida */}
                </ProtectedRoute>
              }
            />
            {/* Se você tiver outras rotas protegidas, adicione-as aqui dentro de ProtectedRoute */}
            {/* Exemplo: <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} /> */}

            {/* Rota de fallback para páginas não encontradas */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
