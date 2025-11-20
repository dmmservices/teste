import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

export const useMinhasTarefas = () => {
  const { perfil } = useAuthContext();

  const { data: minhasTarefas = [], isLoading } = useQuery({
    queryKey: ['minhas-tarefas', perfil?.id],
    queryFn: async () => {
      if (!perfil?.id) return [];
      
      const { data, error } = await supabase
        .from('tarefas')
        .select(`
          *,
          criado_por_perfil:perfis!tarefas_criado_por_fkey(nome_completo, url_avatar),
          tarefa_responsaveis!inner(responsavel_id),
          empresa:empresas!inner(nome, status)
        `)
        .eq('tarefa_responsaveis.responsavel_id', perfil.id)
        .eq('tipo', 'tarefa')
        .eq('empresa.status', 'ativo')
        .in('status', ['em_andamento', 'pode_fazer', 'deve_fazer'])
        .order('status', { ascending: true })
        .order('data_entrega', { ascending: true, nullsFirst: false })
        .limit(10);

      if (error) {
        console.error('Erro ao buscar minhas tarefas:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!perfil?.id
  });

  return {
    minhasTarefas,
    isLoading
  };
};