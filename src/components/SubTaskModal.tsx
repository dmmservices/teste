import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import RichTextEditor from '@/components/RichTextEditor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useAuthContext } from '@/contexts/AuthContext';
import { useTarefas } from '@/hooks/useTarefas';
import { usePerfis } from '@/hooks/usePerfis';
import { supabase } from '@/integrations/supabase/client';
import type { Enums } from '@/integrations/supabase/types';

type PrioridadeTarefa = Enums<'prioridade_tarefa'>;

interface SubTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  parentTask: {
    id: string;
    titulo: string;
    empresa_id: string;
    data_entrega?: string;
  } | null;
}

const SubTaskModal: React.FC<SubTaskModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  parentTask
}) => {
  const { perfil } = useAuthContext();
  const { criarTarefa } = useTarefas();
  const { perfisEquipe } = usePerfis();
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    prioridade: 'media' as PrioridadeTarefa,
    data_entrega: '',
    data_inicio: '',
    responsaveis: [] as string[]
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showResponsaveisSelector, setShowResponsaveisSelector] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.titulo.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    if (!parentTask) {
      toast.error('Tarefa pai não encontrada');
      return;
    }

    // Validação de datas
    if (formData.data_inicio && formData.data_entrega) {
      const dataInicio = new Date(formData.data_inicio);
      const dataEntrega = new Date(formData.data_entrega);
      
      if (dataInicio > dataEntrega) {
        toast.error('A data de início não pode ser posterior à data de entrega');
        return;
      }
    }

    // Validação: verificar se a tarefa principal tem data de entrega
    if (formData.data_entrega && !parentTask.data_entrega) {
      toast.error('Não é possível definir data de entrega na subtarefa pois a tarefa principal não possui data de entrega definida.');
      return;
    }

    // Validação: subtarefa não pode ter data de entrega superior à tarefa principal
    if (formData.data_entrega && parentTask.data_entrega) {
      const subtaskDate = new Date(formData.data_entrega);
      const parentDate = new Date(parentTask.data_entrega);
      
      if (subtaskDate > parentDate) {
        toast.error('A data de entrega da subtarefa não pode ser posterior à data de entrega da tarefa principal.');
        return;
      }
    }

    setIsLoading(true);

    try {
      // Obter a maior ordem_subtarefa existente para a tarefa pai
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: existingSubtasks } = await supabase
        .from('tarefas')
        .select('ordem_subtarefa')
        .eq('tarefa_pai_id', parentTask.id)
        .order('ordem_subtarefa', { ascending: false })
        .limit(1);

      const nextOrder = existingSubtasks && existingSubtasks.length > 0 
        ? (existingSubtasks[0].ordem_subtarefa || 0) + 1 
        : 0;

      const novaTarefa = await criarTarefa({
        titulo: formData.titulo.trim().toUpperCase(),
        descricao: formData.descricao.trim() || null,
        status: 'pode_fazer',
        prioridade: formData.prioridade,
        empresa_id: parentTask.empresa_id,
        data_entrega: formData.data_entrega || null,
        data_inicio: formData.data_inicio || null,
        criado_por: perfil?.id || '',
        tipo: 'subtarefa',
        tarefa_pai_id: parentTask.id,
        ordem_subtarefa: nextOrder
      });

      // Atualizar responsáveis se houver
      if (formData.responsaveis.length > 0 && novaTarefa) {
        const responsaveisInserts = formData.responsaveis.map(responsavelId => ({
          tarefa_id: novaTarefa.id,
          responsavel_id: responsavelId
        }));

        const { error: responsaveisError } = await supabase
          .from('tarefa_responsaveis')
          .insert(responsaveisInserts);

        if (responsaveisError) {
          console.error('Erro ao adicionar responsáveis:', responsaveisError);
          toast.error('Subtarefa criada, mas houve erro ao adicionar responsáveis');
        }
      }

      toast.success('Subtarefa criada com sucesso!');
      setFormData({ 
        titulo: '', 
        descricao: '', 
        prioridade: 'media',
        data_entrega: '',
        data_inicio: '',
        responsaveis: []
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao criar subtarefa:', error);
      toast.error('Erro ao criar subtarefa. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
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

  const handleClose = () => {
    setFormData({ 
      titulo: '', 
      descricao: '', 
      prioridade: 'media',
      data_entrega: '',
      data_inicio: '',
      responsaveis: []
    });
    setShowResponsaveisSelector(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Subtarefa</DialogTitle>
          {parentTask && (
            <p className="text-sm text-muted-foreground">
              Para a tarefa: {parentTask.titulo}
            </p>
          )}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value.toUpperCase() }))}
              placeholder="Título da subtarefa"
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
              placeholder="Detalhes da subtarefa"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prioridade">Prioridade</Label>
            <Select
              value={formData.prioridade}
              onValueChange={(value: PrioridadeTarefa) => 
                setFormData(prev => ({ ...prev, prioridade: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data_inicio">Data de Início</Label>
              <div className="flex gap-2">
                <Input
                  id="data_inicio"
                  type="date"
                  value={formData.data_inicio ? formData.data_inicio.slice(0, 10) : ''}
                  onChange={(e) => {
                    const newValue = e.target.value ? `${e.target.value}T09:00` : '';
                    setFormData(prev => ({ ...prev, data_inicio: newValue }));
                  }}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData(prev => ({ ...prev, data_inicio: '' }))}
                  className="px-3"
                >
                  Limpar
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_entrega">Data de Entrega</Label>
              <div className="flex gap-2">
                <Input
                  id="data_entrega"
                  type="date"
                  value={formData.data_entrega ? formData.data_entrega.slice(0, 10) : ''}
                  onChange={(e) => {
                    const newValue = e.target.value ? `${e.target.value}T23:59` : '';
                    setFormData(prev => ({ ...prev, data_entrega: newValue }));
                  }}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData(prev => ({ ...prev, data_entrega: '' }))}
                  className="px-3"
                >
                  Limpar
                </Button>
              </div>
              {parentTask?.data_entrega && (
                <p className="text-xs text-muted-foreground">
                  Data limite da tarefa principal: {new Date(parentTask.data_entrega).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit', 
                    year: 'numeric'
                  })}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-green-500 hover:bg-green-600">
              {isLoading ? 'Salvando...' : 'Criar Subtarefa'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SubTaskModal;