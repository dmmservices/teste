
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useAuthContext } from '@/contexts/AuthContext';
import { useEmpresas } from '@/hooks/useEmpresas';
import { useTarefas } from '@/hooks/useTarefas';
import { usePerfis } from '@/hooks/usePerfis';
import RichTextEditor from '@/components/RichTextEditor';
import type { Enums } from '@/integrations/supabase/types';

type StatusTarefa = Enums<'status_tarefa'>;
type PrioridadeTarefa = Enums<'prioridade_tarefa'>;

interface TeamTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const TeamTaskModal: React.FC<TeamTaskModalProps> = ({
  isOpen,
  onClose,
  onSuccess
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
          toast.error('Tarefa criada, mas houve erro ao adicionar responsáveis');
        }
      }

      toast.success('Tarefa criada com sucesso!');
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
      console.error('Erro ao criar tarefa:', error);
      toast.error('Erro ao criar tarefa. Verifique os dados e tente novamente.');
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Tarefa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <Label htmlFor="empresa">Empresa *</Label>
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
                  <SelectItem value="pode_fazer">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-slate-500"></div>
                      Poderia Fazer
                    </div>
                  </SelectItem>
                  <SelectItem value="deve_fazer">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                      Devemos Fazer
                    </div>
                  </SelectItem>
                  <SelectItem value="pronto_fazer">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-pink-500"></div>
                      Pronto para Fazer
                    </div>
                  </SelectItem>
                  <SelectItem value="em_andamento">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                      Em Progresso
                    </div>
                  </SelectItem>
                  <SelectItem value="em_revisao">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                      Em Revisão
                    </div>
                  </SelectItem>
                  <SelectItem value="recorrente">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                      Recorrente
                    </div>
                  </SelectItem>
                  <SelectItem value="concluido">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      Concluído
                    </div>
                  </SelectItem>
                  <SelectItem value="rejeitado">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      Rejeitado
                    </div>
                  </SelectItem>
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
                  <SelectItem value="baixa">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      Baixa
                    </div>
                  </SelectItem>
                  <SelectItem value="media">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                      Média
                    </div>
                  </SelectItem>
                  <SelectItem value="alta">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      Alta
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data_inicio">Data de Início</Label>
              <Input
                id="data_inicio"
                type="date"
                value={formData.data_inicio ? formData.data_inicio.slice(0, 10) : ''}
                onChange={(e) => {
                  const newValue = e.target.value ? `${e.target.value}T09:00` : '';
                  setFormData(prev => ({ ...prev, data_inicio: newValue }));
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_entrega">Data de Entrega</Label>
              <Input
                id="data_entrega"
                type="date"
                value={formData.data_entrega ? formData.data_entrega.slice(0, 10) : ''}
                onChange={(e) => {
                  const newValue = e.target.value ? `${e.target.value}T23:59` : '';
                  setFormData(prev => ({ ...prev, data_entrega: newValue }));
                }}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-green-500 hover:bg-green-600">
              {isLoading ? 'Salvando...' : 'Criar Tarefa'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TeamTaskModal;
