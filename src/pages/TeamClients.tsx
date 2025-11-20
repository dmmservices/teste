import React, { useState } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, Users } from 'lucide-react';
import { useClientes } from '@/hooks/useClientes';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ClientEditModal } from '@/components/ClientEditModal';
import { ClientAccessManagementModal } from '@/components/ClientAccessManagementModal';
import { PasswordDisplayModal } from '@/components/PasswordDisplayModal';
import { FirstAccessEmailModal } from '@/components/FirstAccessEmailModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Tables } from '@/integrations/supabase/types';

type Cliente = Tables<'empresas'>;

const statusColors: Record<string, string> = {
  'ativo': 'bg-green-500/10 text-green-500 border-green-500/20',
  'pausado': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  'encerrado': 'bg-red-500/10 text-red-500 border-red-500/20',
};

const statusLabels: Record<string, string> = {
  'ativo': 'Ativo',
  'pausado': 'Pausado',
  'encerrado': 'Encerrado',
};

const TeamClients = () => {
  const { clientes, isLoading, createCliente, updateCliente, deleteCliente } = useClientes();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState<Cliente | null>(null);
  const [accessModalOpen, setAccessModalOpen] = useState(false);
  const [clienteForAccess, setClienteForAccess] = useState<Cliente | null>(null);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [firstAccessModalOpen, setFirstAccessModalOpen] = useState(false);
  const [createdClienteId, setCreatedClienteId] = useState<string | null>(null);
  const [createdClienteNome, setCreatedClienteNome] = useState('');

  const filteredClientes = clientes
    .filter((cliente) => cliente.nome !== 'DMM Services')
    .filter((cliente) =>
      cliente.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const handleCreate = () => {
    setSelectedCliente(null);
    setIsModalOpen(true);
  };

  const handleEdit = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setIsModalOpen(true);
  };

  const handleSave = async (clienteData: any) => {
    if (selectedCliente) {
      await updateCliente.mutateAsync({ id: selectedCliente.id, cliente: clienteData });
      setIsModalOpen(false);
    } else {
      const result = await createCliente.mutateAsync(clienteData);
      setIsModalOpen(false);
      setCreatedClienteId(result.id);
      setCreatedClienteNome(result.nome);
      setFirstAccessModalOpen(true);
    }
  };

  const handleFirstAccessSubmit = async (email: string, nomeCompleto: string) => {
    if (!createdClienteId) return;

    try {
      const senha = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase();
      
      // Chamar edge function para criar usuário
      const { data, error } = await supabase.functions.invoke('create-auth-users-v2', {
        body: {
          users: [{
            email,
            password: senha,
            empresa_id: createdClienteId,
            nome_completo: nomeCompleto,
            funcao: 'cliente_admin',
            principal: true
          }]
        }
      });

      if (error) throw error;

      // Verificar se houve erro na criação
      if (data?.results?.[0]?.status === 'error') {
        throw new Error(data.results[0].message);
      }
      
      setFirstAccessModalOpen(false);
      setGeneratedEmail(email);
      setGeneratedPassword(senha);
      setPasswordModalOpen(true);
      setCreatedClienteId(null);
      setCreatedClienteNome('');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar acesso');
    }
  };

  const handleDeleteClick = (cliente: Cliente) => {
    setClienteToDelete(cliente);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (clienteToDelete) {
      await deleteCliente.mutateAsync(clienteToDelete.id);
      setDeleteDialogOpen(false);
      setClienteToDelete(null);
    }
  };

  const handleAccessManagementClick = (cliente: Cliente) => {
    setClienteForAccess(cliente);
    setAccessModalOpen(true);
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <div className="fixed top-0 left-0 h-screen z-50">
        <DashboardSidebar userType="team" />
      </div>

      <main className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Gestão de Clientes</h1>
              <p className="text-muted-foreground mt-1">
                Gerencie todos os clientes da DMM
              </p>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Cliente
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou slug..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Table */}
          <div className="bg-card rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tipo Contrato</TableHead>
                  <TableHead>Valor Projeto</TableHead>
                  <TableHead>Serviços</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredClientes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum cliente encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClientes.map((cliente) => (
                    <TableRow key={cliente.id}>
                      <TableCell>
                        <div className="font-medium">{cliente.nome}</div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={statusColors[cliente.status || 'ativo']}
                        >
                          {statusLabels[cliente.status || 'ativo']}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {cliente.tipo_contrato === 'recorrente' ? 'Recorrente' : cliente.tipo_contrato === 'unico' ? 'Único' : '-'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {cliente.valor_projeto
                          ? `R$ ${Number(cliente.valor_projeto).toLocaleString('pt-BR', {
                              minimumFractionDigits: 2,
                            })}`
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          {(() => {
                            try {
                              const servicos = Array.isArray(cliente.servicos) 
                                ? cliente.servicos 
                                : [];
                              return servicos.length > 0
                                ? servicos.slice(0, 2).join(', ') +
                                  (servicos.length > 2 ? ` +${servicos.length - 2}` : '')
                                : '-';
                            } catch {
                              return '-';
                            }
                          })()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAccessManagementClick(cliente)}
                            title="Gerenciar Acessos"
                          >
                            <Users className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(cliente)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(cliente)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>

      <ClientEditModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        cliente={selectedCliente}
        onSave={handleSave}
      />

      {clienteForAccess && (
        <ClientAccessManagementModal
          open={accessModalOpen}
          onClose={() => {
            setAccessModalOpen(false);
            setClienteForAccess(null);
          }}
          cliente={clienteForAccess}
        />
      )}

      <FirstAccessEmailModal
        open={firstAccessModalOpen}
        onClose={() => {
          setFirstAccessModalOpen(false);
          setCreatedClienteId(null);
          setCreatedClienteNome('');
        }}
        onSubmit={handleFirstAccessSubmit}
        clienteNome={createdClienteNome}
      />

      <PasswordDisplayModal
        open={passwordModalOpen}
        onClose={() => {
          setPasswordModalOpen(false);
          setGeneratedPassword('');
          setGeneratedEmail('');
        }}
        email={generatedEmail}
        password={generatedPassword}
        title="Acesso Criado com Sucesso"
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cliente "{clienteToDelete?.nome}"?
              Esta ação não pode ser desfeita e só será permitida se não houver
              registros associados (acessos, tarefas, checklists ou usuários).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TeamClients;
