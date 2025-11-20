
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import type { Tables } from '@/integrations/supabase/types';

type Perfil = Tables<'perfis'>;

interface AuthState {
  user: User | null;
  session: Session | null;
  perfil: Perfil | null;
  loading: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    perfil: null,
    loading: true,
  });

  useEffect(() => {
    let mounted = true;

    const fetchPerfil = async (user: any): Promise<Perfil | null> => {
      try {
        const { data: perfilData } = await supabase
          .from('perfis')
          .select('*')
          .eq('email', user.email)
          .single();
        
        if (!perfilData) return null;

        // Use the database response directly without conversion
        const perfil: Perfil = perfilData;
        
        return perfil;
      } catch (error) {
        console.log('Erro ao buscar perfil:', error);
        return null;
      }
    };

    const handleAuthChange = async (session: Session | null) => {
      if (!mounted) return;

      if (session?.user) {
        const perfil = await fetchPerfil(session.user);
        
        if (mounted) {
          setAuthState({
            user: session.user,
            session: session,
            perfil: perfil,
            loading: false,
          });
        }
      } else {
        if (mounted) {
          setAuthState({
            user: null,
            session: null,
            perfil: null,
            loading: false,
          });
        }
      }
    };

    // Verificar sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthChange(session);
    });

    // Listener para mudanças
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event);
      handleAuthChange(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return {
    ...authState,
    signOut,
  };
};
