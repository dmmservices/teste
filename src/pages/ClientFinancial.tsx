import React, { useMemo } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Download, FileText, DollarSign, Calendar, CreditCard } from 'lucide-react';
import { usePagamentos } from '@/hooks/usePagamentos';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ClientFinancial = () => {
  const { perfil } = useAuthContext();
  const { pagamentos, isLoading } = usePagamentos();

  // Filtrar pagamentos apenas do cliente logado
  const pagamentosDoCliente = useMemo(() => {
    if (!perfil?.empresa_id) return [];
    return pagamentos.filter(p => p.empresa_id === perfil.empresa_id);
  }, [pagamentos, perfil?.empresa_id]);

  // Pagamento do mês atual
  const pagamentoMesAtual = useMemo(() => {
    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();
    
    return pagamentosDoCliente.find(p => {
      const dataVencimento = new Date(p.data_vencimento);
      return dataVencimento.getMonth() === mesAtual && dataVencimento.getFullYear() === anoAtual;
    });
  }, [pagamentosDoCliente]);

  // Estatísticas
  const stats = useMemo(() => {
    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();

    const pagamentosMesAtual = pagamentosDoCliente.filter(p => {
      const dataVencimento = new Date(p.data_vencimento);
      return dataVencimento.getMonth() === mesAtual && dataVencimento.getFullYear() === anoAtual;
    });

    const totalPago = pagamentosDoCliente
      .filter(p => p.status === 'Pago')
      .reduce((acc, p) => acc + parseFloat(p.valor.toString()), 0);

    const totalPendente = pagamentosDoCliente
      .filter(p => p.status === 'Pendente')
      .reduce((acc, p) => acc + parseFloat(p.valor.toString()), 0);

    const totalAtrasado = pagamentosDoCliente
      .filter(p => p.status === 'Atrasado')
      .reduce((acc, p) => acc + parseFloat(p.valor.toString()), 0);

    return {
      totalPago,
      totalPendente,
      totalAtrasado,
      pagamentosMesAtual: pagamentosMesAtual.length,
    };
  }, [pagamentosDoCliente]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pago':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'Pendente':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'Atrasado':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando informações financeiras...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar userType="client" />
      <div className="lg:pl-64">
        <div className="p-6 lg:p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Financeiro</h1>
            <p className="text-muted-foreground mt-2">
              Acompanhe seus pagamentos e faturas
            </p>
          </div>

          {/* Cards de resumo */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">
                  {formatCurrency(stats.totalPago)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total de pagamentos realizados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendente</CardTitle>
                <Calendar className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-500">
                  {formatCurrency(stats.totalPendente)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Aguardando pagamento
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Atrasado</CardTitle>
                <FileText className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">
                  {formatCurrency(stats.totalAtrasado)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Pagamentos em atraso
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Faturas</CardTitle>
                <CreditCard className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {pagamentosDoCliente.length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total de faturas registradas
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Fatura do mês atual */}
          {pagamentoMesAtual && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Fatura do Mês Atual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Valor</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(parseFloat(pagamentoMesAtual.valor.toString()))}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Vencimento</p>
                    <p className="text-lg font-semibold">
                      {formatDate(pagamentoMesAtual.data_vencimento)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Status</p>
                    <Badge className={getStatusColor(pagamentoMesAtual.status)}>
                      {pagamentoMesAtual.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Forma de Pagamento</p>
                    <p className="text-lg font-semibold">{pagamentoMesAtual.forma_pagamento}</p>
                  </div>
                </div>
                {pagamentoMesAtual.comprovante_url && (
                  <div className="mt-6 pt-6 border-t border-border">
                    <p className="text-sm text-muted-foreground mb-3">Comprovante de Pagamento</p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => window.open(pagamentoMesAtual.comprovante_url, '_blank')}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Visualizar
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = pagamentoMesAtual.comprovante_url!;
                          link.download = `comprovante-${pagamentoMesAtual.id}`;
                          link.click();
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Baixar
                      </Button>
                    </div>
                  </div>
                )}
                {pagamentoMesAtual.notas && (
                  <div className="mt-6 pt-6 border-t border-border">
                    <p className="text-sm text-muted-foreground mb-2">Observações</p>
                    <p className="text-sm whitespace-pre-wrap">{pagamentoMesAtual.notas}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Histórico de pagamentos */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Pagamentos</CardTitle>
            </CardHeader>
            <CardContent>
              {pagamentosDoCliente.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum pagamento registrado ainda.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Forma de Pagamento</TableHead>
                        <TableHead>Comprovante</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagamentosDoCliente
                        .sort((a, b) => new Date(b.data_vencimento).getTime() - new Date(a.data_vencimento).getTime())
                        .map((pagamento) => (
                          <TableRow key={pagamento.id}>
                            <TableCell>{formatDate(pagamento.data_vencimento)}</TableCell>
                            <TableCell className="font-semibold">
                              {formatCurrency(parseFloat(pagamento.valor.toString()))}
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(pagamento.status)}>
                                {pagamento.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{pagamento.forma_pagamento}</TableCell>
                            <TableCell>
                              {pagamento.comprovante_url ? (
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.open(pagamento.comprovante_url, '_blank')}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const link = document.createElement('a');
                                      link.href = pagamento.comprovante_url!;
                                      link.download = `comprovante-${pagamento.id}`;
                                      link.click();
                                    }}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ClientFinancial;
