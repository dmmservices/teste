
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type Perfil = Tables<'perfis'>;

export const usePerfis = () => {
  const { data: perfis = [], isLoading } = useQuery({
    queryKey: ['perfis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('perfis')
        .select('*')
        .order('nome_completo');

      if (error) {
        console.error('Erro ao buscar perfis:', error);
        throw error;
      }

      return data as Perfil[];
    }
  });

  // Filter DMM team members specifically
  const perfisEquipe = perfis.filter(perfil => 
    perfil.funcao === 'dmm_admin' || perfil.funcao === 'dmm_membro'
  );

  // Helper function to get user name by ID (searches all profiles)
  const getNomeUsuario = (userId: string) => {
    if (!userId) return 'Não atribuído';
    const perfil = perfis.find(p => p.id === userId);
    return perfil?.nome_completo || 'Usuário não encontrado';
  };

  return {
    perfis,
    perfisEquipe,
    getNomeUsuario,
    isLoading
  };
};
