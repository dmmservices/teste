
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'dmm' | 'client';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user, loading, perfil } = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    if (!requiredRole) return;

    // Aguardar um tempo para o perfil carregar
    const timer = setTimeout(() => {
      if (!perfil) {
        // Se não há perfil após timeout, assumir cliente
        if (requiredRole === 'dmm') {
          navigate('/dashboard-client', { replace: true });
        }
        return;
      }

      const isDMM = perfil.funcao === 'dmm_admin' || perfil.funcao === 'dmm_membro';
      const isClient = perfil.funcao === 'cliente_admin' || perfil.funcao === 'cliente_membro';

      if (requiredRole === 'dmm' && !isDMM) {
        navigate('/dashboard-client', { replace: true });
      } else if (requiredRole === 'client' && !isClient) {
        navigate('/dashboard-team', { replace: true });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [user, loading, perfil, navigate, requiredRole]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
