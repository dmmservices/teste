import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Key } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';
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
import { PasswordDisplayModal } from './PasswordDisplayModal';

type Perfil = Tables<'perfis'>;
type Cliente = Tables<'empresas'>;

interface ClientAccessManagementModalProps {
  open: boolean;
  onClose: () => void;
  cliente: Cliente;
}

export const ClientAccessManagementModal: React.FC<ClientAccessManagementModalProps> = ({
  open,
  onClose,
  cliente
}) => {
  const queryClient = useQueryClient();
  const [isAddingAccess, setIsAddingAccess] = useState(false);
  const [editingAccess, setEditingAccess] = useState<Perfil | null>(null);
  const [email, setEmail] = useState('');
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accessToDelete, setAccessToDelete] = useState<Perfil | null>(null);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [accessToReset, setAccessToReset] = useState<Perfil | null>(null);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [principal, setPrincipal] = useState(false);

  const { data: acessos = [], isLoading } = useQuery({
    queryKey: ['client-accesses', cliente.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('perfis')
        .select('*')
        .eq('empresa_id', cliente.id)
        .in('funcao', ['cliente_admin', 'cliente_membro']);

      if (error) throw error;
      return data as Perfil[];
    },
    enabled: open,
  });

  const createAccess = useMutation({
    mutationFn: async ({ email, nomeCompleto, principal }: { email: string; nomeCompleto: string; principal: boolean }) => {
      // Generate random password
      const senha = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase();

      // Call edge function to create auth user
      const { data: authData, error: authError } = await supabase.functions.invoke('create-auth-users-v2', {
        body: {
          users: [{
            email,
            password: senha,
            empresa_id: cliente.id,
            nome_completo: nomeCompleto,
            funcao: 'cliente_membro',
            principal
          }]
        }
      });

      if (authError) throw authError;
      
      return { email, senha };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-accesses', cliente.id] });
      setGeneratedEmail(data.email);
      setGeneratedPassword(data.senha);
      setPasswordModalOpen(true);
      setIsAddingAccess(false);
      setEmail('');
      setNomeCompleto('');
      toast.success('Acesso criado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar acesso');
    },
  });

  const updateAccess = useMutation({
    mutationFn: async ({ id, email, nomeCompleto, principal }: { id: string; email: string; nomeCompleto: string; principal: boolean }) => {
      console.log('Atualizando acesso:', { id, email, nomeCompleto, principal });

      // Se está mudando para principal, primeiro remover o principal atual
      if (principal) {
        const { error: updatePrincipalError } = await supabase
          .from('perfis')
          .update({ principal: false })
          .eq('empresa_id', cliente.id)
          .eq('principal', true)
          .neq('id', id);

        if (updatePrincipalError) {
          console.error('Erro ao atualizar principal anterior:', updatePrincipalError);
        }
      }

      const { data, error } = await supabase
        .from('perfis')
        .update({
          nome_completo: nomeCompleto,
          principal,
        })
        .eq('id', id)
        .select();

      if (error) {
        console.error('Erro ao atualizar perfil:', error);
        throw error;
      }

      console.log('Perfil atualizado com sucesso:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-accesses', cliente.id] });
      setEditingAccess(null);
      setEmail('');
      setNomeCompleto('');
      setPrincipal(false);
      setIsAddingAccess(false);
      toast.success('Acesso atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar acesso');
    },
  });

  const deleteAccess = useMutation({
    mutationFn: async (accessId: string) => {
      console.log('Tentando excluir acesso:', accessId);
      
      // Buscar o perfil a ser deletado
      const accessToDelete = acessos.find(a => a.id === accessId);
      if (!accessToDelete) {
        throw new Error('Acesso não encontrado');
      }

      console.log('Deletando usuário do email:', accessToDelete.email);

      // Chamar edge function para deletar usuário do auth e perfil
      const { data, error } = await supabase.functions.invoke('delete-auth-user', {
        body: {
          email: accessToDelete.email
        }
      });

      if (error) {
        console.error('Erro ao deletar usuário:', error);
        throw error;
      }

      console.log('Usuário deletado com sucesso:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-accesses', cliente.id] });
      setDeleteDialogOpen(false);
      setAccessToDelete(null);
      toast.success('Acesso excluído com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao excluir acesso');
      setDeleteDialogOpen(false);
      setAccessToDelete(null);
    },
  });

  const resetPassword = useMutation({
    mutationFn: async (email: string) => {
      const senha = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase();
      
      // Chamar edge function para resetar senha
      const { error } = await supabase.functions.invoke('reset-user-password', {
        body: {
          email,
          newPassword: senha
        }
      });

      if (error) throw error;
      
      return { email, senha };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-accesses', cliente.id] });
      setGeneratedEmail(data.email);
      setGeneratedPassword(data.senha);
      setPasswordModalOpen(true);
      setResetPasswordDialogOpen(false);
      setAccessToReset(null);
      toast.success('Senha resetada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao resetar senha');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingAccess) {
      updateAccess.mutate({
        id: editingAccess.id,
        email,
        nomeCompleto,
        principal,
      });
    } else {
      createAccess.mutate({ email, nomeCompleto, principal });
    }
  };

  const handleEdit = (access: Perfil) => {
    setEditingAccess(access);
    setEmail(access.email);
    setNomeCompleto(access.nome_completo);
    setPrincipal(!!access.principal);
    setIsAddingAccess(true);
  };

  const handleCancelEdit = () => {
    setIsAddingAccess(false);
    setEditingAccess(null);
    setEmail('');
    setNomeCompleto('');
    setPrincipal(false);
  };

  const handleDeleteClick = (access: Perfil) => {
    // Não permitir exclusão de usuário principal
    if (access.principal) {
      toast.error('Não é possível excluir o usuário principal');
      return;
    }
    setAccessToDelete(access);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (accessToDelete) {
      await deleteAccess.mutateAsync(accessToDelete.id);
      setDeleteDialogOpen(false);
      setAccessToDelete(null);
    }
  };

  const handleResetPasswordClick = (access: Perfil) => {
    setAccessToReset(access);
    setResetPasswordDialogOpen(true);
  };

  const handleResetPasswordConfirm = async () => {
    if (accessToReset) {
      await resetPassword.mutateAsync(accessToReset.email);
    }
  };

  const isClienteEncerrado = cliente.status === 'encerrado';

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar Acessos - {cliente.nome}</DialogTitle>
          </DialogHeader>

          {isClienteEncerrado && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg">
              <p className="text-sm font-medium">
                Este cliente está com status ENCERRADO. Todos os acessos estão bloqueados.
              </p>
            </div>
          )}

          <div className="space-y-4">
            {!isAddingAccess ? (
              <Button 
                onClick={() => setIsAddingAccess(true)}
                disabled={isClienteEncerrado}
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Acesso
              </Button>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 border p-4 rounded-lg">
                <h3 className="font-semibold">
                  {editingAccess ? 'Editar Acesso' : 'Novo Acesso'}
                </h3>
                
                <div>
                  <Label htmlFor="nome">Nome Completo *</Label>
                  <Input
                    id="nome"
                    value={nomeCompleto}
                    onChange={(e) => setNomeCompleto(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={!!editingAccess}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="principal"
                    checked={principal}
                    onChange={(e) => setPrincipal(e.target.checked)}
                    className="h-4 w-4 rounded border-border"
                  />
                  <Label htmlFor="principal" className="cursor-pointer">
                    Usuário Principal
                  </Label>
                </div>

                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    disabled={createAccess.isPending || updateAccess.isPending}
                  >
                    {createAccess.isPending || updateAccess.isPending
                      ? 'Salvando...'
                      : editingAccess
                      ? 'Salvar'
                      : 'Criar'}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCancelEdit}>
                    Cancelar
                  </Button>
                </div>
              </form>
            )}

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Principal</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : acessos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Nenhum acesso cadastrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    acessos.map((access) => (
                      <TableRow key={access.id}>
                        <TableCell>{access.nome_completo}</TableCell>
                        <TableCell>{access.email}</TableCell>
                        <TableCell>
                          {access.principal ? (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                              Principal
                            </span>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResetPasswordClick(access)}
                              title="Resetar Senha"
                              disabled={isClienteEncerrado || resetPassword.isPending}
                            >
                              <Key className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(access)}
                              disabled={isClienteEncerrado}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(access)}
                              className="text-destructive hover:text-destructive"
                              disabled={access.principal || isClienteEncerrado || deleteAccess.isPending}
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
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o acesso de "{accessToDelete?.nome_completo}"?
              Esta ação não pode ser desfeita.
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

      <AlertDialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Reset de Senha</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja resetar a senha do usuário "{accessToReset?.nome_completo}"?
              Uma nova senha temporária será gerada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetPasswordConfirm}>
              Resetar Senha
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PasswordDisplayModal
        open={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        email={generatedEmail}
        password={generatedPassword}
      />
    </>
  );
};
