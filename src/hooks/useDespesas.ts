import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type Despesa = Tables<'despesas'>;

interface CreateDespesaData {
  nome: string;
  tipo: 'Imposto' | 'Ferramenta digital' | 'Ferramenta Física' | 'Educacional' | 'Marketing' | 'Mão de obra' | 'Fundo de Oferta';
  data_pagamento: string;
  meio_pagamento: 'Pix' | 'Boleto' | 'Cartão' | 'Transferência';
  valor_unitario: number;
  quantidade: number;
  recorrente?: boolean;
  data_inicio?: string;
  data_fim?: string;
  frequencia_recorrencia?: 'Semanal' | 'Quinzenal' | 'Mensal' | 'Trimestral' | 'Semestral' | 'Anual';
  notas?: string;
}

interface UpdateDespesaData extends CreateDespesaData {
  id: string;
}

export const useDespesas = () => {
  const queryClient = useQueryClient();

  const { data: despesas = [], isLoading } = useQuery({
    queryKey: ['despesas'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('despesas')
          .select('*')
          .order('data_pagamento', { ascending: false });

        if (error) {
          console.error('Erro ao buscar despesas:', error);
          throw error;
        }

        return data as Despesa[];
      } catch (error) {
        console.error('Erro na query de despesas:', error);
        return [];
      }
    },
  });

  const createDespesa = useMutation({
    mutationFn: async (data: CreateDespesaData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: perfil } = await supabase
        .from('perfis')
        .select('id')
        .eq('email', user.email)
        .single();

      if (!perfil) throw new Error('Perfil não encontrado');

      const { data: newDespesa, error } = await supabase
        .from('despesas')
        .insert([{ ...data, criado_por: perfil.id }])
        .select()
        .single();

      if (error) throw error;
      return newDespesa;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['despesas'] });
      toast.success('Despesa adicionada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar despesa:', error);
      toast.error('Erro ao adicionar despesa');
    },
  });

  const updateDespesa = useMutation({
    mutationFn: async ({ id, ...data }: UpdateDespesaData) => {
      const { data: updatedDespesa, error } = await supabase
        .from('despesas')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updatedDespesa;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['despesas'] });
      toast.success('Despesa atualizada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar despesa:', error);
      toast.error('Erro ao atualizar despesa');
    },
  });

  const deleteDespesa = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('despesas')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['despesas'] });
      toast.success('Despesa excluída com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao excluir despesa:', error);
      toast.error('Erro ao excluir despesa');
    },
  });

  const getNextBusinessDay = (date: Date): Date => {
    const result = new Date(date);
    
    while (result.getDay() === 0 || result.getDay() === 6) {
      if (result.getDay() === 0) {
        result.setDate(result.getDate() + 1);
      } else if (result.getDay() === 6) {
        result.setDate(result.getDate() + 2);
      }
    }
    
    return result;
  };

  const gerarDespesasRecorrentes = useMutation({
    mutationFn: async () => {
      const { data: despesasRecorrentes, error: despesasError } = await supabase
        .from('despesas')
        .select('*')
        .eq('recorrente', true)
        .not('data_inicio', 'is', null);

      if (despesasError) throw despesasError;

      if (!despesasRecorrentes || despesasRecorrentes.length === 0) {
        return { created: 0, skipped: 0 };
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: perfil } = await supabase
        .from('perfis')
        .select('id')
        .eq('email', user.email)
        .single();

      if (!perfil) throw new Error('Perfil não encontrado');

      let created = 0;
      let skipped = 0;

      for (const despesaRecorrente of despesasRecorrentes) {
        const dataInicio = new Date(despesaRecorrente.data_inicio!);
        const hoje = new Date();
        
        let dataLimite: Date;
        if (despesaRecorrente.data_fim) {
          dataLimite = new Date(despesaRecorrente.data_fim);
        } else {
          dataLimite = hoje;
        }

        let dataAtual = new Date(dataInicio);

        while (dataAtual <= dataLimite) {
          let dataPagamento = getNextBusinessDay(new Date(dataAtual));
          
          if (despesaRecorrente.data_fim) {
            const dataFimDate = new Date(despesaRecorrente.data_fim);
            if (dataPagamento > dataFimDate) {
              break;
            }
          }

          const dataPagamentoStr = dataPagamento.toISOString().split('T')[0];

          const { data: existingDespesas } = await supabase
            .from('despesas')
            .select('id')
            .eq('nome', despesaRecorrente.nome)
            .eq('data_pagamento', dataPagamentoStr);

          if (!existingDespesas || existingDespesas.length === 0) {
            const { error: insertError } = await supabase
              .from('despesas')
              .insert({
                nome: despesaRecorrente.nome,
                tipo: despesaRecorrente.tipo,
                data_pagamento: dataPagamentoStr,
                meio_pagamento: despesaRecorrente.meio_pagamento,
                valor_unitario: despesaRecorrente.valor_unitario,
                quantidade: despesaRecorrente.quantidade,
                recorrente: false,
                notas: 'Despesa gerada automaticamente',
                criado_por: perfil.id
              });

            if (insertError) {
              console.error(`Erro ao criar despesa recorrente:`, insertError);
            } else {
              created++;
            }
          } else {
            skipped++;
          }

          // Avançar para próxima data com base na frequência
          switch (despesaRecorrente.frequencia_recorrencia) {
            case 'Semanal':
              dataAtual.setDate(dataAtual.getDate() + 7);
              break;
            case 'Quinzenal':
              dataAtual.setDate(dataAtual.getDate() + 15);
              break;
            case 'Mensal':
              dataAtual.setMonth(dataAtual.getMonth() + 1);
              break;
            case 'Trimestral':
              dataAtual.setMonth(dataAtual.getMonth() + 3);
              break;
            case 'Semestral':
              dataAtual.setMonth(dataAtual.getMonth() + 6);
              break;
            case 'Anual':
              dataAtual.setFullYear(dataAtual.getFullYear() + 1);
              break;
            default:
              dataAtual.setMonth(dataAtual.getMonth() + 1);
          }
        }
      }

      return { created, skipped };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['despesas'] });
      if (result.created > 0) {
        toast.success(`${result.created} despesa(s) gerada(s) automaticamente`);
      }
    },
    onError: (error) => {
      console.error('Erro ao gerar despesas recorrentes:', error);
      toast.error('Erro ao gerar despesas recorrentes');
    },
  });

  return {
    despesas,
    isLoading,
    createDespesa,
    updateDespesa,
    deleteDespesa,
    gerarDespesasRecorrentes,
  };
};
