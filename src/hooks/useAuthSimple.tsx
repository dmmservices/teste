
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

export const useAuthSimple = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Função para atualizar o estado de auth
    const updateAuthState = (newSession: Session | null) => {
      if (!isMounted) return;
      
      console.log('useAuthSimple: Atualizando estado da auth:', !!newSession);
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);
    };

    // Verificar sessão inicial
    const checkInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('useAuthSimple: Erro ao obter sessão:', error);
        }
        updateAuthState(session);
      } catch (error) {
        console.error('useAuthSimple: Erro na verificação inicial:', error);
        updateAuthState(null);
      }
    };

    // Configurar listener de mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('useAuthSimple: Evento de auth:', event);
        
        // Usar setTimeout para evitar loops
        setTimeout(() => {
          updateAuthState(session);
        }, 0);
      }
    );

    checkInitialSession();

    return () => {
      isMounted = false;
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
    user,
    session,
    loading,
    signOut,
  };
};
