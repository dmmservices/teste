import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Calendar, Building2, MoreHorizontal, Edit, Trash2, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import DashboardSidebar from '@/components/DashboardSidebar';
import ClientChecklistModal from '@/components/ClientChecklistModal';
import ChecklistEditModal from '@/components/ChecklistEditModal';
import { useChecklists } from '@/hooks/useChecklists';
import { usePerfis } from '@/hooks/usePerfis';
import { useEmpresas } from '@/hooks/useEmpresas';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const ClientChecklist = () => {
  const { perfil } = useAuthContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [isClientChecklistModalOpen, setIsClientChecklistModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [checklistToDelete, setChecklistToDelete] = useState(null);
  const [activeTab, setActiveTab] = useState('dmm');
  
  // Filter states
  const [selectedPriority, setSelectedPriority] = useState('all');
  
  const { checklists, isLoading, atualizarItem, deletarItem } = useChecklists();
  const { perfisEquipe, getNomeUsuario } = usePerfis();
  const { empresas } = useEmpresas();

  // Filtrar checklists da empresa do cliente
  const checklistsDoCliente = useMemo(() => {
    if (!perfil?.empresa_id) return [];
    return checklists.filter(checklist => checklist.empresa_id === perfil.empresa_id);
  }, [checklists, perfil?.empresa_id]);

  // Aplicar filtros de busca e outros
  const checklistsFiltrados = useMemo(() => {
    return checklistsDoCliente.filter(checklist => {
      const matchesSearch = !searchTerm || 
        checklist.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        checklist.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesPriority = selectedPriority === 'all' || checklist.prioridade === selectedPriority;
      
      return matchesSearch && matchesPriority;
    });
  }, [checklistsDoCliente, searchTerm, selectedPriority]);

  // Separar checklists por tipo e status
  const checklistsPorTipo = useMemo(() => {
    const dmmPendentes = checklistsFiltrados.filter(c => c.tipo === 'pendencia_dmm' && !c.concluido);
    const dmmConcluidos = checklistsFiltrados.filter(c => c.tipo === 'pendencia_dmm' && c.concluido);
    const clientePendentes = checklistsFiltrados.filter(c => c.tipo === 'pendencia_cliente' && !c.concluido);
    const clienteConcluidos = checklistsFiltrados.filter(c => c.tipo === 'pendencia_cliente' && c.concluido);
    
    return {
      dmm: {
        pendentes: dmmPendentes,
        concluidos: dmmConcluidos
      },
      cliente: {
        pendentes: clientePendentes,
        concluidos: clienteConcluidos
      }
    };
  }, [checklistsFiltrados]);

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
    const s = String(dateString);
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
    if (m) {
      const [, y, mo, d, h, mi] = m;
      return `${d}/${mo}/${y} ${h}:${mi}`;
    }
    try {
      const d = new Date(s);
      const pad = (n) => String(n).padStart(2, '0');
      return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return s;
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
    return getNomeUsuario(criadorId);
  };

  const getEmpresaNome = (empresaId) => {
    if (!empresaId) return 'Sem empresa';
    const empresa = empresas.find(e => e.id === empresaId);
    return empresa?.nome || 'Empresa não encontrada';
  };

  const handleEditChecklist = (checklist) => {
    // Só pode editar checklists do cliente
    if (checklist.tipo === 'pendencia_cliente') {
      setSelectedChecklist(checklist);
      setIsEditModalOpen(true);
    }
  };

  const handleDeleteClick = (checklist) => {
    // Só pode excluir checklists do cliente
    if (checklist.tipo === 'pendencia_cliente') {
      setChecklistToDelete(checklist);
      setIsDeleteDialogOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (checklistToDelete) {
      try {
        await deletarItem(checklistToDelete.id);
        toast.success('Checklist excluído com sucesso!');
      } catch (error) {
        toast.error('Erro ao excluir checklist');
      }
    }
    setIsDeleteDialogOpen(false);
    setChecklistToDelete(null);
  };

  const handleToggleComplete = async (checklist) => {
    // Só pode marcar como concluído checklists do cliente
    if (checklist.tipo === 'pendencia_cliente') {
      try {
        await atualizarItem({
          id: checklist.id,
          concluido: !checklist.concluido,
          concluido_em: !checklist.concluido ? new Date().toISOString() : null
        });
        toast.success(`Checklist ${!checklist.concluido ? 'concluído' : 'reaberto'} com sucesso!`);
      } catch (error) {
        console.error('Erro ao atualizar checklist:', error);
        toast.error('Erro ao atualizar pendência');
      }
    }
  };

  const clearFilters = () => {
    setSelectedPriority('all');
    setSearchTerm('');
  };

  const ChecklistCard = ({ checklist, showCompleted = false, canEdit = false }) => (
    <div 
      key={checklist.id} 
      className={`border border-border rounded-lg p-4 hover:bg-muted/50 dark:hover:bg-muted/20 bg-card dark:bg-card transition-colors ${checklist.concluido ? 'opacity-75' : ''}`}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={checklist.concluido}
          onCheckedChange={() => handleToggleComplete(checklist)}
          className="mt-1"
          disabled={checklist.tipo === 'pendencia_dmm'}
        />
        
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-foreground">{getEmpresaNome(checklist.empresa_id)}</span>
          </div>
          
          <h4 className={`font-semibold text-foreground line-clamp-2 break-words ${checklist.concluido ? 'line-through' : ''}`}>
            {checklist.titulo}
          </h4>

          {checklist.descricao && (
            <p className="text-sm text-muted-foreground line-clamp-2 break-words">{checklist.descricao}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <Badge className={getPrioridadeColor(checklist.prioridade)}>
              {checklist.prioridade === 'alta' ? 'Alta' : checklist.prioridade === 'media' ? 'Média' : 'Baixa'}
            </Badge>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Criado por: {getCriadorNome(checklist.criado_por)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Criado em: {new Date(checklist.criado_em).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
            
             {checklist.data_entrega && (
               <div className="flex items-center gap-1">
                 <Calendar className="h-3 w-3 text-muted-foreground" />
                 <span className={`font-bold ${getDateColor(checklist.data_entrega)}`}>
                   <strong>Entrega: {formatDateForDisplay(checklist.data_entrega)}</strong>
                 </span>
               </div>
             )}
          </div>
        </div>

        {canEdit && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="dark:bg-popover dark:border-border">
              <DropdownMenuItem 
                onClick={() => handleEditChecklist(checklist)}
                className="dark:hover:bg-muted dark:focus:bg-muted"
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-red-600 dark:text-red-400 dark:hover:bg-muted dark:focus:bg-muted"
                onClick={() => handleDeleteClick(checklist)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );

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
                <h1 className="text-3xl font-bold text-foreground">Meus Checklists</h1>
                <p className="text-muted-foreground">
                  Acompanhe pendências da DMM e gerencie suas próprias pendências
                </p>
              </div>
            </div>

            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar checklists..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as prioridades</SelectItem>
                  <SelectItem value="alta">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      Alta
                    </div>
                  </SelectItem>
                  <SelectItem value="media">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                      Média
                    </div>
                  </SelectItem>
                  <SelectItem value="baixa">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      Baixa
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={clearFilters}>
                Limpar Filtros
              </Button>
            </div>

            {/* Tabs - Only Client Checklists */}
            <Tabs value="cliente" className="w-full">
              <TabsList className="grid w-full grid-cols-1">
                <TabsTrigger 
                  value="cliente"
                  className="data-[state=active]:bg-green-500 data-[state=active]:text-white"
                >
                  Minhas Pendências ({checklistsPorTipo.cliente.pendentes.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="cliente" className="space-y-6 mt-6">
                {/* Botão para criar novo checklist do cliente */}
                <div className="flex justify-end">
                  <Button 
                    onClick={() => setIsClientChecklistModalOpen(true)} 
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Pendência
                  </Button>
                </div>

                {/* Pendentes Cliente */}
                <Card className="dark:bg-card dark:border-border">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-foreground">Pendentes</h3>
                      <Badge variant="secondary" className="dark:bg-secondary dark:text-secondary-foreground">
                        {checklistsPorTipo.cliente.pendentes.length}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 min-h-[80px] p-4 rounded-lg border-2 border-dashed border-muted-foreground/20">
                      {checklistsPorTipo.cliente.pendentes.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <div className="text-lg mb-2">📋</div>
                          <div>Nenhuma pendência sua</div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {checklistsPorTipo.cliente.pendentes.map((checklist) => (
                            <ChecklistCard key={checklist.id} checklist={checklist} canEdit={true} />
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Concluídos Cliente */}
                <Card className="dark:bg-card dark:border-border">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-foreground">Concluídas</h3>
                      <Badge variant="secondary" className="dark:bg-secondary dark:text-secondary-foreground">
                        {checklistsPorTipo.cliente.concluidos.length}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 min-h-[80px] p-4 rounded-lg border-2 border-dashed border-muted-foreground/20">
                      {checklistsPorTipo.cliente.concluidos.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <div className="text-lg mb-2">✅</div>
                          <div>Nenhuma pendência concluída</div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {checklistsPorTipo.cliente.concluidos.map((checklist) => (
                            <ChecklistCard key={checklist.id} checklist={checklist} showCompleted={true} canEdit={true} />
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Modais */}
      <ClientChecklistModal
        isOpen={isClientChecklistModalOpen}
        onClose={() => setIsClientChecklistModalOpen(false)}
        onSuccess={() => {}}
      />

      {selectedChecklist && (
        <ChecklistEditModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedChecklist(null);
          }}
          item={selectedChecklist}
          onSuccess={() => {
            setIsEditModalOpen(false);
            setSelectedChecklist(null);
          }}
          isClientModal={true}
        />
      )}

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este checklist? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ClientChecklist;