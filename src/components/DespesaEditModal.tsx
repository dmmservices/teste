import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import type { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type Despesa = Tables<'despesas'>;

interface DespesaEditModalProps {
  open: boolean;
  onClose: () => void;
  despesa?: Despesa | null;
  onSave: (despesa: any) => void;
  isFixedExpense?: boolean;
}

const tipoOptions = [
  'Imposto',
  'Ferramenta digital',
  'Ferramenta Física',
  'Educacional',
  'Marketing',
  'Mão de obra',
  'Fundo de Oferta',
];

const frequenciaOptions = [
  'Semanal',
  'Quinzenal',
  'Mensal',
  'Trimestral',
  'Semestral',
  'Anual',
];

export const DespesaEditModal: React.FC<DespesaEditModalProps> = ({
  open,
  onClose,
  despesa,
  onSave,
  isFixedExpense = false
}) => {
  const [formData, setFormData] = useState({
    nome: '',
    tipo: '',
    data_pagamento: '',
    meio_pagamento: '',
    valor_unitario: '',
    quantidade: '1',
    recorrente: false,
    data_inicio: '',
    data_fim: '',
    frequencia_recorrencia: 'Mensal',
    notas: '',
  });

  useEffect(() => {
    if (despesa) {
      setFormData({
        nome: despesa.nome || '',
        tipo: despesa.tipo || '',
        data_pagamento: despesa.data_pagamento || '',
        meio_pagamento: despesa.meio_pagamento || '',
        valor_unitario: despesa.valor_unitario?.toString() || '',
        quantidade: despesa.quantidade?.toString() || '1',
        recorrente: despesa.recorrente || false,
        data_inicio: despesa.data_inicio || '',
        data_fim: despesa.data_fim || '',
        frequencia_recorrencia: despesa.frequencia_recorrencia || 'Mensal',
        notas: despesa.notas || '',
      });
    } else {
      setFormData({
        nome: '',
        tipo: '',
        data_pagamento: '',
        meio_pagamento: '',
        valor_unitario: '',
        quantidade: '1',
        recorrente: false,
        data_inicio: '',
        data_fim: '',
        frequencia_recorrencia: 'Mensal',
        notas: '',
      });
    }
  }, [despesa, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome.trim()) {
      toast.error('O nome é obrigatório');
      return;
    }

    if (!formData.tipo) {
      toast.error('O tipo é obrigatório');
      return;
    }

    if (!formData.data_pagamento && !formData.recorrente) {
      toast.error('A data de pagamento é obrigatória');
      return;
    }

    if (formData.recorrente && !formData.data_inicio) {
      toast.error('A data de início é obrigatória para despesas recorrentes');
      return;
    }

    if (!formData.meio_pagamento) {
      toast.error('O meio de pagamento é obrigatório');
      return;
    }

    if (!formData.valor_unitario || parseFloat(formData.valor_unitario) <= 0) {
      toast.error('O valor unitário deve ser maior que zero');
      return;
    }

    if (!formData.quantidade || parseInt(formData.quantidade) <= 0) {
      toast.error('A quantidade deve ser maior que zero');
      return;
    }

    onSave({
      ...formData,
      valor_unitario: parseFloat(formData.valor_unitario),
      quantidade: parseInt(formData.quantidade),
      data_pagamento: formData.recorrente ? null : formData.data_pagamento,
      data_inicio: formData.recorrente ? formData.data_inicio : null,
      data_fim: formData.recorrente ? formData.data_fim || null : null,
      frequencia_recorrencia: formData.recorrente ? formData.frequencia_recorrencia : null,
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {despesa ? 'Editar Despesa' : 'Nova Despesa'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="nome">Nome da Despesa *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Licença Adobe Creative Cloud"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tipo">Tipo *</Label>
                <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                  <SelectTrigger id="tipo">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tipoOptions.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="meio_pagamento">Meio de Pagamento *</Label>
                <Select value={formData.meio_pagamento} onValueChange={(value) => setFormData({ ...formData, meio_pagamento: value })}>
                  <SelectTrigger id="meio_pagamento">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pix">Pix</SelectItem>
                    <SelectItem value="Boleto">Boleto</SelectItem>
                    <SelectItem value="Cartão">Cartão</SelectItem>
                    <SelectItem value="Transferência">Transferência</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="valor_unitario">Valor Unitário (R$) *</Label>
                <Input
                  id="valor_unitario"
                  type="number"
                  step="0.01"
                  value={formData.valor_unitario}
                  onChange={(e) => setFormData({ ...formData, valor_unitario: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <Label htmlFor="quantidade">Quantidade *</Label>
                <Input
                  id="quantidade"
                  type="number"
                  value={formData.quantidade}
                  onChange={(e) => setFormData({ ...formData, quantidade: e.target.value })}
                  placeholder="1"
                  required
                />
              </div>
            </div>

            {isFixedExpense && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="recorrente"
                  checked={true}
                  disabled
                />
                <Label htmlFor="recorrente" className="cursor-pointer text-muted-foreground">
                  Despesa Fixa (Recorrente)
                </Label>
              </div>
            )}

            {isFixedExpense ? (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="data_inicio">Data de Início *</Label>
                    <Input
                      id="data_inicio"
                      type="date"
                      value={formData.data_inicio}
                      onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="data_fim">Data de Fim</Label>
                    <Input
                      id="data_fim"
                      type="date"
                      value={formData.data_fim}
                      onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="frequencia">Frequência *</Label>
                    <Select value={formData.frequencia_recorrencia} onValueChange={(value) => setFormData({ ...formData, frequencia_recorrencia: value })}>
                      <SelectTrigger id="frequencia">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {frequenciaOptions.map((freq) => (
                          <SelectItem key={freq} value={freq}>
                            {freq}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            ) : !isFixedExpense ? (
              <div>
                <Label htmlFor="data_pagamento">Data de Pagamento *</Label>
                <Input
                  id="data_pagamento"
                  type="date"
                  value={formData.data_pagamento}
                  onChange={(e) => setFormData({ ...formData, data_pagamento: e.target.value })}
                  required
                />
              </div>
            ) : null}

            <div>
              <Label htmlFor="notas">Notas</Label>
              <Textarea
                id="notas"
                value={formData.notas}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                rows={3}
                placeholder="Informações adicionais..."
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">
                {despesa ? 'Salvar' : 'Adicionar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
