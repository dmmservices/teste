import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuthContext } from '@/contexts/AuthContext';
import { useEmpresas } from '@/hooks/useEmpresas';
import { useChecklists } from '@/hooks/useChecklists';
import type { Enums } from '@/integrations/supabase/types';

type TipoChecklist = Enums<'tipo_checklist'>;
type PrioridadeTarefa = Enums<'prioridade_tarefa'>;

interface ChecklistEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: any;
  onSuccess: () => void;
  isClientModal?: boolean;
}

const ChecklistEditModal: React.FC<ChecklistEditModalProps> = ({
  isOpen,
  onClose,
  item,
  onSuccess,
  isClientModal = false
}) => {
  const { perfil } = useAuthContext();
  const { empresas } = useEmpresas();
  const { atualizarItem } = useChecklists();
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    tipo: 'pendencia_dmm' as TipoChecklist,
    empresa_id: '',
    prioridade: 'media' as PrioridadeTarefa,
    data_entrega: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({
        titulo: item.titulo || '',
        descricao: item.descricao || '',
        tipo: item.tipo || 'pendencia_dmm',
        empresa_id: item.empresa_id || '',
        prioridade: item.prioridade || 'media',
        data_entrega: item.data_entrega ? 
          new Date(item.data_entrega).toISOString().slice(0, 16) : ''
      });
    }
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.titulo.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    if (!formData.empresa_id) {
      toast.error('Selecione uma empresa');
      return;
    }

    setIsLoading(true);

    try {
      const updateData = {
        id: item.id,
        titulo: formData.titulo.trim(),
        descricao: formData.descricao.trim() || null,
        tipo: formData.tipo,
        empresa_id: formData.empresa_id,
        prioridade: formData.prioridade,
        data_entrega: formData.data_entrega ? 
          new Date(formData.data_entrega).toISOString() : null,
        atualizado_em: new Date().toISOString()
      };

      console.log('Enviando dados para atualização:', updateData);
      
      await atualizarItem(updateData);

      toast.success('Item atualizado com sucesso!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
      toast.error('Erro ao atualizar item. Verifique os dados e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] dark:bg-card dark:border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Editar Item do Checklist</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="empresa" className="text-foreground">Empresa *</Label>
            <Select
              value={formData.empresa_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, empresa_id: value }))}
              required
              disabled={isClientModal && !!perfil?.empresa_id}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma empresa" />
              </SelectTrigger>
              <SelectContent>
                {isClientModal && perfil?.empresa_id ? 
                  empresas.filter(e => e.id === perfil.empresa_id).map((empresa) => (
                    <SelectItem key={empresa.id} value={empresa.id}>
                      {empresa.nome}
                    </SelectItem>
                  ))
                  :
                  empresas.map((empresa) => (
                    <SelectItem key={empresa.id} value={empresa.id}>
                      {empresa.nome}
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="titulo" className="text-foreground">Título *</Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
              placeholder="Digite o título do item"
              required
              className="dark:bg-input dark:border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao" className="text-foreground">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
              placeholder="Digite a descrição do item (opcional)"
              rows={3}
              className="dark:bg-input dark:border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo" className="text-foreground">Tipo</Label>
            <Select
              value={formData.tipo}
              onValueChange={(value: TipoChecklist) => 
                setFormData(prev => ({ ...prev, tipo: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendencia_dmm">Pendência DMM</SelectItem>
                <SelectItem value="pendencia_cliente">Pendência Cliente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prioridade" className="text-foreground">Prioridade</Label>
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

            <div className="space-y-2">
              <Label htmlFor="data_entrega" className="text-foreground">Data de Entrega</Label>
              <div className="flex gap-2">
                <Input
                  id="data_entrega"
                  type="datetime-local"
                  value={formData.data_entrega}
                  onChange={(e) => setFormData(prev => ({ ...prev, data_entrega: e.target.value }))}
                  className="dark:bg-input dark:border-border flex-1"
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

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="dark:border-border dark:text-foreground dark:hover:bg-muted"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ChecklistEditModal;