
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const success = await login(email, password);
    if (success) {
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo ao Mario Covas Notas Internas",
      });
    } else {
      toast({
        title: "Erro no login",
        description: "Email ou senha incorretos",
        variant: "destructive",
      });
    }
  };

  const quickLogin = (userEmail: string, userPassword: string) => {
    setEmail(userEmail);
    setPassword(userPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-950 dark:to-gray-900 p-4">
      <Card className="w-full max-w-md bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-0 shadow-2xl">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
            Mario Covas
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Sistema de Notas Internas
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 text-base"
                placeholder="Digite seu email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 text-base"
                placeholder="Digite sua senha"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 bg-green-600 hover:bg-green-700 text-white text-base font-medium"
              disabled={isLoading}
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
          
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 text-center">
              Contas de teste disponíveis:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => quickLogin('admin@example.com', 'Admin@123')}
                className="text-xs h-10"
              >
                Administrador
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => quickLogin('ti_user@example.com', 'TiUser@123')}
                className="text-xs h-10"
              >
                Support TI
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => quickLogin('mv_user@example.com', 'MvUser@123')}
                className="text-xs h-10"
              >
                Sistemas MV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => quickLogin('viewer@example.com', 'Viewer@123')}
                className="text-xs h-10"
              >
                Visualizador
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;
