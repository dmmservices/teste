import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, Copy, Check, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useEmpresas } from '@/hooks/useEmpresas';
import { useAuthContext } from '@/contexts/AuthContext';
import PasswordGenerator from './PasswordGenerator';

// Temporary type until Supabase types are updated
type Acesso = any;
interface AccessEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (acesso: Omit<Acesso, 'id' | 'criado_em' | 'atualizado_em'>) => void;
  acesso?: Acesso;
  isLoading?: boolean;
}
const AccessEditModal: React.FC<AccessEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  acesso,
  isLoading = false
}) => {
  const {
    empresas
  } = useEmpresas();
  const {
    perfil
  } = useAuthContext();
  const [formData, setFormData] = useState({
    nome: '',
    site: '',
    usuario: '',
    senha_criptografada: '',
    status: true,
    empresa_id: '',
    notas: '',
    totp_secret: '',
    totp_enabled: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState({
    usuario: false,
    senha: false
  });
  const [activeTab, setActiveTab] = useState('dados');
  useEffect(() => {
    if (acesso) {
      setFormData({
        nome: acesso.nome || '',
        site: acesso.site || '',
        usuario: acesso.usuario || '',
        senha_criptografada: acesso.senha_criptografada || '',
        status: acesso.status ?? true,
        empresa_id: acesso.empresa_id || '',
        notas: acesso.notas || '',
        totp_secret: acesso.totp_secret || '',
        totp_enabled: acesso.totp_enabled ?? false
      });
    } else {
      // Valores padrão para novo acesso
      setFormData({
        nome: '',
        site: '',
        usuario: '',
        senha_criptografada: '',
        status: true,
        empresa_id: '',
        notas: '',
        totp_secret: '',
        totp_enabled: false
      });
    }
  }, [acesso, perfil]);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) {
      toast.error('Nome é obrigatório!');
      return;
    }
    if (!formData.site.trim()) {
      toast.error('Site é obrigatório!');
      return;
    }
    if (!formData.usuario.trim()) {
      toast.error('Usuário é obrigatório!');
      return;
    }
    if (!formData.senha_criptografada.trim()) {
      toast.error('Senha é obrigatória!');
      return;
    }
    if (!formData.empresa_id) {
      toast.error('Empresa é obrigatória!');
      return;
    }
    const acessoData = {
      ...formData,
      criado_por: acesso ? acesso.criado_por : perfil?.id || '',
      atualizado_por: perfil?.id || '',
      ultimo_acesso: null
    };
    onSave(acessoData);
  };
  const copyToClipboard = async (text: string, field: 'usuario' | 'senha') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied({
        ...copied,
        [field]: true
      });
      setTimeout(() => setCopied({
        ...copied,
        [field]: false
      }), 2000);
      toast.success(`${field === 'usuario' ? 'Usuário' : 'Senha'} copiado para área de transferência!`);
    } catch (error) {
      toast.error(`Erro ao copiar ${field}!`);
    }
  };
  const openSite = () => {
    if (formData.site) {
      const url = formData.site.startsWith('http') ? formData.site : `https://${formData.site}`;
      window.open(url, '_blank');
    }
  };
  const generateTOTPSecret = () => {
    // Generate a random base32 secret for TOTP
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };
  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {acesso ? 'Editar Acesso' : 'Novo Acesso'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="dados">Dados do Acesso</TabsTrigger>
              <TabsTrigger value="senha">Gerador de Senha</TabsTrigger>
            </TabsList>

            <TabsContent value="dados" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input id="nome" value={formData.nome} onChange={e => setFormData({
                  ...formData,
                  nome: e.target.value
                })} placeholder="Ex: Facebook Business" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="site">Site *</Label>
                  <div className="flex gap-2">
                    <Input id="site" value={formData.site} onChange={e => setFormData({
                    ...formData,
                    site: e.target.value
                  })} placeholder="Ex: facebook.com/business" required />
                    <Button type="button" variant="outline" size="icon" onClick={openSite} disabled={!formData.site}>
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="usuario">Usuário *</Label>
                  <div className="flex gap-2">
                    <Input id="usuario" value={formData.usuario} onChange={e => setFormData({
                    ...formData,
                    usuario: e.target.value
                  })} placeholder="Email ou nome de usuário" required />
                    <Button type="button" variant="outline" size="icon" onClick={() => copyToClipboard(formData.usuario, 'usuario')} disabled={!formData.usuario}>
                      {copied.usuario ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="senha">Senha *</Label>
                  <div className="flex gap-2">
                    <Input id="senha" type={showPassword ? 'text' : 'password'} value={formData.senha_criptografada} onChange={e => setFormData({
                    ...formData,
                    senha_criptografada: e.target.value
                  })} placeholder="Senha do acesso" required />
                    <Button type="button" variant="outline" size="icon" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button type="button" variant="outline" size="icon" onClick={() => copyToClipboard(formData.senha_criptografada, 'senha')} disabled={!formData.senha_criptografada}>
                      {copied.senha ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="empresa">Empresa *</Label>
                  <Select value={formData.empresa_id} onValueChange={value => setFormData({
                  ...formData,
                  empresa_id: value
                })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      {empresas.map(empresa => <SelectItem key={empresa.id} value={empresa.id}>
                          {empresa.nome}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 flex items-center justify-between">
                  <Label htmlFor="status">Status Ativo</Label>
                  <Switch id="status" checked={formData.status} onCheckedChange={checked => setFormData({
                  ...formData,
                  status: checked
                })} />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch checked={formData.totp_enabled} onCheckedChange={checked => setFormData({
                  ...formData,
                  totp_enabled: checked
                })} />
                  <Label>Habilitar 2FA (TOTP)</Label>
                </div>
                
                {formData.totp_enabled && <div className="space-y-2">
                    <Label htmlFor="totp_secret">Chave Secreta TOTP</Label>
                    <div className="flex space-x-2">
                      <Input id="totp_secret" value={formData.totp_secret} onChange={e => setFormData({
                    ...formData,
                    totp_secret: e.target.value
                  })} placeholder="Chave secreta do autenticador" />
                      
                    </div>
                    <p className="text-sm text-muted-foreground">Cole aqui a chave secreta (Secret Key) gerada pelo site</p>
                  </div>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notas">Notas</Label>
                <Textarea id="notas" value={formData.notas} onChange={e => setFormData({
                ...formData,
                notas: e.target.value
              })} placeholder="Notas adicionais sobre o acesso..." rows={3} />
              </div>
            </TabsContent>

            <TabsContent value="senha" className="mt-4">
              <PasswordGenerator value={formData.senha_criptografada} onChange={password => setFormData({
              ...formData,
              senha_criptografada: password
            })} />
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : acesso ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>;
};
export default AccessEditModal;