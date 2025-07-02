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
        target: mode === 'development' 
          ? 'http://localhost:5000'  // Desenvolvimento local
          : 'https://notas-internas-backend.onrender.com', // Produção no Render
        changeOrigin: true, // Necessário para reescrever o cabeçalho 'Origin' para o backend
        secure: true, // Habilita SSL/TLS para produção
        configure: (proxy, options) => {
          // Log das requisições proxy em desenvolvimento
          proxy.on('error', (err, req, res) => {
            console.log('Erro no proxy:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Enviando requisição para:', proxyReq.getHeader('host') + proxyReq.path);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Resposta recebida do servidor:', proxyRes.statusCode);
          });
        }
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
  // Configurações para build de produção
  build: {
    outDir: 'dist',
    sourcemap: mode === 'development',
    minify: mode === 'production' ? 'esbuild' : false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
  // Variáveis de ambiente
  define: {
    __API_URL__: JSON.stringify(
      mode === 'production' 
        ? 'https://notas-internas-backend.onrender.com' 
        : 'http://localhost:5000'
    ),
  },
}));