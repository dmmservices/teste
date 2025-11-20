
import { supabase } from '@/integrations/supabase/client';

export const getUserProfile = async (email: string) => {
  try {
    const { data: perfil, error } = await supabase
      .from('perfis')
      .select('funcao, empresa_id')
      .eq('email', email)
      .single();

    if (error) {
      console.error('Erro ao buscar perfil:', error);
      return null;
    }

    return perfil;
  } catch (error) {
    console.error('Erro na função getUserProfile:', error);
    return null;
  }
};

export const getRedirectPath = (funcao?: string) => {
  if (funcao === 'dmm_admin' || funcao === 'dmm_membro') {
    return '/dashboard-team';
  }
  return '/dashboard-client';
};
