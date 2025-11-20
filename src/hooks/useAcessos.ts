import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Temporary types until Supabase types are updated
type Acesso = any;
type NovoAcesso = any;

export const useAcessos = () => {
  const queryClient = useQueryClient();

  const { data: acessos = [], isLoading } = useQuery({
    queryKey: ['acessos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('acessos' as any)
        .select('*')
        .order('criado_em', { ascending: false });

      if (error) {
        console.error('Erro ao buscar acessos:', error);
        throw error;
      }

      return data as Acesso[];
    }
  });

  const createAcesso = useMutation({
    mutationFn: async (novoAcesso: NovoAcesso) => {
      const { data, error } = await supabase
        .from('acessos' as any)
        .insert([novoAcesso])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acessos'] });
      toast.success('Acesso criado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar acesso:', error);
      toast.error('Erro ao criar acesso. Tente novamente.');
    }
  });

  const updateAcesso = useMutation({
    mutationFn: async ({ id, dados }: { id: string; dados: Partial<Acesso> }) => {
      const { data, error } = await supabase
        .from('acessos' as any)
        .update(dados)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acessos'] });
      toast.success('Acesso atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar acesso:', error);
      toast.error('Erro ao atualizar acesso. Tente novamente.');
    }
  });

  const toggleStatusAcesso = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: boolean }) => {
      const { error } = await supabase
        .from('acessos' as any)
        .update({ status } as any)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acessos'] });
      toast.success('Status do acesso atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar status do acesso:', error);
      toast.error('Erro ao atualizar status do acesso. Tente novamente.');
    }
  });

  const registrarUltimoAcesso = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('acessos' as any)
        .update({ ultimo_acesso: new Date().toISOString() } as any)
        .eq('id', id);

      if (error) throw error;
    },
    onError: (error) => {
      console.error('Erro ao registrar último acesso:', error);
    }
  });

  return {
    acessos,
    isLoading,
    createAcesso,
    updateAcesso,
    toggleStatusAcesso,
    registrarUltimoAcesso
  };
};