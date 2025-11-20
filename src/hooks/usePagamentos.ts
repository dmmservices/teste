import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type Pagamento = Tables<'pagamentos'>;

interface CreatePagamentoData {
  empresa_id: string;
  valor: number;
  data_vencimento: string;
  status: 'Pago' | 'Atrasado' | 'Pendente';
  forma_pagamento: 'Pix' | 'Boleto' | 'Cartão' | 'Transferência';
  notas?: string;
  comprovante_url?: string;
}

interface UpdatePagamentoData extends CreatePagamentoData {
  id: string;
}

export const usePagamentos = () => {
  const queryClient = useQueryClient();

  const { data: pagamentos = [], isLoading } = useQuery({
    queryKey: ['pagamentos'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('pagamentos')
          .select(`
            *,
            empresas!inner(
              id,
              nome,
              status
            )
          `)
          .order('data_vencimento', { ascending: false });

        if (error) {
          console.error('Erro ao buscar pagamentos:', error);
          throw error;
        }

        return data as (Pagamento & { empresas: { id: string; nome: string; status: string } })[];
      } catch (error) {
        console.error('Erro na query de pagamentos:', error);
        return [];
      }
    },
  });

  const createPagamento = useMutation({
    mutationFn: async (data: CreatePagamentoData) => {
      const { data: newPagamento, error } = await supabase
        .from('pagamentos')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return newPagamento;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pagamentos'] });
      toast.success('Pagamento adicionado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar pagamento:', error);
      toast.error('Erro ao adicionar pagamento');
    },
  });

  const updatePagamento = useMutation({
    mutationFn: async ({ id, ...data }: UpdatePagamentoData) => {
      const { data: updatedPagamento, error } = await supabase
        .from('pagamentos')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updatedPagamento;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pagamentos'] });
      toast.success('Pagamento atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar pagamento:', error);
      toast.error('Erro ao atualizar pagamento');
    },
  });

  const deletePagamento = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pagamentos')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pagamentos'] });
      toast.success('Pagamento excluído com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao excluir pagamento:', error);
      toast.error('Erro ao excluir pagamento');
    },
  });

  const uploadComprovante = async (file: File, empresaId: string, pagamentoId: string) => {
    try {
      const year = new Date().getFullYear();
      const filePath = `${empresaId}/${year}/${pagamentoId}/${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('comprovantes')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('comprovantes')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload do comprovante:', error);
      toast.error('Erro ao fazer upload do comprovante');
      throw error;
    }
  };

  const deleteComprovante = async (comprovanteUrl: string) => {
    try {
      // Extrair o caminho do arquivo da URL
      const urlParts = comprovanteUrl.split('/storage/v1/object/public/comprovantes/');
      if (urlParts.length < 2) {
        throw new Error('URL de comprovante inválida');
      }
      
      const filePath = urlParts[1];

      const { error: deleteError } = await supabase.storage
        .from('comprovantes')
        .remove([filePath]);

      if (deleteError) throw deleteError;

      toast.success('Comprovante removido com sucesso');
    } catch (error) {
      console.error('Erro ao remover comprovante:', error);
      toast.error('Erro ao remover comprovante');
      throw error;
    }
  };

  // Função auxiliar para calcular próximo dia útil (ignora sábado/domingo)
  const getNextBusinessDay = (date: Date): Date => {
    const result = new Date(date);
    
    // Loop até encontrar um dia útil (segunda a sexta)
    while (result.getDay() === 0 || result.getDay() === 6) {
      // Se for domingo (0), avança 1 dia para segunda
      // Se for sábado (6), avança 2 dias para segunda
      if (result.getDay() === 0) {
        result.setDate(result.getDate() + 1);
      } else if (result.getDay() === 6) {
        result.setDate(result.getDate() + 2);
      }
    }
    
    return result;
  };

  const gerarCobrancasRecorrentes = useMutation({
    mutationFn: async () => {
      // Buscar TODAS as empresas com valor de projeto e data de início (incluindo encerradas)
      const { data: empresasComRecorrencia, error: empresasError } = await supabase
        .from('empresas')
        .select('id, nome, valor_projeto, data_inicio, data_encerramento, status, frequencia_pagamento')
        .not('valor_projeto', 'is', null)
        .gt('valor_projeto', 0)
        .not('data_inicio', 'is', null);

      if (empresasError) throw empresasError;

      if (!empresasComRecorrencia || empresasComRecorrencia.length === 0) {
        return { created: 0, skipped: 0 };
      }

      let created = 0;
      let skipped = 0;

      for (const empresa of empresasComRecorrencia) {
        const dataInicio = new Date(empresa.data_inicio);
        const hoje = new Date();
        const frequencia = empresa.frequencia_pagamento || 'Mensal';
        
        // Definir até quando gerar cobranças
        let dataLimite: Date;
        if (empresa.data_encerramento) {
          dataLimite = new Date(empresa.data_encerramento);
        } else {
          dataLimite = hoje;
        }
        
        // Calcular número de parcelas e valor por parcela baseado na frequência
        let numeroParcelas = 1;
        let intervalo = 0; // dias
        
        switch (frequencia) {
          case 'Semanal':
            numeroParcelas = 4; // 4 parcelas por mês
            intervalo = 7;
            break;
          case 'Quinzenal':
            numeroParcelas = 2; // 2 parcelas por mês
            intervalo = 15;
            break;
          case 'Mensal':
            numeroParcelas = 1;
            intervalo = 0; // será calculado mês a mês
            break;
          case 'Trimestral':
            numeroParcelas = 1;
            intervalo = 0;
            break;
          case 'Semestral':
            numeroParcelas = 1;
            intervalo = 0;
            break;
          case 'Anual':
            numeroParcelas = 1;
            intervalo = 0;
            break;
        }
        
        const valorPorParcela = (empresa.valor_projeto || 0) / numeroParcelas;
        
        // Começar da data de início
        let dataAtual = new Date(dataInicio);

        // Gerar pagamentos desde a data de início até o limite
        while (dataAtual <= dataLimite) {
          // Para frequências semanais e quinzenais, gerar múltiplas parcelas no mês
          if (frequencia === 'Semanal' || frequencia === 'Quinzenal') {
            for (let i = 0; i < numeroParcelas; i++) {
              let dataVencimento = new Date(dataAtual);
              dataVencimento.setDate(dataVencimento.getDate() + (i * intervalo));
              
              // Ajustar para próximo dia útil
              dataVencimento = getNextBusinessDay(dataVencimento);
              
              // Verificar se não ultrapassa data de encerramento
              if (empresa.data_encerramento) {
                const dataEncerramentoDate = new Date(empresa.data_encerramento);
                if (dataVencimento > dataEncerramentoDate) {
                  break;
                }
              }
              
              // Verificar se não ultrapassa o limite de tempo
              if (dataVencimento > dataLimite) {
                break;
              }
              
              const dataVencimentoStr = dataVencimento.toISOString().split('T')[0];

              // Verificar se já existe pagamento para esta data
              const { data: existingPayments } = await supabase
                .from('pagamentos')
                .select('id')
                .eq('empresa_id', empresa.id)
                .eq('data_vencimento', dataVencimentoStr);

              if (!existingPayments || existingPayments.length === 0) {
                const { error: insertError } = await supabase
                  .from('pagamentos')
                  .insert({
                    empresa_id: empresa.id,
                    valor: valorPorParcela,
                    data_vencimento: dataVencimentoStr,
                    status: 'Pendente',
                    forma_pagamento: 'Pix',
                    notas: 'Cobrança gerada automaticamente'
                  });

                if (insertError) {
                  console.error(`Erro ao criar pagamento para ${empresa.nome}:`, insertError);
                } else {
                  created++;
                }
              } else {
                skipped++;
              }
            }
          } else {
            // Para outras frequências (Mensal, Trimestral, Semestral, Anual)
            const diaVencimento = dataAtual.getDate();
            const ano = dataAtual.getFullYear();
            const mes = dataAtual.getMonth();
            
            const ultimoDiaDoMes = new Date(ano, mes + 1, 0).getDate();
            const diaDoVencimento = Math.min(diaVencimento, ultimoDiaDoMes);
            
            let dataVencimento = new Date(ano, mes, diaDoVencimento);
            dataVencimento = getNextBusinessDay(dataVencimento);
            
            // Verificar se não ultrapassa data de encerramento
            if (empresa.data_encerramento) {
              const dataEncerramentoDate = new Date(empresa.data_encerramento);
              if (dataVencimento > dataEncerramentoDate) {
                break;
              }
            }
            
            const dataVencimentoStr = dataVencimento.toISOString().split('T')[0];

            // Verificar se já existe pagamento para este período
            const primeiroDiaMes = new Date(ano, mes, 1).toISOString().split('T')[0];
            const ultimoDiaMes = new Date(ano, mes + 1, 0).toISOString().split('T')[0];
            const { data: existingPayments } = await supabase
              .from('pagamentos')
              .select('id')
              .eq('empresa_id', empresa.id)
              .gte('data_vencimento', primeiroDiaMes)
              .lte('data_vencimento', ultimoDiaMes);

            if (!existingPayments || existingPayments.length === 0) {
              const { error: insertError } = await supabase
                .from('pagamentos')
                .insert({
                  empresa_id: empresa.id,
                  valor: empresa.valor_projeto || 0,
                  data_vencimento: dataVencimentoStr,
                  status: 'Pendente',
                  forma_pagamento: 'Pix',
                  notas: 'Cobrança gerada automaticamente'
                });

              if (insertError) {
                console.error(`Erro ao criar pagamento para ${empresa.nome}:`, insertError);
              } else {
                created++;
              }
            } else {
              skipped++;
            }
          }

          // Avançar para o próximo período com base na frequência
          switch (frequencia) {
            case 'Semanal':
            case 'Quinzenal':
              dataAtual.setMonth(dataAtual.getMonth() + 1);
              dataAtual.setDate(dataInicio.getDate()); // Resetar para o dia da data de início
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
          }
        }
      }

      return { created, skipped };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['pagamentos'] });
      if (result.created > 0) {
        toast.success(`${result.created} cobrança(s) gerada(s) automaticamente`);
      }
    },
    onError: (error) => {
      console.error('Erro ao gerar cobranças recorrentes:', error);
      toast.error('Erro ao gerar cobranças recorrentes');
    },
  });

  return {
    pagamentos,
    isLoading,
    createPagamento,
    updatePagamento,
    deletePagamento,
    uploadComprovante,
    deleteComprovante,
    gerarCobrancasRecorrentes,
  };
};
