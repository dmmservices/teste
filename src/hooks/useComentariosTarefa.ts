
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ComentarioTarefa {
  id: string;
  tarefa_id: string;
  autor_id: string;
  comentario: string;
  criado_em: string;
  anexos: any[];
  autor_perfil?: {
    nome_completo: string;
    url_avatar: string | null;
  };
}

interface ComentarioTarefaInsert {
  tarefa_id: string;
  autor_id: string;
  comentario: string;
  anexos?: any[];
}

export const useComentariosTarefa = (tarefaId?: string) => {
  const queryClient = useQueryClient();

  const { data: comentarios = [], isLoading } = useQuery({
    queryKey: ['comentarios-tarefa', tarefaId],
    queryFn: async () => {
      if (!tarefaId) return [];
      
      const { data, error } = await supabase
        .from('comentarios_tarefa')
        .select(`
          *,
          autor_perfil:perfis!comentarios_tarefa_autor_id_fkey(nome_completo, url_avatar)
        `)
        .eq('tarefa_id', tarefaId)
        .order('criado_em', { ascending: false });

      if (error) {
        console.error('Erro ao buscar comentários:', error);
        throw error;
      }

      return data as ComentarioTarefa[];
    },
    enabled: !!tarefaId
  });

  const { mutateAsync: criarComentario, isPending: isCreating } = useMutation({
    mutationFn: async (comentario: ComentarioTarefaInsert) => {
      const { data, error } = await supabase
        .from('comentarios_tarefa')
        .insert(comentario)
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar comentário:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comentarios-tarefa', tarefaId] });
    }
  });

  const { mutateAsync: deletarComentario, isPending: isDeleting } = useMutation({
    mutationFn: async (comentarioId: string) => {
      const { error } = await supabase
        .from('comentarios_tarefa')
        .delete()
        .eq('id', comentarioId);

      if (error) {
        console.error('Erro ao deletar comentário:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comentarios-tarefa', tarefaId] });
    }
  });

  return {
    comentarios,
    isLoading,
    criarComentario,
    deletarComentario,
    isCreating,
    isDeleting
  };
};
