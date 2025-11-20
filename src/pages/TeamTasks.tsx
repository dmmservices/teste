import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Calendar, Building2, ChevronDown, ChevronUp, Users, Plus, Edit, Trash2, Check, X, GripVertical, Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import DashboardSidebar from '@/components/DashboardSidebar';
import TeamTaskModal from '@/components/TeamTaskModal';
import TaskEditModal from '@/components/TaskEditModal';
import SubTaskModal from '@/components/SubTaskModal';
import SubTaskEditModal from '@/components/SubTaskEditModal';
import DuplicateTaskModal from '@/components/DuplicateTaskModal';
import DuplicateSubTaskModal from '@/components/DuplicateSubTaskModal';
import { useTarefas } from '@/hooks/useTarefas';
import { usePerfis } from '@/hooks/usePerfis';
import { useEmpresas } from '@/hooks/useEmpresas';
import { useResponsaveisTarefa } from '@/hooks/useResponsaveisTarefa';
import type { Enums } from '@/integrations/supabase/types';
type StatusTarefa = Enums<'status_tarefa'>;
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
const TeamTasks = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isTeamTaskModalOpen, setIsTeamTaskModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubTaskModalOpen, setIsSubTaskModalOpen] = useState(false);
  const [isSubTaskEditModalOpen, setIsSubTaskEditModalOpen] = useState(false);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [isDuplicateSubTaskModalOpen, setIsDuplicateSubTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedSubTask, setSelectedSubTask] = useState(null);
  const [selectedParentTask, setSelectedParentTask] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);

  // Delete confirmation modal states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isDeleteSubtaskDialogOpen, setIsDeleteSubtaskDialogOpen] = useState(false);
  const [subtaskToDelete, setSubtaskToDelete] = useState(null);

  // Filter states
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [selectedResponsible, setSelectedResponsible] = useState('all');
  const [selectedStartDate, setSelectedStartDate] = useState('all');
  const [selectedDeliveryDate, setSelectedDeliveryDate] = useState('all');
  const [expandedSections, setExpandedSections] = useState({
    pode_fazer: true,
    deve_fazer: true,
    pronto_fazer: true,
    em_andamento: true,
    em_revisao: true,
    recorrente: true,
    concluido: false,
    rejeitado: false
  });

  // Global state for expanded subtasks per task
  const [globalExpandedSubtasks, setGlobalExpandedSubtasks] = useState({});
  const {
    tarefas,
    isLoading,
    atualizarTarefa,
    excluirTarefa,
    reordenarSubtarefas,
    isDeleting,
    isReordering
  } = useTarefas();
  const {
    perfisEquipe
  } = usePerfis();
  const {
    empresas
  } = useEmpresas();
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates
  }));
  const handleDragEnd = async (event, subtasks, setSubtasks, parentTaskId) => {
    const {
      active,
      over
    } = event;
    if (active.id !== over?.id) {
      const oldIndex = subtasks.findIndex(item => item.id === active.id);
      const newIndex = subtasks.findIndex(item => item.id === over.id);
      const newOrder = arrayMove(subtasks, oldIndex, newIndex);
      setSubtasks(newOrder);

      try {
        // Salvar a nova ordem no banco de dados
        const subtarefasIds = newOrder.map((subtask: any) => subtask.id);
        await reordenarSubtarefas({ subtarefasIds });
        toast.success('Subtarefa reordenada com sucesso!');
      } catch (error) {
        console.error('Erro ao reordenar subtarefas:', error);
        toast.error('Erro ao salvar nova ordem. Tente novamente.');
        // Reverter a ordem visual em caso de erro
        setSubtasks(subtasks);
      }
    }
  };
  const SortableSubtaskItem = ({
    subtask,
    tarefa,
    onToggleComplete,
    onEdit,
    onDuplicate,
    onDelete,
    truncateText,
    getPrioridadeColor,
    formatDateForDisplay,
    getDateColor,
    getEmpresaNome
  }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging
    } = useSortable({
      id: subtask.id
    });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition
    };
    return <div ref={setNodeRef} style={style} className={`bg-muted/30 p-4 rounded-lg border border-border transition-all ${subtask.status === 'concluido' ? 'opacity-60' : ''} ${isDragging ? 'shadow-lg scale-105 bg-blue-50 dark:bg-blue-950/20 border-blue-300' : ''}`} {...attributes}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground mt-1">
              <GripVertical className="h-4 w-4" />
            </div>
            
            <button onClick={onToggleComplete} className={`mt-1 p-1 rounded transition-colors ${subtask.status === 'concluido' ? 'bg-green-500 text-white hover:bg-green-600' : 'border-2 border-gray-300 hover:border-green-500'}`}>
              {subtask.status === 'concluido' && <Check className="h-3 w-3" />}
            </button>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-foreground">{getEmpresaNome(subtask.empresa_id)}</span>
              </div>
              
              <h5 className={`font-semibold text-foreground uppercase ${subtask.status === 'concluido' ? 'line-through' : ''}`}>
                {truncateText(subtask.titulo, 80)}
              </h5>
              
              {subtask.descricao && <p className={`text-sm text-muted-foreground ${subtask.status === 'concluido' ? 'line-through' : ''}`}>
                  {truncateText(subtask.descricao.replace(/<[^>]*>/g, ''), 60)}
                </p>}
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <Badge className={`text-xs ${getPrioridadeColor(subtask.prioridade)}`}>
                  {subtask.prioridade === 'alta' ? 'Alta' : subtask.prioridade === 'media' ? 'Média' : 'Baixa'}
                </Badge>

                <div className="flex flex-col gap-1">
                  <TaskResponsaveis tarefaId={subtask.id} />
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Atualizado em: {formatDateForDisplay(subtask.atualizado_em)}
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-4 flex-wrap">
                    {subtask.data_inicio && <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className={`text-xs ${!['pode_fazer', 'deve_fazer', 'pronto_fazer'].includes(subtask.status) ? 'text-gray-400' : getDateColor(subtask.data_inicio, subtask.status, true)}`}>
                          Início: {formatDateForDisplay(subtask.data_inicio)}
                        </span>
                      </div>}
                    
                    {subtask.data_entrega && <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className={`text-xs ${['concluido', 'rejeitado'].includes(subtask.status) ? 'text-gray-400' : getDateColor(subtask.data_entrega, subtask.status, false)}`}>
                          Entrega: {formatDateForDisplay(subtask.data_entrega)}
                        </span>
                      </div>}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-2">
            <Button variant="ghost" size="sm" onClick={onEdit} className="text-muted-foreground hover:text-foreground h-8 w-8 p-0">
              <Edit className="h-4 w-4" />
            </Button>
            
            <Button variant="ghost" size="sm" onClick={onDelete} className="text-muted-foreground hover:text-red-600 h-8 w-8 p-0" disabled={isDeleting}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>;
  };
  const tarefasOrdenadas = useMemo(() => {
    return [...tarefas].sort((a, b) => {
      const prioridadeValues = {
        alta: 3,
        media: 2,
        baixa: 1
      };
      const prioridadeDiff = (prioridadeValues[b.prioridade] || 0) - (prioridadeValues[a.prioridade] || 0);
      if (prioridadeDiff !== 0) return prioridadeDiff;
      if (!a.data_entrega && !b.data_entrega) return 0;
      if (!a.data_entrega) return 1;
      if (!b.data_entrega) return -1;
      return new Date(a.data_entrega).getTime() - new Date(b.data_entrega).getTime();
    });
  }, [tarefas]);

  // Hook to get all task responsaveis for filtering
  const {
    data: allResponsaveis = []
  } = useQuery({
    queryKey: ['all-responsaveis'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('tarefa_responsaveis').select('tarefa_id, responsavel_id');
      if (error) throw error;
      return data;
    }
  });
  // Helper function to check date filters
  const checkDateFilter = (dateString, filterValue) => {
    if (filterValue === 'all') return true;
    
    // If no date and a specific filter is selected, exclude the task
    if (!dateString && filterValue !== 'all') return false;
    
    const taskDate = new Date(dateString);
    const today = new Date();
    const diffTime = taskDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    switch (filterValue) {
      case 'overdue':
        return diffDays < 0;
      case '1day':
        return diffDays >= 0 && diffDays <= 1;
      case '2days':
        return diffDays >= 0 && diffDays <= 2;
      case '7days':
        return diffDays >= 0 && diffDays <= 7;
      case '10days':
        return diffDays >= 0 && diffDays <= 10;
      case '20days':
        return diffDays >= 0 && diffDays <= 20;
      case '30days':
        return diffDays >= 0 && diffDays <= 30;
      case '60days':
        return diffDays >= 0 && diffDays <= 60;
      case '90days':
        return diffDays >= 0 && diffDays <= 90;
      default:
        return true;
    }
  };

  const tarefasFiltradas = useMemo(() => {
    return tarefasOrdenadas.filter(tarefa => {
      const matchesSearch = !searchTerm || tarefa.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || tarefa.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = selectedStatus === 'all' || tarefa.status === selectedStatus;
      const matchesPriority = selectedPriority === 'all' || tarefa.prioridade === selectedPriority;
      const matchesCompany = selectedCompany === 'all' || tarefa.empresa_id === selectedCompany;
      const matchesResponsible = selectedResponsible === 'all' || allResponsaveis.some(resp => resp.tarefa_id === tarefa.id && resp.responsavel_id === selectedResponsible);
      const matchesStartDate = checkDateFilter(tarefa.data_inicio, selectedStartDate);
      const matchesDeliveryDate = checkDateFilter(tarefa.data_entrega, selectedDeliveryDate);

      return matchesSearch && matchesStatus && matchesPriority && matchesCompany && matchesResponsible && matchesStartDate && matchesDeliveryDate;
    });
  }, [tarefasOrdenadas, searchTerm, selectedStatus, selectedPriority, selectedCompany, selectedResponsible, selectedStartDate, selectedDeliveryDate, allResponsaveis]);
  const tarefasPorStatus = useMemo(() => {
    if (selectedStatus === 'all') {
      return {
        pode_fazer: tarefasFiltradas.filter(t => t.status === 'pode_fazer'),
        deve_fazer: tarefasFiltradas.filter(t => t.status === 'deve_fazer'),
        pronto_fazer: tarefasFiltradas.filter(t => t.status === 'pronto_fazer'),
        em_andamento: tarefasFiltradas.filter(t => t.status === 'em_andamento'),
        em_revisao: tarefasFiltradas.filter(t => t.status === 'em_revisao'),
        recorrente: tarefasFiltradas.filter(t => t.status === 'recorrente'),
        concluido: tarefasFiltradas.filter(t => t.status === 'concluido'),
        rejeitado: tarefasFiltradas.filter(t => t.status === 'rejeitado')
      };
    } else {
      return {
        pode_fazer: selectedStatus === 'pode_fazer' ? tarefasFiltradas : [],
        deve_fazer: selectedStatus === 'deve_fazer' ? tarefasFiltradas : [],
        pronto_fazer: selectedStatus === 'pronto_fazer' ? tarefasFiltradas : [],
        em_andamento: selectedStatus === 'em_andamento' ? tarefasFiltradas : [],
        em_revisao: selectedStatus === 'em_revisao' ? tarefasFiltradas : [],
        recorrente: selectedStatus === 'recorrente' ? tarefasFiltradas : [],
        concluido: selectedStatus === 'concluido' ? tarefasFiltradas : [],
        rejeitado: selectedStatus === 'rejeitado' ? tarefasFiltradas : []
      };
    }
  }, [tarefasFiltradas, selectedStatus]);
  const getStatusInfo = status => {
    switch (status) {
      case 'pode_fazer':
        return {
          label: 'Poderia Fazer',
          color: 'bg-slate-500',
          count: tarefasPorStatus.pode_fazer.length
        };
      case 'deve_fazer':
        return {
          label: 'Devemos Fazer',
          color: 'bg-orange-500',
          count: tarefasPorStatus.deve_fazer.length
        };
      case 'pronto_fazer':
        return {
          label: 'Pronto para Fazer',
          color: 'bg-pink-500',
          count: tarefasPorStatus.pronto_fazer.length
        };
      case 'em_andamento':
        return {
          label: 'Em Progresso',
          color: 'bg-purple-500',
          count: tarefasPorStatus.em_andamento.length
        };
      case 'em_revisao':
        return {
          label: 'Em Revisão',
          color: 'bg-blue-500',
          count: tarefasPorStatus.em_revisao.length
        };
      case 'recorrente':
        return {
          label: 'Recorrente',
          color: 'bg-indigo-500',
          count: tarefasPorStatus.recorrente.length
        };
      case 'concluido':
        return {
          label: 'Concluído',
          color: 'bg-green-500',
          count: tarefasPorStatus.concluido.length
        };
      case 'rejeitado':
        return {
          label: 'Rejeitado',
          color: 'bg-red-500',
          count: tarefasPorStatus.rejeitado.length
        };
      default:
        return {
          label: status,
          color: 'bg-gray-500',
          count: 0
        };
    }
  };
  const getPrioridadeColor = prioridade => {
    switch (prioridade) {
      case 'alta':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/30';
      case 'media':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/30';
      case 'baixa':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/30';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700';
    }
  };
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return null;
    
    // Parse date string manually to avoid timezone conversion
    const s = String(dateString);
    
    // Match ISO format with timezone (2025-09-03T15:04:52.070837+00:00)
    let match = s.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:[+-]\d{2}:?\d{2}|Z)?/);
    
    if (match) {
      const [, year, month, day, hour, minute] = match;
      return `${day}/${month}/${year} ${hour}:${minute}`;
    }
    
    // Fallback for other formats
    match = s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
    if (match) {
      const [, year, month, day, hour, minute] = match;
      return `${day}/${month}/${year} ${hour}:${minute}`;
    }
    
    return s;
  };
  const getDateColor = (dateString, status, isStartDate = false) => {
    if (!dateString) return '';
    
    // Para tarefas já finalizadas (concluído/rejeitado), usar cinza
    if (status === 'concluido' || status === 'rejeitado') {
      return 'text-gray-500 dark:text-gray-400';
    }
    
    // Para datas de início em tarefas recorrente, usar cinza
    if (isStartDate && status === 'recorrente') {
      return 'text-gray-500 dark:text-gray-400';
    }
    
    // Para datas de início em tarefas já iniciadas (em_andamento, em_revisao), usar cinza
    if (isStartDate && (status === 'em_andamento' || status === 'em_revisao')) {
      return 'text-gray-500 dark:text-gray-400';
    }
    
    const today = new Date();
    const targetDate = new Date(dateString);
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) {
      return 'text-red-600 font-bold dark:text-red-400';
    } else if (diffDays <= 2) {
      return 'text-yellow-600 font-bold dark:text-yellow-400';
    } else {
      return 'text-green-600 font-bold dark:text-green-400';
    }
  };
  const getEmpresaNome = empresaId => {
    if (!empresaId) return 'Sem empresa';
    const empresa = empresas.find(e => e.id === empresaId);
    return empresa?.nome || 'Empresa não encontrada';
  };
  const toggleSection = status => {
    setExpandedSections(prev => ({
      ...prev,
      [status]: !prev[status]
    }));
  };
  const handleDeleteClick = tarefa => {
    setTaskToDelete(tarefa);
    setIsDeleteDialogOpen(true);
  };
  const handleDeleteConfirm = async () => {
    if (taskToDelete) {
      try {
        await excluirTarefa(taskToDelete.id);
        toast.success('Tarefa excluída com sucesso!');
        setIsDeleteDialogOpen(false);
        setTaskToDelete(null);
      } catch (error) {
        console.error('Erro ao excluir tarefa:', error);
        toast.error('Erro ao excluir tarefa. Tente novamente.');
      }
    }
  };
  const handleDeleteSubtaskClick = subtask => {
    setSubtaskToDelete(subtask);
    setIsDeleteSubtaskDialogOpen(true);
  };
  const handleDeleteSubtaskConfirm = async () => {
    if (subtaskToDelete) {
      try {
        await excluirTarefa(subtaskToDelete.id);
        toast.success('Subtarefa excluída com sucesso!');
        setIsDeleteSubtaskDialogOpen(false);
        setSubtaskToDelete(null);
      } catch (error) {
        console.error('Erro ao excluir subtarefa:', error);
        toast.error('Erro ao excluir subtarefa. Tente novamente.');
      }
    }
  };
  const TaskResponsaveis = ({
    tarefaId
  }) => {
    const {
      responsaveis
    } = useResponsaveisTarefa(tarefaId);
    if (!responsaveis || responsaveis.length === 0) {
      return <span className="text-xs text-muted-foreground">Nenhum responsável</span>;
    }
    return <div className="flex items-center gap-1">
        <Users className="h-3 w-3 text-muted-foreground" />
        <div className="flex -space-x-1">
          {responsaveis.slice(0, 3).map((responsavel, index) => <Avatar key={responsavel.id} className="h-5 w-5 border-2 border-white dark:border-gray-800">
              <AvatarImage src={responsavel.responsavel_perfil?.url_avatar || ''} alt={responsavel.responsavel_perfil?.nome_completo || 'Usuário'} />
              <AvatarFallback className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                {(responsavel.responsavel_perfil?.nome_completo || 'U').charAt(0)}
              </AvatarFallback>
            </Avatar>)}
          {responsaveis.length > 3 && <div className="h-5 w-5 rounded-full border-2 border-white dark:border-gray-800 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <span className="text-xs text-gray-600 dark:text-gray-300">+{responsaveis.length - 3}</span>
            </div>}
        </div>
      </div>;
  };
  const TaskCard = ({
    tarefa
  }) => {
    const [subtasks, setSubtasks] = useState([]);
    const {
      getNomeUsuario
    } = usePerfis();

    // Use global expanded state
    const expandedSubtasks = globalExpandedSubtasks[tarefa.id] || false;
    const setExpandedSubtasks = (value) => {
      setGlobalExpandedSubtasks(prev => ({
        ...prev,
        [tarefa.id]: typeof value === 'function' ? value(prev[tarefa.id] || false) : value
      }));
    };

    // Fetch subtasks if this is a main task
    const fetchSubtasks = async () => {
      if (tarefa.tipo === 'tarefa') {
        const {
          data
        } = await supabase.from('tarefas').select(`
            *,
            criado_por_perfil:perfis!tarefas_criado_por_fkey(nome_completo, url_avatar)
          `).eq('tarefa_pai_id', tarefa.id).eq('tipo', 'subtarefa').order('ordem_subtarefa', { ascending: true });
        setSubtasks(data || []);
      }
    };
    React.useEffect(() => {
      fetchSubtasks();
    }, [tarefa.id]);
    const hasSubtasks = subtasks.length > 0;
    const truncateText = (text, maxLength = 100) => {
      if (!text) return '';
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };
    return <div className="border border-border rounded-lg p-4 hover:bg-muted/50 dark:hover:bg-muted/20 bg-card dark:bg-card transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-foreground">{getEmpresaNome(tarefa.empresa_id)}</span>
            </div>
            
            <h4 className="font-semibold text-foreground line-clamp-2 break-words uppercase">
              {truncateText(tarefa.titulo, 100)}
            </h4>

            {tarefa.descricao && <p className="text-sm text-muted-foreground line-clamp-2 break-words">
                {truncateText(tarefa.descricao.replace(/<[^>]*>/g, ''), 100)}
              </p>}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <Badge className={getPrioridadeColor(tarefa.prioridade)}>
                {tarefa.prioridade === 'alta' ? 'Alta' : tarefa.prioridade === 'media' ? 'Média' : 'Baixa'}
              </Badge>

              <div className="flex flex-col gap-1">
                <TaskResponsaveis tarefaId={tarefa.id} />
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Atualizado em: {formatDateForDisplay(tarefa.atualizado_em)}
                  </span>
                </div>
              </div>
              
              
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-4 flex-wrap ml-8">
                  {tarefa.data_inicio && <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className={`text-xs ${getDateColor(tarefa.data_inicio, tarefa.status, true)}`}>
                          Início: {formatDateForDisplay(tarefa.data_inicio)}
                      </span>
                    </div>}
                  
                  {tarefa.data_entrega && <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className={`text-xs ${getDateColor(tarefa.data_entrega, tarefa.status, false)}`}>
                          Entrega: {formatDateForDisplay(tarefa.data_entrega)}
                      </span>
                    </div>}
                </div>
              </div>
            </div>

            {/* Subtasks section */}
            {hasSubtasks && <div className="mt-4 border-t pt-4">
                <Button variant="ghost" size="sm" onClick={() => setExpandedSubtasks(!expandedSubtasks)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                  {expandedSubtasks ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  {subtasks.length} subtarefa{subtasks.length !== 1 ? 's' : ''}
                  {hasSubtasks && <span className="text-blue-600">●</span>}
                </Button>
                
                 {expandedSubtasks && <div className="mt-2 ml-4 space-y-2 border-l-2 border-blue-200 pl-4">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={event => handleDragEnd(event, subtasks, setSubtasks, tarefa.id)}>
                      <SortableContext items={subtasks.map(s => s.id)} strategy={verticalListSortingStrategy}>
                         {subtasks.map(subtask => <SortableSubtaskItem key={subtask.id} subtask={subtask} tarefa={tarefa} onToggleComplete={async () => {
                    try {
                      const prevExpanded = expandedSubtasks;
                      await atualizarTarefa({
                        id: subtask.id,
                        status: subtask.status === 'concluido' ? 'pode_fazer' : 'concluido'
                      });
                      await fetchSubtasks(); // Refresh subtasks
                      setExpandedSubtasks(prevExpanded); // Manter estado expandido
                    } catch (error) {
                      console.error('Erro ao atualizar subtarefa:', error);
                      toast.error('Erro ao atualizar subtarefa');
                    }
                  }} onEdit={() => {
                    const prevExpanded = expandedSubtasks;
                    setSelectedSubTask(subtask);
                    setSelectedParentTask(tarefa);
                    setIsSubTaskEditModalOpen(true);
                    // Manter estado expandido após fechar modal
                    setTimeout(() => setExpandedSubtasks(prevExpanded), 100);
                  }} onDuplicate={() => {
                    const prevExpanded = expandedSubtasks;
                    setSelectedSubTask(subtask);
                    setSelectedParentTask(tarefa);
                    setIsDuplicateSubTaskModalOpen(true);
                    // Manter estado expandido após fechar modal
                    setTimeout(() => setExpandedSubtasks(prevExpanded), 100);
                  }} onDelete={() => {
                    const prevExpanded = expandedSubtasks;
                    handleDeleteSubtaskClick(subtask);
                    // Manter estado expandido após exclusão
                    setTimeout(() => setExpandedSubtasks(prevExpanded), 100);
                  }} truncateText={truncateText} getPrioridadeColor={getPrioridadeColor} formatDateForDisplay={formatDateForDisplay} getDateColor={(dateString, isStartDate) => getDateColor(dateString, subtask.status, isStartDate)} getEmpresaNome={getEmpresaNome} />)}
                      </SortableContext>
                    </DndContext>

                    {/* Add subtask button */}
                    
                  </div>}
              </div>}

            {/* Add subtask button - sempre visível */}
            <div className="flex justify-center mt-3">
              <Button variant="outline" size="sm" onClick={() => {
              setSelectedParentTask(tarefa);
              setIsSubTaskModalOpen(true);
            }} className="border-dashed text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Subtarefa
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => {
              const scrollContainer = document.querySelector('.overflow-auto');
              if (scrollContainer) {
                setScrollPosition(scrollContainer.scrollTop);
              }
              setSelectedTask(tarefa);
              setIsDuplicateModalOpen(true);
            }} className="text-muted-foreground hover:text-blue-600" title="Duplicar tarefa">
              <Copy className="h-4 w-4" />
            </Button>

            <Button variant="ghost" size="sm" onClick={() => {
              const scrollContainer = document.querySelector('.overflow-auto');
              if (scrollContainer) {
                setScrollPosition(scrollContainer.scrollTop);
              }
              setSelectedTask(tarefa);
              setIsEditModalOpen(true);
            }} className="text-muted-foreground hover:text-foreground">
              <Edit className="h-4 w-4" />
            </Button>
            
            <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(tarefa)} className="text-muted-foreground hover:text-red-600" disabled={isDeleting}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>;
  };
  if (isLoading) {
    return <div className="flex h-screen bg-background">
        <DashboardSidebar userType="team" />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>;
  }
  return <div className="flex h-screen bg-background">
      <DashboardSidebar userType="team" />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Gerenciar Tarefas</h1>
                <p className="text-muted-foreground">
                  Gerencie e acompanhe todas as tarefas da equipe
                </p>
              </div>
              <Button onClick={() => setIsTeamTaskModalOpen(true)} className="bg-green-600 hover:bg-green-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Nova Tarefa
              </Button>
            </div>

            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar tarefas..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
            </div>

            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pode_fazer">Poderia Fazer</SelectItem>
                  <SelectItem value="deve_fazer">Devemos Fazer</SelectItem>
                  <SelectItem value="pronto_fazer">Pronto para Fazer</SelectItem>
                  <SelectItem value="em_andamento">Em Progresso</SelectItem>
                  <SelectItem value="em_revisao">Em Revisão</SelectItem>
                  <SelectItem value="recorrente">Recorrente</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="rejeitado">Rejeitado</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as prioridades</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="baixa">Baixa</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por empresa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as empresas</SelectItem>
                  {empresas.map(empresa => <SelectItem key={empresa.id} value={empresa.id}>
                      {empresa.nome}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Segunda linha de filtros */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select value={selectedResponsible} onValueChange={setSelectedResponsible}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os responsáveis</SelectItem>
                  {perfisEquipe.map(perfil => <SelectItem key={perfil.id} value={perfil.id}>
                      {perfil.nome_completo}
                    </SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={selectedStartDate} onValueChange={setSelectedStartDate}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por data de início" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as datas de início</SelectItem>
                  <SelectItem value="overdue">Atrasado</SelectItem>
                  <SelectItem value="1day">Até 1 dia</SelectItem>
                  <SelectItem value="2days">Até 2 dias</SelectItem>
                  <SelectItem value="7days">Até 7 dias</SelectItem>
                  <SelectItem value="10days">Até 10 dias</SelectItem>
                  <SelectItem value="20days">Até 20 dias</SelectItem>
                  <SelectItem value="30days">Até 30 dias</SelectItem>
                  <SelectItem value="60days">Até 60 dias</SelectItem>
                  <SelectItem value="90days">Até 90 dias</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedDeliveryDate} onValueChange={setSelectedDeliveryDate}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por data de entrega" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as datas de entrega</SelectItem>
                  <SelectItem value="overdue">Atrasado</SelectItem>
                  <SelectItem value="1day">Até 1 dia</SelectItem>
                  <SelectItem value="2days">Até 2 dias</SelectItem>
                  <SelectItem value="7days">Até 7 dias</SelectItem>
                  <SelectItem value="10days">Até 10 dias</SelectItem>
                  <SelectItem value="20days">Até 20 dias</SelectItem>
                  <SelectItem value="30days">Até 30 dias</SelectItem>
                  <SelectItem value="60days">Até 60 dias</SelectItem>
                  <SelectItem value="90days">Até 90 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Seções de Tarefas por Status */}
            <div className="space-y-6">
              {Object.entries(tarefasPorStatus).map(([status, tasks]) => {
              const statusInfo = getStatusInfo(status);
              const isExpanded = expandedSections[status];
              if (selectedStatus !== 'all' && selectedStatus !== status) {
                return null;
              }
              return <Card key={status} className="dark:bg-card dark:border-border">
                    <CardHeader className="cursor-pointer hover:bg-muted/50 dark:hover:bg-muted/20" onClick={() => toggleSection(status)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${statusInfo.color}`}></div>
                          <h3 className="text-lg font-semibold text-foreground">{statusInfo.label}</h3>
                          <Badge variant="secondary" className="dark:bg-secondary dark:text-secondary-foreground">{statusInfo.count}</Badge>
                        </div>
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </CardHeader>
                    {isExpanded && <CardContent>
                        <div className="space-y-3 min-h-[80px] p-4 rounded-lg border-2 border-dashed border-muted-foreground/20">
                          {tasks.length === 0 ? <div className="text-center py-8 text-muted-foreground">
                               <div className="text-lg mb-2">📋</div>
                               <div>Nenhuma tarefa neste status</div>
                             </div> : tasks.map(tarefa => <TaskCard key={tarefa.id} tarefa={tarefa} />)}
                        </div>
                      </CardContent>}
                  </Card>;
            })}
            </div>
          </div>
        </div>
      </div>

      {/* Modais */}
      <TeamTaskModal isOpen={isTeamTaskModalOpen} onClose={() => setIsTeamTaskModalOpen(false)} onSuccess={() => {}} />

    {selectedTask && <TaskEditModal isOpen={isEditModalOpen} onClose={() => {
      setIsEditModalOpen(false);
      setSelectedTask(null);
      // Restaurar posição do scroll
      setTimeout(() => {
        const scrollContainer = document.querySelector('.overflow-auto');
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollPosition;
        }
      }, 100);
    }} task={selectedTask} onSuccess={() => {
      setIsEditModalOpen(false);
      setSelectedTask(null);
      // Restaurar posição do scroll
      setTimeout(() => {
        const scrollContainer = document.querySelector('.overflow-auto');
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollPosition;
        }
      }, 100);
    }} />}

      <SubTaskModal isOpen={isSubTaskModalOpen} onClose={() => {
      setIsSubTaskModalOpen(false);
      setSelectedParentTask(null);
    }} onSuccess={() => {
      setIsSubTaskModalOpen(false);
      setSelectedParentTask(null);
    }} parentTask={selectedParentTask} />

      <SubTaskEditModal isOpen={isSubTaskEditModalOpen} onClose={() => {
      setIsSubTaskEditModalOpen(false);
      setSelectedSubTask(null);
      setSelectedParentTask(null);
      setHasUnsavedChanges(false);
    }} subtask={selectedSubTask} parentTask={selectedParentTask} onSuccess={() => {
      setIsSubTaskEditModalOpen(false);
      setSelectedSubTask(null);
      setSelectedParentTask(null);
      setHasUnsavedChanges(false);
    }} hasUnsavedChanges={hasUnsavedChanges} setHasUnsavedChanges={setHasUnsavedChanges} />

      <DuplicateTaskModal 
        isOpen={isDuplicateModalOpen} 
        onClose={() => {
          setIsDuplicateModalOpen(false);
          setSelectedTask(null);
          // Restaurar posição do scroll
          setTimeout(() => {
            const scrollContainer = document.querySelector('.overflow-auto');
            if (scrollContainer) {
              scrollContainer.scrollTop = scrollPosition;
            }
          }, 100);
        }} 
        task={selectedTask} 
        onSuccess={() => {
          setIsDuplicateModalOpen(false);
          setSelectedTask(null);
          // Restaurar posição do scroll
          setTimeout(() => {
            const scrollContainer = document.querySelector('.overflow-auto');
            if (scrollContainer) {
              scrollContainer.scrollTop = scrollPosition;
            }
          }, 100);
        }} 
      />

      <DuplicateSubTaskModal
        isOpen={isDuplicateSubTaskModalOpen}
        onClose={() => {
          setIsDuplicateSubTaskModalOpen(false);
          setSelectedSubTask(null);
          setSelectedParentTask(null);
        }}
        subtask={selectedSubTask}
        parentTask={selectedParentTask}
        onSuccess={() => {
          setIsDuplicateSubTaskModalOpen(false);
          setSelectedSubTask(null);
          setSelectedParentTask(null);
        }}
      />

      {/* Delete confirmation dialog for subtasks */}
      <AlertDialog open={isDeleteSubtaskDialogOpen} onOpenChange={setIsDeleteSubtaskDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a subtarefa "{subtaskToDelete?.titulo}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
            setIsDeleteSubtaskDialogOpen(false);
            setSubtaskToDelete(null);
          }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSubtaskConfirm} className="bg-red-600 hover:bg-red-700" disabled={isDeleting}>
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a tarefa "{taskToDelete?.titulo}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
            setIsDeleteDialogOpen(false);
            setTaskToDelete(null);
          }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700" disabled={isDeleting}>
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
};
export default TeamTasks;