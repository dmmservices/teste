
import React, { useState, FormEvent } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AuthTabs } from '@/components/ui/modern-animated-sign-in';

interface LoginFormProps {
  onSuccess: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (isLoading) return;
    
    setIsLoading(true);
    console.log('LoginForm: Tentando fazer login...');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (error) {
        console.error('LoginForm: Erro de login:', error);
        toast.error('Email ou senha inválidos');
        return;
      }

      if (data.user) {
        // Verificar perfil do usuário
        const { data: perfil } = await supabase
          .from('perfis')
          .select('empresa_id, empresas(status)')
          .eq('email', formData.email)
          .single();

        if (perfil?.empresas?.status === 'encerrado') {
          await supabase.auth.signOut();
          toast.error('Sua conta está bloqueada. Entre em contato com a equipe da DMM Services.');
          return;
        }

        console.log('LoginForm: Login bem-sucedido');
        toast.success('Login realizado com sucesso!');
        onSuccess();
      }
      
    } catch (error: any) {
      console.error('LoginForm: Erro geral:', error);
      toast.error('Erro interno. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const formFields = {
    header: 'Seja Bem-Vindo!!!',
    subHeader: 'Acesse sua plataforma DMM SERVICES',
    fields: [
      {
        label: 'Email',
        required: true,
        type: 'email' as const,
        placeholder: 'seu@email.com',
        value: formData.email,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
          setFormData(prev => ({ ...prev, email: e.target.value }));
        }
      },
      {
        label: 'Password',
        required: true,
        type: 'password' as const,
        placeholder: '••••••••',
        value: formData.password,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
          setFormData(prev => ({ ...prev, password: e.target.value }));
        }
      }
    ],
    submitButton: isLoading ? 'Entrando...' : 'Entrar',
    textVariantButton: 'Esqueceu a senha?'
  };

  const handleForgotPassword = () => {
    toast.info('Funcionalidade de recuperação de senha será implementada em breve');
  };

  return (
    <AuthTabs 
      formFields={formFields} 
      goTo={handleForgotPassword} 
      handleSubmit={handleSubmit} 
    />
  );
};

export default LoginForm;
