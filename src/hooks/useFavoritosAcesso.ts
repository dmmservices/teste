import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

// Temporary type until Supabase types are updated
type FavoritoAcesso = any;

export const useFavoritosAcesso = () => {
  const queryClient = useQueryClient();
  const { perfil } = useAuthContext();

  const { data: favoritos = [], isLoading } = useQuery({
    queryKey: ['favoritos_acesso'],
    queryFn: async () => {
      if (!perfil?.id) return [];
      
      const { data, error } = await supabase
        .from('favoritos_acesso' as any)
        .select('*')
        .eq('usuario_id', perfil.id);

      if (error) {
        console.error('Erro ao buscar favoritos:', error);
        throw error;
      }

      return data as FavoritoAcesso[];
    },
    enabled: !!perfil?.id
  });

  const toggleFavorito = useMutation({
    mutationFn: async (acessoId: string) => {
      if (!perfil?.id) throw new Error('Usuário não encontrado');

      const favoritoExistente = favoritos.find(f => f.acesso_id === acessoId);

      if (favoritoExistente) {
        // Remover dos favoritos
        const { error } = await supabase
          .from('favoritos_acesso' as any)
          .delete()
          .eq('id', favoritoExistente.id);

        if (error) throw error;
        return { acao: 'removido' };
      } else {
        // Adicionar aos favoritos
        const { error } = await supabase
          .from('favoritos_acesso' as any)
          .insert([{
            acesso_id: acessoId,
            usuario_id: perfil.id
          } as any]);

        if (error) throw error;
        return { acao: 'adicionado' };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favoritos_acesso'] });
    },
    onError: (error) => {
      console.error('Erro ao alterar favorito:', error);
    }
  });

  const isFavorito = (acessoId: string) => {
    return favoritos.some(f => f.acesso_id === acessoId);
  };

  return {
    favoritos,
    isLoading,
    toggleFavorito,
    isFavorito
  };
};