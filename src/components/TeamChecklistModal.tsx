
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuthContext } from '@/contexts/AuthContext';
import { useChecklists } from '@/hooks/useChecklists';
import { useEmpresas } from '@/hooks/useEmpresas';
import type { Enums } from '@/integrations/supabase/types';

type PrioridadeTarefa = Enums<'prioridade_tarefa'>;

interface TeamChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const TeamChecklistModal: React.FC<TeamChecklistModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { perfil } = useAuthContext();
  const { criarItem } = useChecklists();
  const { empresas } = useEmpresas();
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    prioridade: 'media' as PrioridadeTarefa,
    empresa_id: '',
    data_entrega: ''
  });
  const [isLoading, setIsLoading] = useState(false);

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
      const checklistData = {
        titulo: formData.titulo.trim(),
        descricao: formData.descricao.trim() || null,
        empresa_id: formData.empresa_id,
        tipo: 'pendencia_dmm' as const,
        criado_por: perfil?.id,
        concluido: false,
        prioridade: formData.prioridade,
        data_entrega: formData.data_entrega ? new Date(formData.data_entrega).toISOString() : null
      };

      await criarItem(checklistData);

      toast.success('Checklist da DMM criado com sucesso!');
      setFormData({ 
        titulo: '', 
        descricao: '', 
        prioridade: 'media', 
        empresa_id: '',
        data_entrega: ''
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao criar checklist:', error);
      toast.error('Erro ao criar checklist. Verifique os dados e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ 
      titulo: '', 
      descricao: '', 
      prioridade: 'media', 
      empresa_id: '',
      data_entrega: ''
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] dark:bg-card dark:border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Nova Checklist DMM</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="empresa" className="text-foreground">Empresa *</Label>
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
            <Label htmlFor="titulo" className="text-foreground">Título *</Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
              placeholder="Título do checklist"
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
              placeholder="Detalhes do checklist"
              rows={3}
              className="dark:bg-input dark:border-border"
            />
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
              <Input
                id="data_entrega"
                type="datetime-local"
                value={formData.data_entrega}
                onChange={(e) => setFormData(prev => ({ ...prev, data_entrega: e.target.value }))}
                className="dark:bg-input dark:border-border"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              className="dark:border-border dark:text-foreground dark:hover:bg-muted"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading} 
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isLoading ? 'Salvando...' : 'Criar Checklist'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TeamChecklistModal;
