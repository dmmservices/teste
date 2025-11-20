import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Calendar, Building2, ChevronDown, ChevronUp, Users, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import DashboardSidebar from '@/components/DashboardSidebar';
import { useTarefas } from '@/hooks/useTarefas';
import { usePerfis } from '@/hooks/usePerfis';
import { useEmpresas } from '@/hooks/useEmpresas';
import { useResponsaveisTarefa } from '@/hooks/useResponsaveisTarefa';
import { useComentariosTarefa } from '@/hooks/useComentariosTarefa';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Enums } from '@/integrations/supabase/types';

type StatusTarefa = Enums<'status_tarefa'>;
import TaskCommentsSection from '@/components/TaskCommentsSection';
import { useAuthContext } from '@/contexts/AuthContext';

const ClientTasks = () => {
  const { perfil } = useAuthContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  
  // Filter states
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
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
  
  const { tarefas, isLoading } = useTarefas();
  const { perfisEquipe } = usePerfis();
  const { empresas } = useEmpresas();

  // Filtrar tarefas do cliente específico
  const tarefasDoCliente = useMemo(() => {
    if (!perfil?.empresa_id) return [];
    return tarefas.filter(tarefa => tarefa.empresa_id === perfil.empresa_id);
  }, [tarefas, perfil?.empresa_id]);

  const tarefasOrdenadas = useMemo(() => {
    return [...tarefasDoCliente].sort((a, b) => {
      const prioridadeValues = { alta: 3, media: 2, baixa: 1 };
      const prioridadeDiff = (prioridadeValues[b.prioridade] || 0) - (prioridadeValues[a.prioridade] || 0);
      
      if (prioridadeDiff !== 0) return prioridadeDiff;
      
      if (!a.data_entrega && !b.data_entrega) return 0;
      if (!a.data_entrega) return 1;
      if (!b.data_entrega) return -1;
      
      return new Date(a.data_entrega).getTime() - new Date(b.data_entrega).getTime();
    });
  }, [tarefasDoCliente]);

  // Hook to get all task responsaveis for filtering
  const { data: allResponsaveis = [] } = useQuery({
    queryKey: ['all-responsaveis-client'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tarefa_responsaveis')
        .select('tarefa_id, responsavel_id');
      
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
      const matchesSearch = !searchTerm || 
        tarefa.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tarefa.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = selectedStatus === 'all' || tarefa.status === selectedStatus;
      const matchesPriority = selectedPriority === 'all' || tarefa.prioridade === selectedPriority;
      const matchesResponsible = selectedResponsible === 'all' || 
        allResponsaveis.some(resp => resp.tarefa_id === tarefa.id && resp.responsavel_id === selectedResponsible);
      const matchesStartDate = checkDateFilter(tarefa.data_inicio, selectedStartDate);
      const matchesDeliveryDate = checkDateFilter(tarefa.data_entrega, selectedDeliveryDate);
      
      return matchesSearch && matchesStatus && matchesPriority && matchesResponsible && matchesStartDate && matchesDeliveryDate;
    });
  }, [tarefasOrdenadas, searchTerm, selectedStatus, selectedPriority, selectedResponsible, selectedStartDate, selectedDeliveryDate, allResponsaveis]);

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

  const getStatusInfo = (status) => {
    switch (status) {
      case 'pode_fazer':
        return { label: 'Poderia Fazer', color: 'bg-slate-500', count: tarefasPorStatus.pode_fazer.length };
      case 'deve_fazer':
        return { label: 'Devemos Fazer', color: 'bg-orange-500', count: tarefasPorStatus.deve_fazer.length };
      case 'pronto_fazer':
        return { label: 'Pronto para Fazer', color: 'bg-pink-500', count: tarefasPorStatus.pronto_fazer.length };
      case 'em_andamento':
        return { label: 'Em Progresso', color: 'bg-purple-500', count: tarefasPorStatus.em_andamento.length };
      case 'em_revisao':
        return { label: 'Em Revisão', color: 'bg-blue-500', count: tarefasPorStatus.em_revisao.length };
      case 'recorrente':
        return { label: 'Recorrente', color: 'bg-indigo-500', count: tarefasPorStatus.recorrente.length };
      case 'concluido':
        return { label: 'Concluído', color: 'bg-green-500', count: tarefasPorStatus.concluido.length };
      case 'rejeitado':
        return { label: 'Rejeitado', color: 'bg-red-500', count: tarefasPorStatus.rejeitado.length };
      default:
        return { label: status, color: 'bg-gray-500', count: 0 };
    }
  };

  const getPrioridadeColor = (prioridade) => {
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

  const getDateColor = (dateString) => {
    if (!dateString) return '';
    
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

  const getEmpresaNome = (empresaId) => {
    if (!empresaId) return 'Sem empresa';
    const empresa = empresas.find(e => e.id === empresaId);
    return empresa?.nome || 'Empresa não encontrada';
  };

  const toggleSection = (status) => {
    setExpandedSections(prev => ({
      ...prev,
      [status]: !prev[status]
    }));
  };

  const clearFilters = () => {
    setSelectedStatus('all');
    setSelectedPriority('all');
    setSelectedResponsible('all');
    setSearchTerm('');
  };

  const handleViewTask = (tarefa) => {
    setSelectedTask(tarefa);
    setIsViewModalOpen(true);
  };

  const TaskResponsaveis = ({ tarefaId }) => {
    const { responsaveis, isLoading } = useResponsaveisTarefa(tarefaId);
    const { getNomeUsuario } = usePerfis();
    
    if (isLoading) {
      return <span className="text-xs text-muted-foreground">Carregando responsáveis...</span>;
    }
    
    if (!responsaveis || responsaveis.length === 0) {
      return <span className="text-xs text-muted-foreground">Nenhum responsável</span>;
    }

    return (
      <div className="flex items-center gap-1">
        <Users className="h-3 w-3 text-muted-foreground" />
        <div className="flex -space-x-1">
          {responsaveis.slice(0, 3).map((responsavel, index) => {
            // Get profile data using getNomeUsuario function
            const nome = responsavel.responsavel_perfil?.nome_completo || getNomeUsuario(responsavel.responsavel_id);
            const avatar = responsavel.responsavel_perfil?.url_avatar || '';
            
            return (
              <Avatar key={responsavel.id || index} className="h-5 w-5 border-2 border-white dark:border-gray-800">
                <AvatarImage 
                  src={avatar} 
                  alt={nome} 
                />
                <AvatarFallback className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                  {nome && nome.length > 0 ? nome.charAt(0).toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
            );
          })}
          {responsaveis.length > 3 && (
            <div className="h-5 w-5 rounded-full border-2 border-white dark:border-gray-800 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <span className="text-xs text-gray-600 dark:text-gray-300">+{responsaveis.length - 3}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const TaskViewModal = ({ task, isOpen, onClose }) => {
    const { comentarios } = useComentariosTarefa(task?.id);
    
    if (!task) return null;

    const transformedComments = comentarios.map(comentario => ({
      id: comentario.id,
      text: comentario.comentario,
      author: comentario.autor_perfil?.nome_completo || 'Usuário',
      authorAvatar: comentario.autor_perfil?.url_avatar || '',
      date: comentario.criado_em,
      attachments: comentario.anexos || []
    }));

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Visualizar Tarefa</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold uppercase">{task.titulo}</h3>
              <p className="text-sm text-muted-foreground">{getEmpresaNome(task.empresa_id)}</p>
            </div>

            {task.descricao && (
              <div>
                <h4 className="font-medium mb-2">Descrição</h4>
                <p className="text-sm text-muted-foreground">{task.descricao}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Status</h4>
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                  {getStatusInfo(task.status).label}
                </Badge>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Prioridade</h4>
                <Badge className={getPrioridadeColor(task.prioridade)}>
                  {task.prioridade === 'alta' ? 'Alta' : task.prioridade === 'media' ? 'Média' : 'Baixa'}
                </Badge>
              </div>
            </div>

            {(task.data_inicio || task.data_entrega) && (
              <div className="grid grid-cols-2 gap-4">
                {task.data_inicio && (
                  <div>
                    <h4 className="font-medium mb-2">Data de Início</h4>
                    <p className="text-sm">{formatDateForDisplay(task.data_inicio)}</p>
                  </div>
                )}
                
                {task.data_entrega && (
                  <div>
                    <h4 className="font-medium mb-2">Data de Entrega</h4>
                    <p className={`text-sm ${getDateColor(task.data_entrega)}`}>
                      {formatDateForDisplay(task.data_entrega)}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div>
              <h4 className="font-medium mb-2">Responsáveis</h4>
              <TaskResponsaveis tarefaId={task.id} />
            </div>

            <div>
              <h4 className="font-medium mb-2">Comentários</h4>
              <TaskCommentsSection
                comments={transformedComments}
                onAddComment={() => {}} // Cliente só pode visualizar
                onDeleteComment={() => {}} // Cliente só pode visualizar
                currentUser={{
                  id: perfil?.id || '',
                  name: perfil?.nome_completo || '',
                  avatar: perfil?.url_avatar || ''
                }}
                readOnly={true}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        <DashboardSidebar userType="client" />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar userType="client" />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Minhas Tarefas</h1>
                <p className="text-muted-foreground">
                  Acompanhe o progresso das suas tarefas
                </p>
              </div>
            </div>

            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar tarefas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
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

              <Select value={selectedResponsible} onValueChange={setSelectedResponsible}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os responsáveis</SelectItem>
                  {perfisEquipe.map((perfil) => (
                    <SelectItem key={perfil.id} value={perfil.id}>
                      {perfil.nome_completo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Segunda linha de filtros */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                return (
                  <Card key={status} className="dark:bg-card dark:border-border">
                    <CardHeader 
                      className="cursor-pointer hover:bg-muted/50 dark:hover:bg-muted/20"
                      onClick={() => toggleSection(status)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${statusInfo.color}`}></div>
                          <h3 className="text-lg font-semibold text-foreground">{statusInfo.label}</h3>
                          <Badge variant="secondary" className="dark:bg-secondary dark:text-secondary-foreground">{statusInfo.count}</Badge>
                        </div>
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </CardHeader>
                    {isExpanded && (
                      <CardContent>
                        <div className="space-y-3 min-h-[80px] p-4 rounded-lg border-2 border-dashed border-muted-foreground/20">
                          {tasks.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              <div className="text-lg mb-2">📋</div>
                              <div>Nenhuma tarefa neste status</div>
                            </div>
                          ) : (
                            tasks.map((tarefa) => (
                              <div 
                                key={tarefa.id}
                                className="border border-border rounded-lg p-4 hover:bg-muted/50 dark:hover:bg-muted/20 bg-card dark:bg-card transition-colors"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2">
                                      <Building2 className="h-4 w-4 text-muted-foreground" />
                                      <span className="font-medium text-foreground">{getEmpresaNome(tarefa.empresa_id)}</span>
                                    </div>
                                    
                                     <h4 className="font-semibold text-foreground uppercase">{tarefa.titulo}</h4>

                                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
                              {tarefa.data_inicio && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3 text-muted-foreground" />
                                  <span className={`text-xs ${tarefa.status === 'recorrente' || tarefa.status === 'concluido' ? 'text-gray-400' : getDateColor(tarefa.data_inicio)}`}>
                                    Início: {formatDateForDisplay(tarefa.data_inicio)}
                                  </span>
                                </div>
                              )}
                              
                              {tarefa.data_entrega && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3 text-muted-foreground" />
                                  <span className={`text-xs ${tarefa.status === 'concluido' ? 'text-gray-400' : getDateColor(tarefa.data_entrega)}`}>
                                    Entrega: {formatDateForDisplay(tarefa.data_entrega)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                                     </div>
                                  </div>

                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleViewTask(tarefa)}
                                    className="text-muted-foreground hover:text-foreground"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* View Modal */}
      <TaskViewModal
        task={selectedTask}
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedTask(null);
        }}
      />
    </div>
  );
};

export default ClientTasks;