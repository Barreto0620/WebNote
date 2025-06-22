import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";      // Seu componente Index atual
import NotFound from "./pages/NotFound"; // Seu componente NotFound atual

// Importe o novo componente NotesPage que vamos criar
import NotesPage from "./pages/NotesPage"; // <-- NOVA LINHA

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<NotesPage />} /> {/* <-- ALTERADO: Agora renderiza NotesPage */}
            {/* Se você tiver outras rotas, como um dashboard ou login, você as adicionaria aqui: */}
            {/* <Route path="/dashboard" element={<Dashboard />} /> */}
            {/* <Route path="/login" element={<Login />} /> */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;