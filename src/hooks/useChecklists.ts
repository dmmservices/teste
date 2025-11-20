
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type ItemChecklist = Tables<'itens_checklist'>;
type ItemChecklistInsert = TablesInsert<'itens_checklist'>;
type ItemChecklistUpdate = TablesUpdate<'itens_checklist'>;

export const useChecklists = () => {
  const queryClient = useQueryClient();

  const { data: checklists = [], isLoading } = useQuery({
    queryKey: ['checklists'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('itens_checklist')
          .select(`
            *,
            criado_por_perfil:perfis!itens_checklist_criado_por_fkey(nome_completo, url_avatar),
            concluido_por_perfil:perfis!itens_checklist_concluido_por_fkey(nome_completo, url_avatar),
            empresa:empresas!inner(status)
          `)
          .eq('empresa.status', 'ativo')
          .order('criado_em', { ascending: false });

        if (error) {
          console.error('Erro ao buscar checklists:', error);
          throw error;
        }

        return data as (ItemChecklist & {
          criado_por_perfil: { nome_completo: string; url_avatar: string | null } | null;
          concluido_por_perfil: { nome_completo: string; url_avatar: string | null } | null;
        })[];
      } catch (error) {
        console.error('Erro na query de checklists:', error);
        return [];
      }
    },
  });

  const criarItemMutation = useMutation({
    mutationFn: async (novoItem: ItemChecklistInsert) => {
      const { data, error } = await supabase
        .from('itens_checklist')
        .insert(novoItem)
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar item checklist:', error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
    },
  });

  const atualizarItemMutation = useMutation({
    mutationFn: async ({ id, ...updates }: ItemChecklistUpdate & { id: string }) => {
      // Log para debug
      console.log('Atualizando item:', id, 'com dados:', updates);
      
      const { data, error } = await supabase
        .from('itens_checklist')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar item checklist:', error);
        throw error;
      }
      console.log('Item atualizado com sucesso:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
    },
  });

  const deletarItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('itens_checklist')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao deletar item checklist:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
    },
  });

  const toggleConcluido = async (id: string, concluido: boolean) => {
    try {
      const updates: ItemChecklistUpdate = {
        concluido,
        concluido_em: concluido ? new Date().toISOString() : null,
        concluido_por: concluido ? (await supabase.auth.getUser()).data.user?.id || null : null,
      };

      return atualizarItemMutation.mutateAsync({ id, ...updates });
    } catch (error) {
      console.error('Erro ao alterar status do item:', error);
      throw error;
    }
  };

  return {
    checklists,
    isLoading,
    criarItem: criarItemMutation.mutateAsync,
    atualizarItem: atualizarItemMutation.mutateAsync,
    deletarItem: deletarItemMutation.mutateAsync,
    toggleConcluido,
    isCreating: criarItemMutation.isPending,
    isUpdating: atualizarItemMutation.isPending,
    isDeleting: deletarItemMutation.isPending,
  };
};
