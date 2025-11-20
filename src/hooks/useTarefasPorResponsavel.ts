import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useTarefasPorResponsavel = () => {
  const { data: tarefasPorResponsavel = {}, isLoading } = useQuery({
    queryKey: ['tarefas-por-responsavel'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tarefa_responsaveis')
        .select(`
          responsavel_id,
          tarefa:tarefas!inner(
            id,
            status,
            empresa:empresas!inner(status)
          )
        `)
        .eq('tarefa.empresa.status', 'ativo')
        .neq('tarefa.status', 'concluido')
        .neq('tarefa.status', 'rejeitado');

      if (error) {
        console.error('Erro ao buscar tarefas por responsável:', error);
        throw error;
      }

      // Contar tarefas por responsável
      const contagem: Record<string, number> = {};
      data?.forEach((item: any) => {
        const responsavelId = item.responsavel_id;
        if (!contagem[responsavelId]) {
          contagem[responsavelId] = 0;
        }
        contagem[responsavelId]++;
      });

      return contagem;
    },
  });

  return {
    tarefasPorResponsavel,
    isLoading,
  };
};
