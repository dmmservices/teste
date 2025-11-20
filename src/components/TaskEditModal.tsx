
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import TaskCommentsSection from '@/components/TaskCommentsSection';
import { toast } from 'sonner';
import { useAuthContext } from '@/contexts/AuthContext';
import { useEmpresas } from '@/hooks/useEmpresas';
import { useTarefas } from '@/hooks/useTarefas';
import { usePerfis } from '@/hooks/usePerfis';
import { useComentariosTarefa } from '@/hooks/useComentariosTarefa';
import { useResponsaveisTarefa } from '@/hooks/useResponsaveisTarefa';
import RichTextEditor from '@/components/RichTextEditor';
import type { Enums } from '@/integrations/supabase/types';

type StatusTarefa = Enums<'status_tarefa'>;
type PrioridadeTarefa = Enums<'prioridade_tarefa'>;

interface TaskEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: any;
  onSuccess: () => void;
}

const TaskEditModal: React.FC<TaskEditModalProps> = ({
  isOpen,
  onClose,
  task,
  onSuccess
}) => {
  const { perfil } = useAuthContext();
  const { empresas } = useEmpresas();
  const { atualizarTarefa } = useTarefas();
  const { perfisEquipe } = usePerfis();
  const { comentarios, criarComentario, deletarComentario } = useComentariosTarefa(task?.id);
  const { responsaveis, atualizarResponsaveis } = useResponsaveisTarefa(task?.id);
  
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    status: 'pode_fazer' as StatusTarefa,
    prioridade: 'media' as PrioridadeTarefa,
    empresa_id: '',
    data_entrega: '',
    data_inicio: '',
    responsaveis: [] as string[]
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showResponsaveisSelector, setShowResponsaveisSelector] = useState(false);
  const [initialFormData, setInitialFormData] = useState(null);

  useEffect(() => {
    if (task) {
      const newFormData = {
        titulo: task.titulo || '',
        descricao: task.descricao || '',
        status: task.status || 'pode_fazer',
        prioridade: task.prioridade || 'media',
        empresa_id: task.empresa_id || '',
        data_entrega: task.data_entrega ? task.data_entrega.slice(0, 16) : '',
        data_inicio: task.data_inicio ? task.data_inicio.slice(0, 16) : '',
        responsaveis: responsaveis?.map(r => r.responsavel_id) || []
      };
      setFormData(newFormData);
      setInitialFormData(newFormData);
    }
  }, [task, responsaveis]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.titulo.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    // Validação: não permitir mudar para concluído sem data de entrega
    if (formData.status === 'concluido' && !formData.data_entrega) {
      toast.error('Não é possível marcar como concluída sem uma data de entrega definida');
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

    setIsLoading(true);

    try {
      // Prepare dates with default times if needed
      let dataInicio = formData.data_inicio;
      let dataEntrega = formData.data_entrega;

      // Set default time for start date (09:00) if only date is provided
      if (dataInicio && dataInicio.length === 16 && !dataInicio.endsWith('00:00')) {
        // If it doesn't have a time set, add default
        const currentTime = dataInicio.slice(11);
        if (currentTime === '00:00') {
          dataInicio = dataInicio.slice(0, 11) + '09:00';
        }
      }

      // Set default time for delivery date (23:59) if only date is provided
      if (dataEntrega && dataEntrega.length === 16 && !dataEntrega.endsWith('23:59')) {
        const currentTime = dataEntrega.slice(11);
        if (currentTime === '00:00') {
          dataEntrega = dataEntrega.slice(0, 11) + '23:59';
        }
      }

      await atualizarTarefa({
        id: task.id,
        titulo: formData.titulo.trim().toUpperCase(),
        descricao: formData.descricao.trim() || null,
        status: formData.status,
        prioridade: formData.prioridade,
        empresa_id: formData.empresa_id,
        data_entrega: dataEntrega || null,
        data_inicio: dataInicio || null
      });

      // Atualizar responsáveis
      await atualizarResponsaveis({
        tarefaId: task.id,
        responsaveisIds: formData.responsaveis
      });

      toast.success('Tarefa atualizada com sucesso!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      toast.error('Erro ao atualizar tarefa. Verifique os dados e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (initialFormData && JSON.stringify(formData) !== JSON.stringify(initialFormData)) {
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

  const handleAddComment = async (comment: { text: string; author: string; authorAvatar: string; attachments?: any[] }) => {
    if (!perfil?.id || !task?.id) return;

    try {
      await criarComentario({
        tarefa_id: task.id,
        autor_id: perfil.id,
        comentario: comment.text,
        anexos: comment.attachments || []
      });
      // Não precisa fazer nada aqui, o useQuery irá revalidar automaticamente
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      toast.error('Erro ao adicionar comentário');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deletarComentario(commentId);
      // Não precisa fazer nada aqui, o useQuery irá revalidar automaticamente
    } catch (error) {
      console.error('Erro ao deletar comentário:', error);
      toast.error('Erro ao deletar comentário');
    }
  };

  // Transformar comentários para o formato esperado pelo TaskCommentsSection
  const transformedComments = comentarios.map(comentario => ({
    id: comentario.id,
    text: comentario.comentario,
    author: comentario.autor_perfil?.nome_completo || 'Usuário',
    authorAvatar: comentario.autor_perfil?.url_avatar || '',
    date: comentario.criado_em,
    attachments: comentario.anexos || []
  }));

  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Tarefa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value.toUpperCase() }))}
              placeholder="Digite o título da tarefa"
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
              placeholder="Digite a descrição da tarefa (opcional)"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: StatusTarefa) => 
                  setFormData(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
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
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
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
            </div>
          </div>

          {/* Task Information */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/20 rounded-lg">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Informações da Tarefa</Label>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">
                  <strong>Criado por:</strong> {perfisEquipe.find(p => p.id === task.criado_por)?.nome_completo || 'Usuário'}
                </div>
                <div className="text-xs text-muted-foreground">
                  <strong>Criado em:</strong> {task.criado_em ? new Date(task.criado_em).toLocaleDateString('pt-BR', {
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
                  <strong>Atualizado em:</strong> {task.atualizado_em ? new Date(task.atualizado_em).toLocaleDateString('pt-BR', {
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

          <div className="space-y-2">
            <Label>Comentários</Label>
            <TaskCommentsSection
              comments={transformedComments}
              onAddComment={handleAddComment}
              onDeleteComment={handleDeleteComment}
              currentUser={{
                id: perfil?.id || '',
                name: perfil?.nome_completo || '',
                avatar: perfil?.url_avatar || ''
              }}
            />
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

export default TaskEditModal;
