import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ripple, TechOrbitDisplay } from '@/components/ui/modern-animated-sign-in';
import { useAuthContext } from '@/contexts/AuthContext';
import LoginForm from '@/components/LoginForm';

const iconsArray = [
  {
    component: () => <img src="/lovable-uploads/2b710fe5-184f-41c2-af91-c2aae8cd9f66.png" alt="Adobe Creative Cloud" className="w-10 h-10" />,
    className: 'size-[40px] border-none bg-transparent',
    duration: 20,
    delay: 20,
    radius: 100,
    path: false,
    reverse: false
  },
  {
    component: () => <img src="/lovable-uploads/d46ee4ba-a649-4044-b6df-695ad1ba8cec.png" alt="Network" className="w-10 h-10" />,
    className: 'size-[40px] border-none bg-transparent',
    duration: 20,
    delay: 10,
    radius: 100,
    path: false,
    reverse: false
  }, {
    component: () => <img src="/lovable-uploads/b9d7070c-b454-4433-bf80-326b914910b2.png" alt="Klarna" className="w-10 h-10" />,
    className: 'size-[40px] border-none bg-transparent',
    radius: 210,
    duration: 20,
    path: false,
    reverse: false
  }, {
    component: () => <img src="/lovable-uploads/b594ae64-5ce7-481f-875c-1acdc07485d4.png" alt="Meta" className="w-10 h-10" />,
    className: 'size-[40px] border-none bg-transparent',
    radius: 210,
    duration: 20,
    delay: 20,
    path: false,
    reverse: false
  }, {
    component: () => <img src="/lovable-uploads/3fdc98cd-5d80-41c0-b7f6-57ee14160430.png" alt="Google Ads" className="w-10 h-10" />,
    className: 'size-[40px] border-none bg-transparent',
    duration: 20,
    delay: 20,
    radius: 150,
    path: false,
    reverse: true
  }, {
    component: () => <img src="/lovable-uploads/ea20a149-a430-41ae-a7a7-621239a434c7.png" alt="Google" className="w-10 h-10" />,
    className: 'size-[40px] border-none bg-transparent',
    duration: 20,
    delay: 10,
    radius: 150,
    path: false,
    reverse: true
  }, {
    component: () => <img src="/lovable-uploads/44576eb4-59d2-4185-a9e2-cf5f9f9a0c33.png" alt="WhatsApp" className="w-10 h-10" />,
    className: 'size-[40px] border-none bg-transparent',
    radius: 270,
    duration: 20,
    path: false,
    reverse: true
  }, {
    component: () => <img src="/lovable-uploads/044a0cb8-31b6-4757-bd43-88f92afa476f.png" alt="Instagram" className="w-10 h-10" />,
    className: 'size-[40px] border-none bg-transparent',
    radius: 270,
    duration: 20,
    delay: 60,
    path: false,
    reverse: true
  }, {
    component: () => <img src="/lovable-uploads/31a99fbe-acdd-4d4f-ba35-6981a1bd004b.png" alt="Automation" className="w-10 h-10" />,
    className: 'size-[40px] border-none bg-transparent',
    radius: 320,
    duration: 20,
    delay: 20,
    path: false,
    reverse: false
  }
];

const Login = () => {
  const navigate = useNavigate();
  const { user, loading, perfil } = useAuthContext();
  useEffect(() => {
    // Se ainda estiver carregando, aguardar
    if (loading) return;
    
    // Se há usuário autenticado, redirecionar
    if (user && perfil) {
      console.log('Login: Redirecionando usuário autenticado...', perfil.funcao);
      const isDMM = perfil.funcao === 'dmm_admin' || perfil.funcao === 'dmm_membro';
      if (isDMM) {
        navigate('/dashboard-team', { replace: true });
      } else {
        navigate('/dashboard-client', { replace: true });
      }
    } else if (user && !perfil) {
      // Se há usuário mas não há perfil, aguardar um pouco mais
      const timer = setTimeout(() => {
        console.log('Login: Usuário sem perfil após timeout, redirecionando para dashboard client');
        navigate('/dashboard-client', { replace: true });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [user, loading, perfil, navigate]);

  const handleLoginSuccess = () => {
    console.log('Login: Login realizado com sucesso');
    // O redirecionamento será feito pelo useEffect acima
  };


  // Se ainda estiver carregando
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Se já estiver logado, mostrar loading enquanto redireciona
  if (user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <section className='flex max-lg:justify-center min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/5'>
        {/* Left Side */}
        <span className='flex flex-col justify-center w-1/2 max-lg:hidden'>
          <Ripple mainCircleSize={100} />
          <TechOrbitDisplay iconsArray={iconsArray} text="DMM" />
        </span>

        {/* Right Side */}
        <span className='w-1/2 h-[100dvh] flex flex-col justify-center items-center max-lg:w-full max-lg:px-[10%]'>
          <LoginForm onSuccess={handleLoginSuccess} />

          {/* Footer */}
          <div className="text-center mt-8 text-sm text-muted-foreground">
            <p>© 2025 DMM SERVICES. Todos os direitos reservados.</p>
          </div>
        </span>
      </section>
    </>
  );
};

export default Login;
