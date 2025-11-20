import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface PasswordDisplayModalProps {
  open: boolean;
  onClose: () => void;
  email?: string;
  password: string;
  title?: string;
}

export const PasswordDisplayModal: React.FC<PasswordDisplayModalProps> = ({
  open,
  onClose,
  email,
  password,
  title = 'Senha Temporária Gerada'
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const textToCopy = email 
      ? `E-mail: ${email}\nSenha: ${password}`
      : `Senha: ${password}`;
    
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    toast.success('Copiado para área de transferência!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {email && (
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                value={email}
                readOnly
                className="bg-muted"
              />
            </div>
          )}

          <div>
            <Label htmlFor="password">Senha Temporária</Label>
            <div className="flex gap-2">
              <Input
                id="password"
                value={password}
                readOnly
                className="bg-muted font-mono"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Esta senha é temporária e deve ser utilizada no primeiro acesso.
            O usuário poderá alterar a senha após o login.
          </p>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
