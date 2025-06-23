import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080, // A porta do seu servidor de desenvolvimento frontend
    proxy: {
      // Quando o frontend faz uma requisição para URLs que começam com '/api'
      '/api': {
        target: 'http://localhost:5000', // Redireciona para o seu backend
        changeOrigin: true, // Necessário para reescrever o cabeçalho 'Origin' para o backend
        secure: false, // Desabilita SSL/TLS para desenvolvimento local (se seu backend não tiver HTTPS)
        // rewrite: (path) => path.replace(/^\/api/, ''), // Esta linha NÃO é necessária se seu backend já tem /api nas rotas
                                                      // Ex: Se o backend tem `/api/notes`, e você chama `/api/notes`,
                                                      // o proxy envia `/api/notes`. Se você tivesse `/notes` no backend
                                                      // e chamasse `/api/notes` no front, precisaria do rewrite.
                                                      // Pelo seu código, seu backend já tem /api.
      }
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
