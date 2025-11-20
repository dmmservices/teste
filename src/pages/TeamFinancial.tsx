import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import DashboardSidebar from '@/components/DashboardSidebar';
import { Search, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { usePagamentos } from '@/hooks/usePagamentos';
import { useDespesas } from '@/hooks/useDespesas';
import { useEmpresas } from '@/hooks/useEmpresas';

interface Pagamento {
  id: string;
  empresa_id: string;
  empresas?: { nome: string };
  valor: number;
  data_vencimento: string;
  status: 'Pago' | 'Atrasado' | 'Pendente';
  forma_pagamento: 'Pix' | 'Boleto' | 'Cartão' | 'Transferência';
  notas?: string;
  comprovante_url?: string;
}

interface Movimentacao {
  id: string;
  tipo: 'receita' | 'despesa';
  cliente?: string;
  valor: number;
  categoria: string;
  status: string;
  forma_pagamento: string;
  data: string;
  comprovante_url?: string;
  notas?: string;
  original: any;
}

const TeamFinancial = () => {
  const { pagamentos, createPagamento, updatePagamento, deletePagamento, uploadComprovante, deleteComprovante, gerarCobrancasRecorrentes } = usePagamentos();
  const { empresas } = useEmpresas();
  const { despesas, createDespesa, updateDespesa, deleteDespesa, gerarDespesasRecorrentes } = useDespesas();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('all');
  const [selectedClient, setSelectedClient] = useState('all');
  const [selectedTipo, setSelectedTipo] = useState('all');
  const [selectedPeriodo, setSelectedPeriodo] = useState('mes-atual');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [activeTab, setActiveTab] = useState('movimentacoes');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Pagamento | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDespesaAddModalOpen, setIsDespesaAddModalOpen] = useState(false);
  const [isDespesaEditModalOpen, setIsDespesaEditModalOpen] = useState(false);
  const [isDespesaDeleteDialogOpen, setIsDespesaDeleteDialogOpen] = useState(false);
  const [selectedDespesa, setSelectedDespesa] = useState<any | null>(null);
  const [isFixedExpenseModal, setIsFixedExpenseModal] = useState(false);

  const [formData, setFormData] = useState({
    empresa_id: '',
    valor: '',
    data_vencimento: '',
    status: '' as '' | 'Pago' | 'Atrasado' | 'Pendente',
    forma_pagamento: '' as '' | 'Pix' | 'Boleto' | 'Cartão' | 'Transferência',
    notas: '',
    comprovante_file: null as File | null,
  });
  
  const [initialFormData, setInitialFormData] = useState<typeof formData | null>(null);

  const hasGeneratedRef = useRef(false);
  useEffect(() => {
    if (!hasGeneratedRef.current) {
      hasGeneratedRef.current = true;
      gerarCobrancasRecorrentes.mutate();
      gerarDespesasRecorrentes.mutate();
    }
  }, []);

  const getCurrentMonthPayments = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    return pagamentos.filter(p => {
      const vencimento = new Date(p.data_vencimento);
      return vencimento.getMonth() === currentMonth && vencimento.getFullYear() === currentYear;
    });
  };

  const getFilteredPayments = (paymentsToFilter: any[]) => {
    return paymentsToFilter.filter(payment => {
      const clientName = payment.empresas?.nome || '';
      const matchesSearch = clientName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = selectedStatus === 'all' || payment.status === selectedStatus;
      const matchesPaymentMethod = selectedPaymentMethod === 'all' || payment.forma_pagamento === selectedPaymentMethod;
      const matchesClient = selectedClient === 'all' || payment.empresa_id === selectedClient;
      return matchesSearch && matchesStatus && matchesPaymentMethod && matchesClient;
    });
  };

  const calculateSummary = (payments: any[]) => {
    return payments.reduce((acc, payment) => {
      if (payment.status === 'Pago') acc.totalPago += payment.valor;
      else if (payment.status === 'Pendente') acc.totalPendente += payment.valor;
      else if (payment.status === 'Atrasado') acc.totalAtrasado += payment.valor;
      acc.faturamentoPrevisto += payment.valor;
      return acc;
    }, { totalPago: 0, totalPendente: 0, totalAtrasado: 0, faturamentoPrevisto: 0 });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const renderSummaryCards = (summary: { totalPago: number; totalPendente: number; totalAtrasado: number; faturamentoPrevisto: number }) => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Pago</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalPago)}</div></CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Pendente</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-yellow-600">{formatCurrency(summary.totalPendente)}</div></CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Atrasado</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalAtrasado)}</div></CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Faturamento Total</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-primary">{formatCurrency(summary.faturamentoPrevisto)}</div></CardContent></Card>
    </div>
  );

  const renderFilters = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" /></div>
      <Select value={selectedClient} onValueChange={setSelectedClient}><SelectTrigger><SelectValue placeholder="Cliente" /></SelectTrigger><SelectContent><SelectItem value="all">Todos os clientes</SelectItem>{empresas.map(empresa => (<SelectItem key={empresa.id} value={empresa.id}>{empresa.nome}</SelectItem>))}</SelectContent></Select>
      <Select value={selectedStatus} onValueChange={setSelectedStatus}><SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">Todos os status</SelectItem><SelectItem value="Pago">Pago</SelectItem><SelectItem value="Pendente">Pendente</SelectItem><SelectItem value="Atrasado">Atrasado</SelectItem></SelectContent></Select>
      <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}><SelectTrigger><SelectValue placeholder="Forma de pagamento" /></SelectTrigger><SelectContent><SelectItem value="all">Todas as formas</SelectItem><SelectItem value="Pix">Pix</SelectItem><SelectItem value="Boleto">Boleto</SelectItem><SelectItem value="Cartão">Cartão</SelectItem><SelectItem value="Transferência">Transferência</SelectItem></SelectContent></Select>
    </div>
  );

  const currentMonthPayments = getCurrentMonthPayments();
  const filteredCurrentMonthPayments = getFilteredPayments(currentMonthPayments);
  const currentMonthSummary = calculateSummary(filteredCurrentMonthPayments);

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar userType="admin" />
      <div className="lg:pl-64">
        <div className="p-6 lg:p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Movimentações</h1>
            <p className="text-muted-foreground mt-2">Acompanhe suas movimentações financeiras</p>
          </div>
          {renderFilters()}
          {renderSummaryCards(currentMonthSummary)}
          <div className="mb-4">
            <Button onClick={() => setIsAddModalOpen(true)}><Plus className="mr-2" />Adicionar Movimentação</Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Forma de Pagamento</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Comprovante</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCurrentMonthPayments.map((pagamento) => (
                <TableRow key={pagamento.id}>
                  <TableCell>{pagamento.empresas?.nome}</TableCell>
                  <TableCell>{formatCurrency(pagamento.valor)}</TableCell>
                  <TableCell>{pagamento.tipo}</TableCell>
                  <TableCell>{pagamento.categoria}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(pagamento.status)}>{pagamento.status}</Badge>
                  </TableCell>
                  <TableCell>{pagamento.forma_pagamento}</TableCell>
                  <TableCell>{new Date(pagamento.data_vencimento).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>
                    {pagamento.comprovante_url ? (
                      <Button variant="ghost" size="sm" onClick={() => window.open(pagamento.comprovante_url, '_blank')}>Visualizar</Button>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" onClick={() => handleEdit(pagamento)}>Editar</Button>
                    <Button variant="outline" onClick={() => handleDelete(pagamento)}>Excluir</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default TeamFinancial;
