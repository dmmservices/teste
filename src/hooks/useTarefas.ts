
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type Tarefa = Tables<'tarefas'>;
type TarefaInsert = TablesInsert<'tarefas'>;
type TarefaUpdate = TablesUpdate<'tarefas'>;

export const useTarefas = () => {
  const queryClient = useQueryClient();

  const { data: tarefas = [], isLoading } = useQuery({
    queryKey: ['tarefas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tarefas')
        .select(`
          *,
          criado_por_perfil:perfis!tarefas_criado_por_fkey(nome_completo, url_avatar),
          empresa:empresas!inner(status)
        `)
        .eq('tipo', 'tarefa')
        .eq('empresa.status', 'ativo')
        .order('criado_em', { ascending: false });

      if (error) {
        console.error('Erro ao buscar tarefas:', error);
        throw error;
      }

      return data;
    }
  });

  const { mutateAsync: criarTarefa, isPending: isCreating } = useMutation({
    mutationFn: async (tarefa: TarefaInsert) => {
      const { data, error } = await supabase
        .from('tarefas')
        .insert(tarefa)
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar tarefa:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefas'] });
    }
  });

  const { mutateAsync: atualizarTarefa, isPending: isUpdating } = useMutation({
    mutationFn: async (tarefa: TarefaUpdate & { id: string }) => {
      const { id, ...updateData } = tarefa;
      const { data, error } = await supabase
        .from('tarefas')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar tarefa:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefas'] });
    }
  });

  const { mutateAsync: excluirTarefa, isPending: isDeleting } = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tarefas')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao excluir tarefa:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefas'] });
    }
  });

  const { mutateAsync: reordenarSubtarefas, isPending: isReordering } = useMutation({
    mutationFn: async ({ subtarefasIds }: { subtarefasIds: string[] }) => {
      // Atualizar a ordem de cada subtarefa
      const updates = subtarefasIds.map((id, index) => 
        supabase
          .from('tarefas')
          .update({ ordem_subtarefa: index })
          .eq('id', id)
      );

      const results = await Promise.all(updates);
      
      for (const result of results) {
        if (result.error) {
          console.error('Erro ao reordenar subtarefas:', result.error);
          throw result.error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefas'] });
    }
  });

  return {
    tarefas,
    isLoading,
    criarTarefa,
    atualizarTarefa,
    excluirTarefa,
    reordenarSubtarefas,
    isCreating,
    isUpdating,
    isDeleting,
    isReordering
  };
};
