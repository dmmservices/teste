import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card"
import { Building2, Calendar, Users, CheckCircle, Clock, AlertTriangle, FileText, ClipboardList, TrendingUp } from 'lucide-react';
import { Badge } from "@/components/ui/badge"
import DashboardSidebar from '@/components/DashboardSidebar';
import { useAuthContext } from '@/contexts/AuthContext';
import { useChecklists } from '@/hooks/useChecklists';
import { useTarefas } from '@/hooks/useTarefas';
import { usePerfis } from '@/hooks/usePerfis';
import { useEmpresas } from '@/hooks/useEmpresas';

const ClientDashboard = () => {
  const { perfil } = useAuthContext();
  const { checklists, isLoading: checklistsLoading } = useChecklists();
  const { tarefas, isLoading: tarefasLoading } = useTarefas();
  const { perfisEquipe } = usePerfis();
  const { empresas } = useEmpresas();
  const [checklistsDoCliente, setChecklistsDoCliente] = useState([]);
  const [tarefasDoCliente, setTarefasDoCliente] = useState([]);

  useEffect(() => {
    if (perfil?.empresa_id && checklists) {
      const checklistsFiltradas = checklists.filter(
        (checklist) => checklist.empresa_id === perfil.empresa_id
      );
      setChecklistsDoCliente(checklistsFiltradas);
    }
  }, [perfil?.empresa_id, checklists]);

  useEffect(() => {
    if (perfil?.empresa_id && tarefas) {
      const tarefasFiltradas = tarefas.filter(
        (tarefa) => tarefa.empresa_id === perfil.empresa_id
      );
      setTarefasDoCliente(tarefasFiltradas);
    }
  }, [perfil?.empresa_id, tarefas]);

  // Estatísticas dos checklists
  const checklistsStats = useMemo(() => {
    const dmmChecklists = checklistsDoCliente.filter(c => c.tipo === 'pendencia_dmm');
    const clienteChecklists = checklistsDoCliente.filter(c => c.tipo === 'pendencia_cliente');
    
    return {
      totalDMM: dmmChecklists.length,
      pendentesDMM: dmmChecklists.filter(c => !c.concluido).length,
      concluidasDMM: dmmChecklists.filter(c => c.concluido).length,
      altaPrioridadeDMM: dmmChecklists.filter(c => c.prioridade === 'alta' && !c.concluido).length,

      totalCliente: clienteChecklists.length,
      pendentesCliente: clienteChecklists.filter(c => !c.concluido).length,
      concluidasCliente: clienteChecklists.filter(c => c.concluido).length,
      altaPrioridadeCliente: clienteChecklists.filter(c => c.prioridade === 'alta' && !c.concluido).length,
    };
  }, [checklistsDoCliente]);

  // Estatísticas das tarefas
  const tarefasStats = useMemo(() => {
    return {
      total: tarefasDoCliente.length,
      pendentes: tarefasDoCliente.filter(t => !['concluido', 'rejeitado'].includes(t.status)).length,
      concluidas: tarefasDoCliente.filter(t => t.status === 'concluido').length,
      emAndamento: tarefasDoCliente.filter(t => t.status === 'em_andamento').length,
      atrasadas: tarefasDoCliente.filter(t => {
        if (!t.data_entrega) return false;
        const hoje = new Date();
        const dataEntrega = new Date(t.data_entrega);
        return dataEntrega < hoje && !['concluido', 'rejeitado'].includes(t.status);
      }).length,
    };
  }, [tarefasDoCliente]);

  const getPrioridadeColor = (prioridade) => {
    switch (prioridade) {
      case 'alta':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'media':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'baixa':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
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

  const getCriadorNome = (criadorId) => {
    if (!criadorId) return 'Não atribuído';
    // Para checklists criados pelo DMM, mostrar "DMM Services"
    const perfilDMM = perfisEquipe.find(p => p.id === criadorId && 
      (p.funcao === 'dmm_admin' || p.funcao === 'dmm_membro'));
    if (perfilDMM) return 'DMM Services';
    
    const perfil = perfisEquipe.find(p => p.id === criadorId);
    return perfil?.nome_completo || 'DMM Services';
  };

  const getEmpresaNome = (empresaId) => {
    if (!empresaId) return 'Sem empresa';
    const empresa = empresas.find(e => e.id === empresaId);
    return empresa?.nome || 'Empresa não encontrada';
  };

  const ChecklistCard = ({ checklist }) => (
    <Card className="dark:bg-card dark:border-border">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-foreground">{getEmpresaNome(checklist.empresa_id)}</span>
            </div>
            
            <h4 className="font-semibold text-foreground mb-1 line-clamp-2 break-words">{checklist.titulo}</h4>
            
            {checklist.descricao && (
              <p className="text-sm text-muted-foreground mb-2 line-clamp-2 break-words">{checklist.descricao}</p>
            )}
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>{getCriadorNome(checklist.criado_por)}</span>
            </div>
            
            {checklist.data_entrega && (
              <div className="flex items-center gap-1 mt-1">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span className={`text-sm font-bold ${getDateColor(checklist.data_entrega)}`}>
                  <strong>Entrega: {new Date(checklist.data_entrega).toLocaleDateString('pt-BR')}</strong>
                </span>
              </div>
            )}
          </div>
          
          {checklist.prioridade && (
            <Badge className={getPrioridadeColor(checklist.prioridade)}>
              {checklist.prioridade === 'alta' ? 'Alta' : checklist.prioridade === 'media' ? 'Média' : 'Baixa'}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (checklistsLoading || tarefasLoading) {
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
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">
              Visão geral das suas checklists e tarefas
            </p>
          </div>

          {/* Estatísticas Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="dark:bg-card dark:border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-foreground">{checklistsStats.pendentesDMM}</h2>
                    <p className="text-muted-foreground">Pendências DMM</p>
                  </div>
                  <ClipboardList className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="dark:bg-card dark:border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-foreground">{checklistsStats.pendentesCliente}</h2>
                    <p className="text-muted-foreground">Minhas Pendências</p>
                  </div>
                  <FileText className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="dark:bg-card dark:border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-foreground">{tarefasStats.pendentes}</h2>
                    <p className="text-muted-foreground">Tarefas Pendentes</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="dark:bg-card dark:border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-foreground">{tarefasStats.concluidas}</h2>
                    <p className="text-muted-foreground">Tarefas Concluídas</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Estatísticas Detalhadas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="dark:bg-card dark:border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-foreground">{checklistsStats.altaPrioridadeDMM + checklistsStats.altaPrioridadeCliente}</h2>
                    <p className="text-muted-foreground">Alta Prioridade</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="dark:bg-card dark:border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-foreground">{tarefasStats.emAndamento}</h2>
                    <p className="text-muted-foreground">Em Andamento</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="dark:bg-card dark:border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-foreground">{tarefasStats.atrasadas}</h2>
                    <p className="text-muted-foreground">Tarefas Atrasadas</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Checklists Recentes */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Checklists Recentes</h2>
            {checklistsDoCliente.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {checklistsDoCliente
                  .filter(c => !c.concluido)
                  .slice(0, 6)
                  .map(checklist => (
                    <ChecklistCard key={checklist.id} checklist={checklist} />
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma checklist encontrada.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;