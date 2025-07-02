import { api } from '@/config/api';

export const loginApi = async (credentials: { email: string; password: string }) => {
  try {
    const response = await api.post('auth/login', credentials);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro ao fazer login');
    }

    return response.json();
  } catch (error) {
    console.error('Erro no loginApi:', error);
    throw error;
  }
};

export const changePasswordApi = async (passwordData: { 
  currentPassword: string; 
  newPassword: string 
}) => {
  try {
    const response = await api.put('auth/change-password', passwordData);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro ao alterar senha');
    }

    return response.json();
  } catch (error) {
    console.error('Erro no changePasswordApi:', error);
    throw error;
  }
};