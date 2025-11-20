import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type Cliente = Tables<'empresas'>;

interface ClientEditModalProps {
  open: boolean;
  onClose: () => void;
  cliente?: Cliente | null;
  onSave: (cliente: any) => void;
}

const servicosDisponiveis = [
  'Assessoria',
  'Consultoria',
  'Automação',
  'CRM',
  'E-mail Marketing',
  'Identidade Visual',
  'Trafego Pago',
  'Gestão de Redes Sociais',
  'Website'
];

const statusOptions = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'pausado', label: 'Pausado' },
  { value: 'encerrado', label: 'Encerrado' },
];

export const ClientEditModal: React.FC<ClientEditModalProps> = ({
  open,
  onClose,
  cliente,
  onSave
}) => {
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    decisores: '',
    status: 'ativo',
    site: '',
    valor_projeto: '',
    frequencia_pagamento: 'Mensal',
    servicos: [] as string[],
    tipo_contrato: 'recorrente',
    data_inicio: undefined as Date | undefined,
    data_encerramento: undefined as Date | undefined,
  });

  const [servicoInput, setServicoInput] = useState('');

  useEffect(() => {
    if (cliente) {
      const servicosArray = Array.isArray(cliente.servicos) 
        ? (cliente.servicos as string[])
        : [];
      
      // Garantir que tipo_contrato nunca seja vazio ou inválido
      let tipoContrato = cliente.tipo_contrato;
      if (!tipoContrato || (tipoContrato !== 'recorrente' && tipoContrato !== 'unico')) {
        tipoContrato = 'recorrente';
      }
      
      setFormData({
        nome: cliente.nome || '',
        descricao: cliente.descricao || '',
        decisores: cliente.nome_decisor || '',
        status: cliente.status || 'ativo',
        site: cliente.site || '',
        valor_projeto: cliente.valor_projeto ? String(Number(cliente.valor_projeto).toFixed(2)).replace('.', ',') : '',
        frequencia_pagamento: cliente.frequencia_pagamento || 'Mensal',
        servicos: servicosArray,
        tipo_contrato: tipoContrato,
        data_inicio: cliente.data_inicio ? new Date(cliente.data_inicio) : undefined,
        data_encerramento: cliente.data_encerramento ? new Date(cliente.data_encerramento) : undefined,
      });
    } else {
      setFormData({
        nome: '',
        descricao: '',
        decisores: '',
        status: 'ativo',
        site: '',
        valor_projeto: '',
        frequencia_pagamento: 'Mensal',
        servicos: [],
        tipo_contrato: 'recorrente',
        data_inicio: undefined,
        data_encerramento: undefined,
      });
    }
    setHasChanges(false);
  }, [cliente, open]);

  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (!numbers) return '';
    const amount = parseFloat(numbers) / 100;
    return amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value);
    setFormData({ ...formData, valor_projeto: formatted });
  };

  const [hasChanges, setHasChanges] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  useEffect(() => {
    if (!cliente || !open) {
      setHasChanges(false);
      return;
    }

    const servicosArray = Array.isArray(cliente.servicos) 
      ? (cliente.servicos as string[])
      : [];

    // Garantir que tipo_contrato nunca seja vazio ou inválido
    let tipoContratoOriginal = cliente.tipo_contrato;
    if (!tipoContratoOriginal || (tipoContratoOriginal !== 'recorrente' && tipoContratoOriginal !== 'unico')) {
      tipoContratoOriginal = 'recorrente';
    }

    const currentData = JSON.stringify({
      nome: formData.nome,
      descricao: formData.descricao,
      decisores: formData.decisores,
      status: formData.status,
      site: formData.site,
      valor_projeto: formData.valor_projeto,
      frequencia_pagamento: formData.frequencia_pagamento,
      servicos: formData.servicos,
      tipo_contrato: formData.tipo_contrato,
      data_inicio: formData.data_inicio,
      data_encerramento: formData.data_encerramento,
    });

    const originalData = JSON.stringify({
      nome: cliente.nome || '',
      descricao: cliente.descricao || '',
      decisores: cliente.nome_decisor || '',
      status: cliente.status || 'ativo',
      site: cliente.site || '',
      valor_projeto: cliente.valor_projeto ? String(Number(cliente.valor_projeto).toFixed(2)).replace('.', ',') : '',
      frequencia_pagamento: cliente.frequencia_pagamento || 'Mensal',
      servicos: servicosArray,
      tipo_contrato: tipoContratoOriginal,
      data_inicio: cliente.data_inicio ? new Date(cliente.data_inicio) : undefined,
      data_encerramento: cliente.data_encerramento ? new Date(cliente.data_encerramento) : undefined,
    });

    setHasChanges(currentData !== originalData);
  }, [formData, cliente, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validações de campos obrigatórios
    if (!formData.nome.trim()) {
      toast.error('O nome é obrigatório');
      return;
    }

    if (formData.servicos.length === 0) {
      toast.error('Adicione pelo menos um serviço contratado');
      return;
    }

    if (!formData.valor_projeto) {
      toast.error('O valor do projeto é obrigatório');
      return;
    }

    if (!formData.decisores.trim()) {
      toast.error('O campo Decisores é obrigatório');
      return;
    }

    if (!formData.data_inicio) {
      toast.error('A data de início é obrigatória');
      return;
    }

    if (!formData.tipo_contrato || (formData.tipo_contrato !== 'recorrente' && formData.tipo_contrato !== 'unico')) {
      toast.error('Selecione um tipo de contrato válido');
      return;
    }

    // Validações de datas
    if (formData.data_inicio && formData.data_encerramento) {
      if (formData.data_encerramento < formData.data_inicio) {
        toast.error('A data de encerramento não pode ser anterior à data de início');
        return;
      }
    }

    if (formData.status === 'ativo' && formData.data_encerramento) {
      toast.error('Não é possível definir data de encerramento para cliente com status Ativo');
      return;
    }

    // Normalizar URL
    let siteNormalizado = formData.site;
    if (siteNormalizado && !siteNormalizado.match(/^https?:\/\//)) {
      siteNormalizado = 'https://' + siteNormalizado;
    }
    
    const valorNumerico = formData.valor_projeto 
      ? parseFloat(formData.valor_projeto.replace(/\./g, '').replace(',', '.'))
      : 0;

    if (cliente) {
      if (hasChanges) {
        setShowSaveConfirm(true);
      } else {
        toast.info('Nenhuma alteração foi realizada');
        return;
      }
    } else {
      submitData(valorNumerico, siteNormalizado);
    }
  };

  const submitData = (valorNumerico: number, siteNormalizado?: string) => {
    onSave({
      ...formData,
      site: siteNormalizado,
      valor_projeto: valorNumerico,
      data_inicio: formData.data_inicio ? format(formData.data_inicio, 'yyyy-MM-dd') : null,
      data_encerramento: formData.data_encerramento ? format(formData.data_encerramento, 'yyyy-MM-dd') : null,
    });
    setShowSaveConfirm(false);
  };

  const handleClose = () => {
    if (hasChanges) {
      setShowExitConfirm(true);
    } else {
      onClose();
    }
  };

  const confirmClose = () => {
    setShowExitConfirm(false);
    setHasChanges(false);
    onClose();
  };

  const adicionarServico = () => {
    if (servicoInput && !formData.servicos.includes(servicoInput)) {
      setFormData(prev => ({
        ...prev,
        servicos: [...prev.servicos, servicoInput]
      }));
      setServicoInput('');
    }
  };

  const removerServico = (servico: string) => {
    setFormData(prev => ({
      ...prev,
      servicos: prev.servicos.filter(s => s !== servico)
    }));
  };

  return (
    <>
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {cliente ? 'Editar Cliente' : 'Novo Cliente'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="site">Site da Empresa</Label>
              <Input
                id="site"
                type="url"
                value={formData.site}
                onChange={(e) => setFormData({ ...formData, site: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="decisores">Decisores *</Label>
              <Input
                id="decisores"
                value={formData.decisores}
                onChange={(e) => setFormData({ ...formData, decisores: e.target.value })}
                placeholder="Nome dos decisores"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="valor_projeto">Valor do Projeto (R$) *</Label>
              <Input
                id="valor_projeto"
                value={formData.valor_projeto}
                onChange={handleCurrencyChange}
                placeholder="0,00"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="frequencia_pagamento">Frequência de Pagamento *</Label>
            <Select 
              value={formData.frequencia_pagamento} 
              onValueChange={(value) => setFormData({ ...formData, frequencia_pagamento: value })}
            >
              <SelectTrigger id="frequencia_pagamento">
                <SelectValue placeholder="Selecione a frequência" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Semanal">Semanal</SelectItem>
                <SelectItem value="Quinzenal">Quinzenal</SelectItem>
                <SelectItem value="Mensal">Mensal</SelectItem>
                <SelectItem value="Trimestral">Trimestral</SelectItem>
                <SelectItem value="Semestral">Semestral</SelectItem>
                <SelectItem value="Anual">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Serviços Contratados *</Label>
            <div className="flex gap-2 mb-2">
              <Select value={servicoInput} onValueChange={setServicoInput}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecione um serviço" />
                </SelectTrigger>
                <SelectContent>
                  {servicosDisponiveis.map((servico) => (
                    <SelectItem key={servico} value={servico}>
                      {servico}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" onClick={adicionarServico} variant="outline">
                Adicionar
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.servicos.map((servico) => (
                <div
                  key={servico}
                  className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                >
                  {servico}
                  <button
                    type="button"
                    onClick={() => removerServico(servico)}
                    className="hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            {formData.servicos.length === 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                Adicione pelo menos um serviço
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tipo_contrato">Tipo de Contrato *</Label>
              <Select
                value={formData.tipo_contrato}
                onValueChange={(value) => {
                  if (value !== 'recorrente' && value !== 'unico') return;
                  setFormData({ ...formData, tipo_contrato: value });
                }}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recorrente">Recorrente</SelectItem>
                  <SelectItem value="unico">Único</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Data de Início *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !formData.data_inicio && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.data_inicio ? (
                      format(formData.data_inicio, 'dd/MM/yyyy')
                    ) : (
                      <span>Selecione a data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.data_inicio}
                    onSelect={(date) => setFormData({ ...formData, data_inicio: date })}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

            <div>
              <Label>Data de Encerramento</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={formData.status === 'ativo'}
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !formData.data_encerramento && 'text-muted-foreground'
                    )}
                    onClick={() => {
                      if (formData.status === 'ativo') {
                        toast.info('Não é possível definir data de encerramento para cliente com status Ativo');
                      }
                    }}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.data_encerramento ? (
                      format(formData.data_encerramento, 'dd/MM/yyyy')
                    ) : (
                      <span>Selecione a data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                {formData.status !== 'ativo' && (
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.data_encerramento}
                      onSelect={(date) => setFormData({ ...formData, data_encerramento: date })}
                      disabled={(date) => formData.data_inicio ? date < formData.data_inicio : false}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                )}
              </Popover>
            </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {cliente ? 'Salvar Alterações' : 'Criar Cliente'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <AlertDialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Descartar Alterações?</AlertDialogTitle>
          <AlertDialogDescription>
            Você tem alterações não salvas. Tem certeza que deseja sair sem salvar?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Continuar Editando</AlertDialogCancel>
          <AlertDialogAction onClick={confirmClose}>
            Sair sem Salvar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <AlertDialog open={showSaveConfirm} onOpenChange={setShowSaveConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Alterações</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja salvar as alterações realizadas?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={() => {
            const valorNumerico = formData.valor_projeto 
              ? parseFloat(formData.valor_projeto.replace(/\./g, '').replace(',', '.'))
              : 0;
            let siteNormalizado = formData.site;
            if (siteNormalizado && !siteNormalizado.match(/^https?:\/\//)) {
              siteNormalizado = 'https://' + siteNormalizado;
            }
            submitData(valorNumerico, siteNormalizado);
          }}>
            Confirmar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};