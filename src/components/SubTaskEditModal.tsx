import React, { useState, useEffect } from 'react';
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
import { useEmpresas } from '@/hooks/useEmpresas';
import { useTarefas } from '@/hooks/useTarefas';
import { usePerfis } from '@/hooks/usePerfis';
import { useResponsaveisTarefa } from '@/hooks/useResponsaveisTarefa';
import type { Enums } from '@/integrations/supabase/types';

type StatusTarefa = Enums<'status_tarefa'>;
type PrioridadeTarefa = Enums<'prioridade_tarefa'>;

interface SubTaskEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtask: any;
  parentTask: any;
  onSuccess: () => void;
  hasUnsavedChanges?: boolean;
  setHasUnsavedChanges?: (hasChanges: boolean) => void;
}

const SubTaskEditModal: React.FC<SubTaskEditModalProps> = ({
  isOpen,
  onClose,
  subtask,
  parentTask,
  onSuccess,
  hasUnsavedChanges,
  setHasUnsavedChanges
}) => {
  const { perfil } = useAuthContext();
  const { empresas } = useEmpresas();
  const { atualizarTarefa } = useTarefas();
  const { perfisEquipe } = usePerfis();
  const { responsaveis, atualizarResponsaveis } = useResponsaveisTarefa(subtask?.id);
  
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    status: 'pode_fazer' as StatusTarefa,
    prioridade: 'media' as PrioridadeTarefa,
    data_entrega: '',
    data_inicio: '',
    responsaveis: [] as string[]
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showResponsaveisSelector, setShowResponsaveisSelector] = useState(false);
  const [initialFormData, setInitialFormData] = useState(null);

  useEffect(() => {
    if (subtask) {
      const newFormData = {
        titulo: subtask.titulo || '',
        descricao: subtask.descricao || '',
        status: subtask.status || 'pode_fazer',
        prioridade: subtask.prioridade || 'media',
        data_entrega: subtask.data_entrega ? subtask.data_entrega.slice(0, 16) : '',
        data_inicio: subtask.data_inicio ? subtask.data_inicio.slice(0, 16) : '',
        responsaveis: responsaveis?.map(r => r.responsavel_id) || []
      };
      setFormData(newFormData);
      setInitialFormData(newFormData);
    }
  }, [subtask, responsaveis]);

  // Check for unsaved changes
  useEffect(() => {
    if (initialFormData && setHasUnsavedChanges) {
      const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialFormData);
      setHasUnsavedChanges(hasChanges);
    }
  }, [formData, initialFormData, setHasUnsavedChanges]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.titulo.trim()) {
      toast.error('Título é obrigatório');
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
    if (formData.data_entrega && !parentTask?.data_entrega) {
      toast.error('Não é possível definir data de entrega na subtarefa pois a tarefa principal não possui data de entrega definida.');
      return;
    }

    // Validação: subtarefa não pode ter data de entrega superior à tarefa principal
    if (formData.data_entrega && parentTask?.data_entrega) {
      const subtaskDate = new Date(formData.data_entrega);
      const parentDate = new Date(parentTask.data_entrega);
      
      if (subtaskDate > parentDate) {
        toast.error('A data de entrega da subtarefa não pode ser posterior à data de entrega da tarefa principal.');
        return;
      }
    }

    setIsLoading(true);

    try {
      await atualizarTarefa({
        id: subtask.id,
        titulo: formData.titulo.trim().toUpperCase(),
        descricao: formData.descricao.trim() || null,
        status: formData.status,
        prioridade: formData.prioridade,
        data_entrega: formData.data_entrega || null,
        data_inicio: formData.data_inicio || null
      });

      // Atualizar responsáveis
      await atualizarResponsaveis({
        tarefaId: subtask.id,
        responsaveisIds: formData.responsaveis
      });

      toast.success('Subtarefa atualizada com sucesso!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar subtarefa:', error);
      toast.error('Erro ao atualizar subtarefa. Verifique os dados e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('Você tem alterações não salvas. Deseja sair sem salvar?')) {
        setShowResponsaveisSelector(false);
        onClose();
      }
    } else {
      setShowResponsaveisSelector(false);
      onClose();
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

  if (!subtask) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Subtarefa</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Tarefa principal: {parentTask?.titulo}
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value.toUpperCase() }))}
              placeholder="Digite o título da subtarefa"
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
              placeholder="Digite a descrição da subtarefa (opcional)"
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
                    const timeValue = formData.data_inicio ? formData.data_inicio.slice(11) : '00:00';
                    const newValue = e.target.value ? `${e.target.value}T${timeValue}` : '';
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
                    const timeValue = formData.data_entrega ? formData.data_entrega.slice(11) : '00:00';
                    const newValue = e.target.value ? `${e.target.value}T${timeValue}` : '';
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

          {/* Task Information */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/20 rounded-lg">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Informações da Subtarefa</Label>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">
                  <strong>Criado por:</strong> {perfisEquipe.find(p => p.id === subtask.criado_por)?.nome_completo || 'Usuário'}
                </div>
                <div className="text-xs text-muted-foreground">
                  <strong>Criado em:</strong> {subtask.criado_em ? new Date(subtask.criado_em).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'N/A'}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Última Atualização</Label>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">
                  <strong>Atualizado em:</strong> {subtask.atualizado_em ? new Date(subtask.atualizado_em).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SubTaskEditModal;