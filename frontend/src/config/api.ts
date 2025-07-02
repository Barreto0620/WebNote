// Configuração da API com detecção automática do ambiente

// Detecta o ambiente atual
const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

// Pega a URL da API das variáveis de ambiente ou usa fallback
const getApiUrl = () => {
  // Prioridade: variável de ambiente -> fallback baseado no ambiente
  const envApiUrl = import.meta.env.VITE_API_BASE_URL;
  
  if (envApiUrl) {
    console.log('🔗 Usando URL da API do .env:', envApiUrl);
    return envApiUrl;
  }
  
  // Fallback para desenvolvimento/produção
  const fallbackUrl = isDevelopment 
    ? 'http://localhost:5000' 
    : 'https://notas-internas-backend.onrender.com';
    
  console.log('🔗 Usando URL da API fallback:', fallbackUrl);
  return fallbackUrl;
};

// URL base da API
export const API_BASE_URL = getApiUrl();

// Função para construir URLs completas da API
export const buildApiUrl = (endpoint: string): string => {
  // Remove barra inicial se existir para evitar duplicação
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  // Remove 'api/' do início se existir, pois será adicionado abaixo
  const finalEndpoint = cleanEndpoint.startsWith('api/') 
    ? cleanEndpoint.slice(4) 
    : cleanEndpoint;
  
  // Em desenvolvimento, usa proxy do Vite (apenas /api)
  if (isDevelopment && API_BASE_URL.includes('localhost')) {
    return `/api/${finalEndpoint}`;
  }
  
  // Em produção ou quando usando URL externa, usa URL completa
  return `${API_BASE_URL}/api/${finalEndpoint}`;
};

// Configurações para requisições HTTP
export const httpConfig = {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // Timeout de 30 segundos
  timeout: 30000,
};

// Função helper para fazer requisições com configuração padrão
export const apiRequest = async (
  endpoint: string, 
  options: RequestInit = {}
): Promise<Response> => {
  const url = buildApiUrl(endpoint);
  
  const config: RequestInit = {
    ...httpConfig,
    ...options,
    headers: {
      ...httpConfig.headers,
      ...options.headers,
    },
  };

  // Adiciona token de autenticação se existir
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers = {
      ...config.headers,
      'Authorization': `Bearer ${token}`,
    };
  }

  console.log(`🌐 Fazendo requisição para: ${url}`);
  console.log(`📋 Método: ${config.method || 'GET'}`);
  
  try {
    const response = await fetch(url, config);
    
    console.log(`✅ Resposta recebida: ${response.status} ${response.statusText}`);
    
    return response;
  } catch (error) {
    console.error(`❌ Erro na requisição para ${url}:`, error);
    throw error;
  }
};

// Funções específicas para cada tipo de requisição
export const api = {
  get: (endpoint: string, options?: RequestInit) =>
    apiRequest(endpoint, { ...options, method: 'GET' }),
    
  post: (endpoint: string, data?: any, options?: RequestInit) =>
    apiRequest(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),
    
  put: (endpoint: string, data?: any, options?: RequestInit) =>
    apiRequest(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),
    
  delete: (endpoint: string, options?: RequestInit) =>
    apiRequest(endpoint, { ...options, method: 'DELETE' }),
    
  patch: (endpoint: string, data?: any, options?: RequestInit) =>
    apiRequest(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),
};

// Função para testar conectividade com a API
export const testApiConnection = async (): Promise<boolean> => {
  try {
    const response = await api.get('health');
    const data = await response.json();
    
    console.log('✅ Teste de conectividade da API bem-sucedido:', data);
    return response.ok;
  } catch (error) {
    console.error('❌ Falha no teste de conectividade da API:', error);
    return false;
  }
};

// Informações de debug
console.log('🔧 Configuração da API:', {
  environment: isDevelopment ? 'development' : 'production',
  apiBaseUrl: API_BASE_URL,
  envVariable: import.meta.env.VITE_API_BASE_URL,
  isDevelopment,
  isProduction,
  sampleEndpoint: buildApiUrl('health')
});