
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ResponsavelTarefa {
  id: string;
  tarefa_id: string;
  responsavel_id: string;
  criado_em: string;
  responsavel_perfil?: {
    nome_completo: string;
    url_avatar: string | null;
  };
}

interface ResponsavelTarefaInsert {
  tarefa_id: string;
  responsavel_id: string;
}

export const useResponsaveisTarefa = (tarefaId?: string) => {
  const queryClient = useQueryClient();

  const { data: responsaveis = [], isLoading } = useQuery({
    queryKey: ['responsaveis-tarefa', tarefaId],
    queryFn: async () => {
      if (!tarefaId) return [];
      
      const { data, error } = await supabase
        .from('tarefa_responsaveis')
        .select(`
          *,
          responsavel_perfil:perfis!tarefa_responsaveis_responsavel_id_fkey(nome_completo, url_avatar)
        `)
        .eq('tarefa_id', tarefaId);

      if (error) {
        console.error('Erro ao buscar responsáveis:', error);
        throw error;
      }

      return data as ResponsavelTarefa[];
    },
    enabled: !!tarefaId
  });

  const { mutateAsync: adicionarResponsavel, isPending: isAdding } = useMutation({
    mutationFn: async (responsavel: ResponsavelTarefaInsert) => {
      const { data, error } = await supabase
        .from('tarefa_responsaveis')
        .insert(responsavel)
        .select()
        .single();

      if (error) {
        console.error('Erro ao adicionar responsável:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['responsaveis-tarefa', tarefaId] });
    }
  });

  const { mutateAsync: removerResponsavel, isPending: isRemoving } = useMutation({
    mutationFn: async (responsavelId: string) => {
      const { error } = await supabase
        .from('tarefa_responsaveis')
        .delete()
        .eq('id', responsavelId);

      if (error) {
        console.error('Erro ao remover responsável:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['responsaveis-tarefa', tarefaId] });
    }
  });

  const { mutateAsync: atualizarResponsaveis } = useMutation({
    mutationFn: async ({ tarefaId, responsaveisIds }: { tarefaId: string; responsaveisIds: string[] }) => {
      // Remove todos os responsáveis atuais
      await supabase
        .from('tarefa_responsaveis')
        .delete()
        .eq('tarefa_id', tarefaId);

      // Adiciona os novos responsáveis
      if (responsaveisIds.length > 0) {
        const responsaveis = responsaveisIds.map(responsavelId => ({
          tarefa_id: tarefaId,
          responsavel_id: responsavelId
        }));

        const { error } = await supabase
          .from('tarefa_responsaveis')
          .insert(responsaveis);

        if (error) {
          console.error('Erro ao atualizar responsáveis:', error);
          throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['responsaveis-tarefa', tarefaId] });
    }
  });

  return {
    responsaveis,
    isLoading,
    adicionarResponsavel,
    removerResponsavel,
    atualizarResponsaveis,
    isAdding,
    isRemoving
  };
};
