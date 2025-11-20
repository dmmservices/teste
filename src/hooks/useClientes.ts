import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type Cliente = Tables<'empresas'>;

interface ClienteFormData {
  nome: string;
  descricao?: string;
  decisores?: string;
  status: string;
  site?: string;
  valor_projeto?: number;
  servicos: string[];
  tipo_contrato?: string;
  data_inicio?: string;
  data_encerramento?: string;
}

export const useClientes = () => {
  const queryClient = useQueryClient();

  const { data: clientes = [], isLoading } = useQuery({
    queryKey: ['clientes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .order('nome');

      if (error) throw error;
      
      // Normalize servicos to always be an array
      return (data as Cliente[]).map(cliente => ({
        ...cliente,
        servicos: Array.isArray(cliente.servicos) ? cliente.servicos : []
      }));
    },
  });

  const createCliente = useMutation({
    mutationFn: async (cliente: ClienteFormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: perfil } = await supabase
        .from('perfis')
        .select('id')
        .eq('email', user?.email || '')
        .single();

      // Check if client with same name exists
      const { data: existing } = await supabase
        .from('empresas')
        .select('id')
        .eq('nome', cliente.nome)
        .maybeSingle();

      if (existing) {
        throw new Error('Já existe um cliente com este nome');
      }

      // Generate slug from name
      const slug = cliente.nome
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      // Generate random password
      const senhaAleatoria = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase();

      const { data, error } = await supabase
        .from('empresas')
        .insert({
          nome: cliente.nome,
          slug: slug,
          descricao: cliente.descricao,
          criado_por: perfil?.id,
          nome_decisor: cliente.decisores,
          status: cliente.status as any,
          site: cliente.site,
          valor_projeto: cliente.valor_projeto,
          servicos: cliente.servicos,
          tipo_contrato: cliente.tipo_contrato,
          data_inicio: cliente.data_inicio,
          data_encerramento: cliente.data_encerramento,
          senha: senhaAleatoria,
        })
        .select()
        .single();

      if (error) throw error;
      return { ...data, senhaAleatoria };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar cliente');
    },
  });

  const updateCliente = useMutation({
    mutationFn: async ({ id, cliente }: { id: string; cliente: ClienteFormData }) => {
      // Check if another client with same name exists (excluding current client)
      const { data: existing } = await supabase
        .from('empresas')
        .select('id')
        .eq('nome', cliente.nome)
        .neq('id', id)
        .maybeSingle();

      if (existing) {
        throw new Error('Já existe um cliente com este nome');
      }

      // Generate slug from name
      const slug = cliente.nome
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const { data, error } = await supabase
        .from('empresas')
        .update({
          nome: cliente.nome,
          slug: slug,
          descricao: cliente.descricao,
          nome_decisor: cliente.decisores,
          status: cliente.status as any,
          site: cliente.site,
          valor_projeto: cliente.valor_projeto,
          servicos: cliente.servicos,
          tipo_contrato: cliente.tipo_contrato,
          data_inicio: cliente.data_inicio,
          data_encerramento: cliente.data_encerramento,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast.success('Cliente atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar cliente');
    },
  });

  const deleteCliente = useMutation({
    mutationFn: async (id: string) => {
      // Verificar se há acessos (da página ACCESS-TEAM), tarefas ou checklists
      const { data: acessos } = await supabase
        .from('acessos')
        .select('id')
        .eq('empresa_id', id);

      const { data: tarefas } = await supabase
        .from('tarefas')
        .select('id')
        .eq('empresa_id', id);

      const { data: checklists } = await supabase
        .from('itens_checklist')
        .select('id')
        .eq('empresa_id', id);

      if ((acessos && acessos.length > 0) || (tarefas && tarefas.length > 0) || (checklists && checklists.length > 0)) {
        throw new Error('Não é possível excluir este cliente pois existem registros associados. Para excluir o cliente, primeiro exclua todos os acessos de sistemas (página Access-Team), tarefas e checklists vinculados a este cliente.');
      }

      // Buscar todos os perfis de usuários do cliente
      const { data: perfis } = await supabase
        .from('perfis')
        .select('id, email')
        .eq('empresa_id', id);

      // Primeiro remover o status principal de todos os usuários para evitar trigger
      if (perfis && perfis.length > 0) {
        await supabase
          .from('perfis')
          .update({ principal: false })
          .eq('empresa_id', id);
      }

      // Deletar cada usuário do auth e perfil usando a edge function
      if (perfis && perfis.length > 0) {
        for (const perfil of perfis) {
          try {
            const response = await supabase.functions.invoke('delete-auth-user', {
              body: { email: perfil.email }
            });
            
            if (response.error) {
              console.error('Erro ao deletar usuário:', perfil.email, response.error);
            }
          } catch (error) {
            console.error('Erro ao deletar usuário:', perfil.email, error);
            // Continua tentando deletar os outros mesmo se um falhar
          }
        }
      }

      // Deletar o cliente
      const { error } = await supabase
        .from('empresas')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast.success('Cliente excluído com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao excluir cliente');
    },
  });

  const resetarSenha = useMutation({
    mutationFn: async (id: string) => {
      const senhaAleatoria = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase();
      
      const { data, error } = await supabase
        .from('empresas')
        .update({ senha: senhaAleatoria })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { ...data, senhaAleatoria };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast.success(`Senha resetada! Nova senha: ${data.senhaAleatoria}`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao resetar senha');
    },
  });

  return {
    clientes,
    isLoading,
    createCliente,
    updateCliente,
    deleteCliente,
    resetarSenha,
  };
};
