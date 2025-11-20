import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import RichTextEditor from '@/components/RichTextEditor';
import { useAuthContext } from '@/contexts/AuthContext';
import { useEmpresas } from '@/hooks/useEmpresas';
import { useTarefas } from '@/hooks/useTarefas';
import { usePerfis } from '@/hooks/usePerfis';
import type { Enums } from '@/integrations/supabase/types';

type StatusTarefa = Enums<'status_tarefa'>;
type PrioridadeTarefa = Enums<'prioridade_tarefa'>;

interface DuplicateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  task: any;
}

const DuplicateTaskModal: React.FC<DuplicateTaskModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  task
}) => {
  const { perfil } = useAuthContext();
  const { empresas } = useEmpresas();
  const { criarTarefa } = useTarefas();
  const { perfisEquipe } = usePerfis();
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    status: '' as StatusTarefa | '',
    prioridade: '' as PrioridadeTarefa | '',
    empresa_id: '',
    data_entrega: '',
    data_inicio: '',
    responsaveis: [] as string[]
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showResponsaveisSelector, setShowResponsaveisSelector] = useState(false);

  useEffect(() => {
    if (task && isOpen) {
      setFormData({
        titulo: task.titulo || '',
        descricao: task.descricao || '',
        status: task.status || '',
        prioridade: task.prioridade || '',
        empresa_id: '', // Deixar vazio para forçar seleção
        data_entrega: task.data_entrega ? task.data_entrega.slice(0, 16) : '',
        data_inicio: task.data_inicio ? task.data_inicio.slice(0, 16) : '',
        responsaveis: []
      });
    }
  }, [task, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.empresa_id) {
      toast.error('Selecione uma empresa');
      return;
    }

    if (!formData.titulo.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    if (!formData.status) {
      toast.error('Status é obrigatório');
      return;
    }

    if (!formData.prioridade) {
      toast.error('Prioridade é obrigatória');
      return;
    }

    setIsLoading(true);

    try {
      // Prepare dates with default times
      let dataInicio = formData.data_inicio;
      let dataEntrega = formData.data_entrega;

      // Set default time for start date (09:00) if only date is provided
      if (dataInicio && !dataInicio.includes('T')) {
        dataInicio = `${dataInicio}T09:00`;
      }

      // Set default time for delivery date (23:59) if only date is provided
      if (dataEntrega && !dataEntrega.includes('T')) {
        dataEntrega = `${dataEntrega}T23:59`;
      }

      // Create the task first
      const novaTarefa = await criarTarefa({
        titulo: formData.titulo.trim().toUpperCase(),
        descricao: formData.descricao.trim() || null,
        status: formData.status as StatusTarefa,
        prioridade: formData.prioridade as PrioridadeTarefa,
        empresa_id: formData.empresa_id,
        data_entrega: dataEntrega || null,
        data_inicio: dataInicio || null,
        criado_por: perfil?.id || ''
      });

      // Now add the responsaveis to the task if any were selected
      if (formData.responsaveis.length > 0 && novaTarefa) {
        const { supabase } = await import('@/integrations/supabase/client');
        
        const responsaveisInserts = formData.responsaveis.map(responsavelId => ({
          tarefa_id: novaTarefa.id,
          responsavel_id: responsavelId
        }));

        const { error: responsaveisError } = await supabase
          .from('tarefa_responsaveis')
          .insert(responsaveisInserts);

        if (responsaveisError) {
          console.error('Erro ao adicionar responsáveis:', responsaveisError);
          toast.error('Tarefa duplicada, mas houve erro ao adicionar responsáveis');
        }
      }

      toast.success('Tarefa duplicada com sucesso!');
      setFormData({ 
        titulo: '', 
        descricao: '', 
        status: '', 
        prioridade: '', 
        empresa_id: '',
        data_entrega: '',
        data_inicio: '',
        responsaveis: []
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao duplicar tarefa:', error);
      toast.error('Erro ao duplicar tarefa. Verifique os dados e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ 
      titulo: '', 
      descricao: '', 
      status: '', 
      prioridade: '', 
      empresa_id: '',
      data_entrega: '',
      data_inicio: '',
      responsaveis: []
    });
    setShowResponsaveisSelector(false);
    onClose();
  };

  const toggleResponsavel = (responsavelId: string) => {
    setFormData(prev => ({
      ...prev,
      responsaveis: prev.responsaveis.includes(responsavelId)
        ? prev.responsaveis.filter(id => id !== responsavelId)
        : [...prev.responsaveis, responsavelId]
    }));
  };

  const getSelectedResponsaveis = () => {
    return perfisEquipe.filter(perfil => formData.responsaveis.includes(perfil.id));
  };

  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Duplicar Tarefa</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Selecione a empresa de destino para duplicar esta tarefa
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2 bg-muted/30 p-4 rounded-lg">
            <Label className="text-sm font-medium">Empresa de Destino *</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Selecione a empresa para onde deseja duplicar a tarefa
            </p>
            <Select
              value={formData.empresa_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, empresa_id: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma empresa" />
              </SelectTrigger>
              <SelectContent>
                {empresas.map((empresa) => (
                  <SelectItem key={empresa.id} value={empresa.id}>
                    {empresa.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value.toUpperCase() }))}
              placeholder="Título da tarefa"
              className="uppercase"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Responsáveis</Label>
            {!showResponsaveisSelector ? (
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start text-muted-foreground"
                onClick={() => setShowResponsaveisSelector(true)}
              >
                + Selecionar responsáveis ({formData.responsaveis.length} selecionados)
              </Button>
            ) : (
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-medium">Selecionar Responsáveis</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowResponsaveisSelector(false)}
                  >
                    Fechar
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                  {perfisEquipe.map((perfil) => (
                    <div key={perfil.id} className="flex items-center space-x-3">
                      <Checkbox
                        id={`responsavel-${perfil.id}`}
                        checked={formData.responsaveis.includes(perfil.id)}
                        onCheckedChange={() => toggleResponsavel(perfil.id)}
                      />
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={perfil.url_avatar || ''} alt={perfil.nome_completo} />
                        <AvatarFallback className="text-xs">
                          {perfil.nome_completo.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <Label 
                        htmlFor={`responsavel-${perfil.id}`}
                        className="text-sm cursor-pointer flex-1"
                      >
                        {perfil.nome_completo}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {formData.responsaveis.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {getSelectedResponsaveis().map((responsavel) => (
                  <div key={responsavel.id} className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={responsavel.url_avatar || ''} alt={responsavel.nome_completo} />
                      <AvatarFallback className="text-xs">
                        {responsavel.nome_completo.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    {responsavel.nome_completo}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <RichTextEditor
              value={formData.descricao}
              onChange={(value) => setFormData(prev => ({ ...prev, descricao: value }))}
              placeholder="Detalhes da tarefa"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value: StatusTarefa) => 
                  setFormData(prev => ({ ...prev, status: value }))
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pode_fazer">Poderia Fazer</SelectItem>
                  <SelectItem value="deve_fazer">Devemos Fazer</SelectItem>
                  <SelectItem value="pronto_fazer">Pronto para Fazer</SelectItem>
                  <SelectItem value="em_andamento">Em Progresso</SelectItem>
                  <SelectItem value="em_revisao">Em Revisão</SelectItem>
                  <SelectItem value="recorrente">Recorrente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prioridade">Prioridade *</Label>
              <Select
                value={formData.prioridade}
                onValueChange={(value: PrioridadeTarefa) => 
                  setFormData(prev => ({ ...prev, prioridade: value }))
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data_inicio">Data e Hora de Início</Label>
              <Input
                id="data_inicio"
                type="datetime-local"
                value={formData.data_inicio}
                onChange={(e) => {
                  let value = e.target.value;
                  if (value && value.length === 16 && value.endsWith('00:00')) {
                    value = value.slice(0, 11) + '09:00';
                  }
                  setFormData(prev => ({ ...prev, data_inicio: value }));
                }}
                step="1800"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_entrega">Data e Hora de Entrega</Label>
              <Input
                id="data_entrega"
                type="datetime-local"
                value={formData.data_entrega}
                onChange={(e) => {
                  let value = e.target.value;
                  if (value && value.length === 16 && value.endsWith('00:00')) {
                    value = value.slice(0, 11) + '23:59';
                  }
                  setFormData(prev => ({ ...prev, data_entrega: value }));
                }}
                step="1800"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-blue-500 hover:bg-blue-600">
              {isLoading ? 'Duplicando...' : 'Duplicar Tarefa'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DuplicateTaskModal;
