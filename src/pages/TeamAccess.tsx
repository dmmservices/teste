import React, { useState, useMemo } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Plus, Search, Filter, Star, StarOff, Eye, EyeOff, Copy, Check, 
  ExternalLink, Edit, Globe, Lock, 
  Smartphone, Server, Database, Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useAcessos } from '@/hooks/useAcessos';
import { useFavoritosAcesso } from '@/hooks/useFavoritosAcesso';
import { useEmpresas } from '@/hooks/useEmpresas';
import { usePerfis } from '@/hooks/usePerfis';
import AccessEditModal from '@/components/AccessEditModal';
import TOTPDisplay from '@/components/TOTPDisplay';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TeamAccess = () => {
  const navigate = useNavigate();
  const { signOut, perfil } = useAuthContext();
  const { 
    acessos, 
    isLoading, 
    createAcesso, 
    updateAcesso, 
    toggleStatusAcesso, 
    registrarUltimoAcesso 
  } = useAcessos();
  const { isFavorito, toggleFavorito } = useFavoritosAcesso();
  const { empresas } = useEmpresas();
  const { getNomeUsuario } = usePerfis();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmpresa, setSelectedEmpresa] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  
  const [selectedAccess, setSelectedAccess] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAccess, setEditingAccess] = useState<any>(null);
  const [revealedPasswords, setRevealedPasswords] = useState<Set<string>>(new Set());
  const [copiedFields, setCopiedFields] = useState<{ [key: string]: string }>({});

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      navigate('/login');
    }
  };

  const filteredAcessos = useMemo(() => {
    return acessos.filter(acesso => {
      const matchesSearch = acesso.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           acesso.site.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           acesso.usuario.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesEmpresa = selectedEmpresa === 'all' || acesso.empresa_id === selectedEmpresa;
      
      const matchesFavorites = !showFavoritesOnly || isFavorito(acesso.id);

      return matchesSearch && matchesEmpresa && matchesFavorites;
    });
  }, [acessos, searchTerm, selectedEmpresa, showFavoritesOnly, isFavorito]);

  const getFavicon = (site: string) => {
    try {
      const domain = new URL(site.startsWith('http') ? site : `https://${site}`).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch {
      return null;
    }
  };

  const getCategoryIcon = (categoria: string) => {
    const icons = {
      social: Globe,
      ads: Smartphone,
      analytics: Database,
      email: Lock,
      hosting: Server,
      domain: Globe,
      payment: Lock,
      crm: Database,
      other: Globe
    };
    return icons[categoria as keyof typeof icons] || Globe;
  };

  const handleCreateAccess = () => {
    setEditingAccess(null);
    setIsEditModalOpen(true);
  };

  const handleEditAccess = (acesso: any) => {
    setEditingAccess(acesso);
    setIsEditModalOpen(true);
  };

  const handleSaveAccess = async (acessoData: any) => {
    try {
      if (editingAccess) {
        await updateAcesso.mutateAsync({ id: editingAccess.id, dados: acessoData });
      } else {
        await createAcesso.mutateAsync(acessoData);
      }
      setIsEditModalOpen(false);
      setEditingAccess(null);
    } catch (error) {
      console.error('Erro ao salvar acesso:', error);
    }
  };

  const handleToggleFavorite = async (acessoId: string) => {
    await toggleFavorito.mutateAsync(acessoId);
  };

  const handleRevealPassword = (acessoId: string) => {
    const newRevealed = new Set(revealedPasswords);
    if (newRevealed.has(acessoId)) {
      newRevealed.delete(acessoId);
    } else {
      newRevealed.add(acessoId);
    }
    setRevealedPasswords(newRevealed);
  };

  const handleCopy = async (text: string, acessoId: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedFields({ ...copiedFields, [`${acessoId}-${field}`]: field });
      setTimeout(() => {
        setCopiedFields(prev => {
          const newState = { ...prev };
          delete newState[`${acessoId}-${field}`];
          return newState;
        });
      }, 2000);
      toast.success(`${field === 'usuario' ? 'Usuário' : 'Senha'} copiado!`);
      
      // Registrar último acesso
      if (field === 'senha') {
        registrarUltimoAcesso.mutate(acessoId);
      }
    } catch (error) {
      toast.error('Erro ao copiar!');
    }
  };

  const handleOpenSite = (site: string) => {
    const url = site.startsWith('http') ? site : `https://${site}`;
    window.open(url, '_blank');
  };

  const selectedAccessData = selectedAccess ? acessos.find(a => a.id === selectedAccess) : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <div className="fixed">
        <DashboardSidebar userType="team" onLogout={handleLogout} />
      </div>
      
      <main className="flex-1 flex overflow-hidden ml-64">
        {/* Left Panel - Access List */}
        <div className="w-1/3 border-r border-border flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">Acessos</h1>
              <Button onClick={handleCreateAccess} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Novo Acesso
              </Button>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar acessos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="mb-4">
              <Select value={selectedEmpresa} onValueChange={setSelectedEmpresa}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas empresas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas empresas</SelectItem>
                  {empresas.map(empresa => (
                    <SelectItem key={empresa.id} value={empresa.id}>
                      {empresa.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

            </div>

            {/* Toggle filters */}
            <div className="flex gap-2">
              <Button
                variant={showFavoritesOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              >
                <Star className="h-4 w-4 mr-1" />
                Favoritos
              </Button>
            </div>
          </div>

          {/* Access List */}
          <div className="flex-1 overflow-y-auto">
            {filteredAcessos.map((acesso) => {
              const empresa = empresas.find(e => e.id === acesso.empresa_id);
              const favicon = getFavicon(acesso.site);
              const CategoryIcon = getCategoryIcon(acesso.categoria || 'other');
              const isSelected = selectedAccess === acesso.id;

              return (
                <div
                  key={acesso.id}
                  className={`p-4 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors ${
                    isSelected ? 'bg-muted border-l-4 border-l-primary' : ''
                  }`}
                  onClick={() => setSelectedAccess(acesso.id)}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
                      {favicon ? (
                        <img
                          src={favicon}
                          alt={`${acesso.nome} favicon`}
                          className="w-6 h-6"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.parentElement!.innerHTML = `<div class="h-5 w-5 text-muted-foreground">${Globe}</div>`;
                          }}
                        />
                      ) : (
                        <CategoryIcon className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-sm truncate">{acesso.nome}</h3>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleFavorite(acesso.id);
                            }}
                          >
                            {isFavorito(acesso.id) ? (
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            ) : (
                              <StarOff className="h-3 w-3 text-muted-foreground" />
                            )}
                          </Button>
                          <Badge variant={acesso.status ? "default" : "secondary"} className="text-xs">
                            {acesso.status ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{acesso.site}</p>
                      <p className="text-xs text-muted-foreground truncate">{acesso.usuario}</p>
                      <p className="text-xs text-muted-foreground">{empresa?.nome}</p>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredAcessos.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum acesso encontrado</p>
                <p className="text-sm">Tente ajustar os filtros ou criar um novo acesso</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Access Details */}
        <div className="flex-1 flex flex-col">
          {selectedAccessData ? (
            <>
              {/* Header */}
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                      {(() => {
                        const favicon = getFavicon(selectedAccessData.site);
                        const CategoryIcon = getCategoryIcon(selectedAccessData.categoria || 'other');
                        return (
                          <img
                            src={favicon || ''}
                            alt={`${selectedAccessData.nome} favicon`}
                            className="w-8 h-8"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.outerHTML = `<div class="flex items-center justify-center w-12 h-12"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg></div>`;
                            }}
                          />
                        );
                      })()}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{selectedAccessData.nome}</h2>
                      <p className="text-muted-foreground">{selectedAccessData.site}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenSite(selectedAccessData.site)}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Abrir Site
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditAccess(selectedAccessData)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleStatusAcesso.mutate({ id: selectedAccessData.id, status: !selectedAccessData.status })}
                    >
                      {selectedAccessData.status ? 'Desativar' : 'Ativar'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="grid grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Credenciais</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Usuário</label>
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            value={selectedAccessData.usuario}
                            readOnly
                            className="font-mono"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleCopy(selectedAccessData.usuario, selectedAccessData.id, 'usuario')}
                          >
                            {copiedFields[`${selectedAccessData.id}-usuario`] ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Senha</label>
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            type={revealedPasswords.has(selectedAccessData.id) ? 'text' : 'password'}
                            value={selectedAccessData.senha_criptografada}
                            readOnly
                            className="font-mono"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleRevealPassword(selectedAccessData.id)}
                          >
                            {revealedPasswords.has(selectedAccessData.id) ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleCopy(selectedAccessData.senha_criptografada, selectedAccessData.id, 'senha')}
                          >
                            {copiedFields[`${selectedAccessData.id}-senha`] ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {selectedAccessData.totp_enabled && selectedAccessData.totp_secret && (
                        <TOTPDisplay
                          secret={selectedAccessData.totp_secret}
                          issuer="DMM"
                          label={selectedAccessData.nome}
                        />
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Informações</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Status</label>
                        <div className="mt-1">
                          <Badge variant={selectedAccessData.status ? "default" : "secondary"}>
                            {selectedAccessData.status ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Empresa</label>
                        <p className="text-sm mt-1">
                          {empresas.find(e => e.id === selectedAccessData.empresa_id)?.nome}
                        </p>
                      </div>

                      {selectedAccessData.notas && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Notas</label>
                          <p className="text-sm mt-1 whitespace-pre-wrap">{selectedAccessData.notas}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="col-span-2">
                    <CardHeader>
                      <CardTitle className="text-lg">Histórico</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <label className="font-medium text-muted-foreground">Criado em</label>
                          <p>{format(new Date(selectedAccessData.criado_em), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                          <p className="text-muted-foreground">por {getNomeUsuario(selectedAccessData.criado_por)}</p>
                        </div>
                        <div>
                          <label className="font-medium text-muted-foreground">Atualizado em</label>
                          <p>{format(new Date(selectedAccessData.atualizado_em), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                          <p className="text-muted-foreground">por {getNomeUsuario(selectedAccessData.atualizado_por || '')}</p>
                        </div>
                        {selectedAccessData.ultimo_acesso && (
                          <div className="col-span-2">
                            <label className="font-medium text-muted-foreground">Último acesso</label>
                            <p>{format(new Date(selectedAccessData.ultimo_acesso), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Lock className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Selecione um acesso</h3>
                <p>Escolha um acesso na lista para ver os detalhes</p>
              </div>
            </div>
          )}
        </div>
      </main>

      <AccessEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingAccess(null);
        }}
        onSave={handleSaveAccess}
        acesso={editingAccess}
        isLoading={createAcesso.isPending || updateAcesso.isPending}
      />
    </div>
  );
};

export default TeamAccess;