
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type Empresa = Tables<'empresas'>;

export const useEmpresas = () => {
  const { data: empresas = [], isLoading } = useQuery({
    queryKey: ['empresas'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('empresas')
          .select('*')
          .eq('status', 'ativo')
          .order('nome');

        if (error) {
          console.error('Erro ao buscar empresas:', error);
          throw error;
        }

        return data as Empresa[];
      } catch (error) {
        console.error('Erro na query de empresas:', error);
        return [];
      }
    },
  });

  return {
    empresas,
    isLoading,
  };
};
