import React from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardSidebar from '@/components/DashboardSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuthContext } from '@/contexts/AuthContext';
import { useEmpresas } from '@/hooks/useEmpresas';
import { useTarefas } from '@/hooks/useTarefas';
import { useChecklists } from '@/hooks/useChecklists';
import { useMinhasTarefas } from '@/hooks/useMinhasTarefas';
import { usePerfis } from '@/hooks/usePerfis';
import { useTarefasPorResponsavel } from '@/hooks/useTarefasPorResponsavel';
import { CheckSquare, Clock, Users, TrendingUp, Calendar, AlertCircle, Plus, Building2, ListTodo, BarChart3, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
const TeamDashboard = () => {
  const navigate = useNavigate();
  const {
    signOut,
    perfil
  } = useAuthContext();
  const {
    empresas,
    isLoading: empresasLoading
  } = useEmpresas();
  const {
    tarefas,
    isLoading: tarefasLoading
  } = useTarefas();
  const {
    checklists,
    isLoading: checklistsLoading
  } = useChecklists();
  const {
    minhasTarefas,
    isLoading: minhasTarefasLoading
  } = useMinhasTarefas();
  const {
    perfisEquipe
  } = usePerfis();
  const {
    tarefasPorResponsavel,
    isLoading: tarefasPorResponsavelLoading
  } = useTarefasPorResponsavel();
  
  // Query para minhas recorrências
  const { data: responsaveis = [], isLoading: responsaveisLoading } = useQuery({
    queryKey: ['minhas-recorrencias', perfil?.id],
    queryFn: async () => {
      if (!perfil?.id) return [];
      const { data, error } = await supabase
        .from('tarefa_responsaveis')
        .select('tarefa_id')
        .eq('responsavel_id', perfil.id);
      if (error) throw error;
      return data;
    },
    enabled: !!perfil?.id
  });
  
  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      navigate('/login');
    }
  };
  if (empresasLoading || tarefasLoading || checklistsLoading || minhasTarefasLoading || tarefasPorResponsavelLoading || responsaveisLoading) {
    return <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>;
  }

  // Estatísticas das tarefas
  const tarefasStats = {
    total: tarefas.length,
    emAndamento: tarefas.filter(t => t.status === 'em_andamento').length,
    concluidas: tarefas.filter(t => t.status === 'concluido').length,
    pendentes: tarefas.filter(t => ['pode_fazer', 'deve_fazer', 'pronto_fazer'].includes(t.status)).length,
    atrasadas: tarefas.filter(t => {
      if (!t.data_entrega) return false;
      return new Date(t.data_entrega) < new Date() && t.status !== 'concluido';
    }).length
  };

  // Estatísticas dos checklists
  const checklistStats = {
    total: checklists.length,
    concluidos: checklists.filter(c => c.concluido).length,
    pendenciasDMM: checklists.filter(c => c.tipo === 'pendencia_dmm' && !c.concluido).length,
    pendenciasCliente: checklists.filter(c => c.tipo === 'pendencia_cliente' && !c.concluido).length
  };

  // Progresso geral
  const progressoGeral = tarefasStats.total > 0 ? Math.round(tarefasStats.concluidas / tarefasStats.total * 100) : 0;

  // Tarefas urgentes (próximas do prazo)
  const tarefasUrgentes = tarefas.filter(t => {
    if (!t.data_entrega || t.status === 'concluido') return false;
    const diasRestantes = Math.ceil((new Date(t.data_entrega).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return diasRestantes <= 3 && diasRestantes >= 0;
  }).slice(0, 5);

  // Atividade recente
  const atividadeRecente = [...tarefas.slice(0, 3).map(t => ({
    id: t.id,
    tipo: 'tarefa',
    titulo: t.titulo,
    empresa: empresas.find(e => e.id === t.empresa_id)?.nome || 'Empresa',
    data: t.criado_em,
    status: t.status
  })), ...checklists.slice(0, 2).map(c => ({
    id: c.id,
    tipo: 'checklist',
    titulo: c.titulo,
    empresa: empresas.find(e => e.id === c.empresa_id)?.nome || 'Empresa',
    data: c.criado_em,
    status: c.concluido ? 'concluido' : 'pendente'
  }))].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()).slice(0, 5);
  return <div className="flex min-h-screen bg-background">
      <div className="fixed top-0 left-0 h-screen z-50">
        <DashboardSidebar userType="team" onLogout={handleLogout} />
      </div>
      
      <main className="flex-1 ml-64 overflow-auto">
        {/* Header - Fixed */}
        <div className="sticky top-0 z-10 bg-background border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Bem-vindo, {perfil?.nome_completo || 'Usuário'}!
              </h1>
              <p className="text-muted-foreground mt-1">
                Visão geral das atividades da equipe DMM
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Avatar className="h-10 w-10">
                <AvatarImage src={perfil?.url_avatar || '/placeholder.svg'} alt={perfil?.nome_completo} />
                <AvatarFallback>{perfil?.nome_completo?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div className="text-right">
                <p className="text-sm font-medium">{perfil?.nome_completo}</p>
                <p className="text-xs text-muted-foreground">
                  {perfil?.funcao === 'dmm_admin' ? 'Administrador' : 'Membro da Equipe'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="dmm-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Tarefas</CardTitle>
              <ListTodo className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tarefasStats.total}</div>
              <p className="text-xs text-muted-foreground">
                {tarefasStats.emAndamento} em andamento
              </p>
            </CardContent>
          </Card>

          <Card className="dmm-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Checklists</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{checklistStats.total}</div>
              <p className="text-xs text-muted-foreground">
                {checklistStats.concluidos} concluídos
              </p>
            </CardContent>
          </Card>

          <Card className="dmm-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Empresas Ativas</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{empresas.filter(e => e.status === 'ativo').length}</div>
              <p className="text-xs text-muted-foreground">
                Clientes ativos
              </p>
            </CardContent>
          </Card>

          <Card className="dmm-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tarefas Atrasadas</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tarefasStats.atrasadas}</div>
              <p className="text-xs text-muted-foreground">
                Tarefas vencidas
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Minhas Tarefas */}
          <Card className="dmm-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-purple-600" />
                Minhas Tarefas
              </CardTitle>
              <CardDescription>
                Tarefas em que você está atribuído
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tarefasUrgentes.length === 0 ? <p className="text-muted-foreground text-center py-4">
                  Nenhuma tarefa atribuída no momento
                </p> : <div className="space-y-3">
                  {tarefasUrgentes.map(tarefa => {
                const empresa = empresas.find(e => e.id === tarefa.empresa_id);
                const statusColor = {
                  'pode_fazer': 'bg-slate-100 text-slate-700',
                  'deve_fazer': 'bg-orange-100 text-orange-700',
                  'em_andamento': 'bg-purple-100 text-purple-700',
                  'em_revisao': 'bg-blue-100 text-blue-700',
                  'concluido': 'bg-green-100 text-green-700',
                  'rejeitado': 'bg-red-100 text-red-700'
                }[tarefa.status] || 'bg-gray-100 text-gray-700';
                const statusLabel = {
                  'pode_fazer': 'Pode Fazer',
                  'deve_fazer': 'Deve Fazer',
                  'em_andamento': 'Em Andamento',
                  'em_revisao': 'Em Revisão',
                  'concluido': 'Concluído',
                  'rejeitado': 'Rejeitado'
                }[tarefa.status] || tarefa.status;
                return <div key={tarefa.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium line-clamp-2 break-words">{tarefa.titulo}</h4>
                          <p className="text-xs text-muted-foreground">{empresa?.nome}</p>
                          {tarefa.data_entrega && <p className="text-xs text-muted-foreground">
                              Entrega: {new Date(tarefa.data_entrega).toLocaleDateString('pt-BR')}
                            </p>}
                        </div>
                        <Badge className={statusColor}>
                          {statusLabel}
                        </Badge>
                      </div>;
              })}
                </div>}
            </CardContent>
          </Card>

          {/* Minhas Recorrências */}
          <Card className="dmm-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-green-600" />
                Minhas Recorrências
              </CardTitle>
              <CardDescription>
                Tarefas recorrentes em que você está atribuído
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                const tarefasRecorrentes = tarefas.filter(t => 
                  t.status === 'recorrente' && 
                  responsaveis.some(resp => resp.tarefa_id === t.id)
                );

                return tarefasRecorrentes.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhuma recorrência atribuída
                  </p>
                ) : (
                  <div className="space-y-3">
                    {tarefasRecorrentes.slice(0, 5).map(tarefa => {
                const empresa = empresas.find(e => e.id === tarefa.empresa_id);
                return <div key={tarefa.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium line-clamp-2 break-words">{tarefa.titulo}</h4>
                          <p className="text-xs text-muted-foreground">{empresa?.nome}</p>
                          {tarefa.data_entrega && <p className="text-xs text-muted-foreground">
                              Entrega: {new Date(tarefa.data_entrega).toLocaleDateString('pt-BR')}
                            </p>}
                        </div>
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Recorrente
                        </Badge>
                       </div>;
                    })}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Atividade Recente */}
          <Card className="dmm-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Atividade Recente
              </CardTitle>
              <CardDescription>
                Últimas tarefas e checklists criados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {atividadeRecente.length === 0 ? <p className="text-muted-foreground text-center py-4">
                  Nenhuma atividade recente
                </p> : <div className="space-y-3">
                  {atividadeRecente.map(item => <div key={`${item.tipo}-${item.id}`} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className={`w-2 h-2 rounded-full ${item.tipo === 'tarefa' ? 'bg-blue-500' : 'bg-green-500'}`} />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium line-clamp-2 break-words">{item.titulo}</h4>
                        <p className="text-xs text-muted-foreground">{item.empresa}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {item.tipo}
                      </Badge>
                    </div>)}
                </div>}
            </CardContent>
          </Card>

          {/* Tarefas por Responsável DMM */}
          <Card className="dmm-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                Tarefas por Responsável
              </CardTitle>
              <CardDescription>
                Distribuição de tarefas entre responsáveis da DMM
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {perfisEquipe.filter(p => p.funcao === 'dmm_admin' || p.funcao === 'dmm_membro').map(responsavel => {
                // Buscar contagem de tarefas do responsável
                const tarefasDoResponsavel = tarefasPorResponsavel[responsavel.id] || 0;

                return <div key={responsavel.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={responsavel.url_avatar || ''} alt={responsavel.nome_completo} />
                          <AvatarFallback>{responsavel.nome_completo.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="text-sm font-medium">{responsavel.nome_completo}</h4>
                          <p className="text-xs text-muted-foreground">
                            {responsavel.funcao === 'dmm_admin' ? 'Administrador' : 'Membro'}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {tarefasDoResponsavel} tarefas
                      </Badge>
                    </div>;
              })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resumo por Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status das Tarefas */}
          <Card className="dmm-card">
            <CardHeader>
              <CardTitle>Status das Tarefas</CardTitle>
              <CardDescription>Distribuição e funil de conversão das tarefas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Funil Visual */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 bg-slate-100 dark:bg-slate-800 rounded">
                    <span className="text-sm font-medium">Poderia Fazer</span>
                    <Badge variant="secondary">{tarefas.filter(t => t.status === 'pode_fazer').length}</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-orange-100 dark:bg-orange-800 rounded ml-2">
                    <span className="text-sm font-medium">Devemos Fazer</span>
                    <Badge variant="secondary">{tarefas.filter(t => t.status === 'deve_fazer').length}</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-pink-100 dark:bg-pink-800 rounded ml-4">
                    <span className="text-sm font-medium">Pronto para Fazer</span>
                    <Badge variant="secondary">{tarefas.filter(t => t.status === 'pronto_fazer').length}</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-100 dark:bg-purple-800 rounded ml-6">
                    <span className="text-sm font-medium">Em Progresso</span>
                    <Badge variant="secondary">{tarefasStats.emAndamento}</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-100 dark:bg-blue-800 rounded ml-8">
                    <span className="text-sm font-medium">Em Revisão</span>
                    <Badge variant="secondary">{tarefas.filter(t => t.status === 'em_revisao').length}</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-100 dark:bg-green-800 rounded ml-10">
                    <span className="text-sm font-medium">Concluído</span>
                    <Badge className="bg-green-100 text-green-700">{tarefasStats.concluidas}</Badge>
                  </div>
                </div>
                
                {/* Outros Status */}
                <div className="pt-2 border-t space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Recorrente</span>
                    <Badge variant="outline">{tarefas.filter(t => t.status === 'recorrente').length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Rejeitado</span>
                    <Badge variant="destructive">{tarefas.filter(t => t.status === 'rejeitado').length}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status dos Checklists */}
          <Card className="dmm-card">
            <CardHeader>
              <CardTitle>Status dos Checklists</CardTitle>
              <CardDescription>Distribuição dos checklists por tipo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Pendências Cliente</span>
                  <Badge variant="outline">{checklistStats.pendenciasCliente}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Concluídos</span>
                  <Badge className="bg-green-100 text-green-700">{checklistStats.concluidos}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ações Rápidas */}
        <Card className="dmm-card mt-6">
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>Acesso rápido às principais funcionalidades</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button onClick={() => navigate('/tasks-team')} className="dmm-btn-primary justify-start">
                <Plus className="h-4 w-4 mr-2" />
                Nova Tarefa
              </Button>
              <Button onClick={() => navigate('/checklist-team')} variant="outline" className="justify-start">
                <CheckSquare className="h-4 w-4 mr-2" />
                Novo Checklist
              </Button>
              <Button variant="outline" className="justify-start" disabled>
                <BarChart3 className="h-4 w-4 mr-2" />
                Relatórios
              </Button>
            </div>
          </CardContent>
        </Card>
        </div>
      </main>
    </div>;
};
export default TeamDashboard;