import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface FirstAccessEmailModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (email: string, nomeCompleto: string) => void;
  clienteNome: string;
}

export const FirstAccessEmailModal: React.FC<FirstAccessEmailModalProps> = ({
  open,
  onClose,
  onSubmit,
  clienteNome
}) => {
  const [email, setEmail] = useState('');
  const [nomeCompleto, setNomeCompleto] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !nomeCompleto.trim()) {
      toast.error('Preencha todos os campos');
      return;
    }

    onSubmit(email.trim(), nomeCompleto.trim());
    setEmail('');
    setNomeCompleto('');
  };

  const handleClose = () => {
    setEmail('');
    setNomeCompleto('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Definir Primeiro Acesso</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Cliente criado com sucesso! Agora defina o primeiro usuário de acesso para <strong>{clienteNome}</strong>.
          </p>

          <div>
            <Label htmlFor="nome">Nome Completo *</Label>
            <Input
              id="nome"
              value={nomeCompleto}
              onChange={(e) => setNomeCompleto(e.target.value)}
              placeholder="Nome completo do usuário"
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
              placeholder="email@exemplo.com"
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit">
              Criar Acesso
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
