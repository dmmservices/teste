import React, { useState, useMemo } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, Star, StarOff, Eye, EyeOff, Copy, Check, 
  ExternalLink, Globe, Lock, Smartphone, Server, Database, Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useAcessos } from '@/hooks/useAcessos';
import { useFavoritosAcesso } from '@/hooks/useFavoritosAcesso';
import { useEmpresas } from '@/hooks/useEmpresas';
import { usePerfis } from '@/hooks/usePerfis';
import TOTPDisplay from '@/components/TOTPDisplay';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ClientAccess = () => {
  const navigate = useNavigate();
  const { signOut, perfil } = useAuthContext();
  const { acessos, isLoading, registrarUltimoAcesso } = useAcessos();
  const { isFavorito, toggleFavorito } = useFavoritosAcesso();
  const { empresas } = useEmpresas();
  const { getNomeUsuario } = usePerfis();

  const [searchTerm, setSearchTerm] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedAccess, setSelectedAccess] = useState<string | null>(null);
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

  // Filter accesses for client - only their company
  const clientAcessos = useMemo(() => {
    return acessos.filter(acesso => 
      acesso.empresa_id === perfil?.empresa_id
    );
  }, [acessos, perfil]);

  const filteredAcessos = useMemo(() => {
    return clientAcessos.filter(acesso => {
      const matchesSearch = acesso.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           acesso.site.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           acesso.usuario.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFavorites = !showFavoritesOnly || isFavorito(acesso.id);

      return matchesSearch && matchesFavorites;
    });
  }, [clientAcessos, searchTerm, showFavoritesOnly, isFavorito]);

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
    <div className="min-h-screen bg-background">
      <div className="fixed">
        <DashboardSidebar userType="client" onLogout={handleLogout} />
      </div>
      
      <div className="ml-64 flex">
        {/* Painel esquerdo - Lista de acessos */}
        <div className="w-1/3 border-r border-border bg-card">
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">Meus Acessos</h1>
            </div>
            
            {/* Filtros */}
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar acessos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant={showFavoritesOnly ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                >
                  <Star className={`w-4 h-4 mr-1 ${showFavoritesOnly ? 'fill-current' : ''}`} />
                  Favoritos
                </Button>
              </div>
            </div>
          </div>

          {/* Lista de acessos */}
          <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
            {filteredAcessos.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum acesso encontrado</p>
                <p className="text-sm">Tente ajustar os filtros</p>
              </div>
            ) : (
              filteredAcessos.map((acesso) => {
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
                      {/* Ícone */}
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

                      {/* Conteúdo */}
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
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Painel direito - Detalhes do acesso */}
        <div className="flex-1 p-6">
          {selectedAccessData ? (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center gap-4 pb-6 border-b border-border">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted flex items-center justify-center">
                  {(() => {
                    const favicon = getFavicon(selectedAccessData.site);
                    return (
                      <img
                        src={favicon || ''}
                        alt={`${selectedAccessData.nome} favicon`}
                        className="w-10 h-10"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.outerHTML = `<div class="flex items-center justify-center w-16 h-16"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg></div>`;
                        }}
                      />
                    );
                  })()}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold">{selectedAccessData.nome}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-muted-foreground">{selectedAccessData.site}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenSite(selectedAccessData.site)}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <Badge variant={selectedAccessData.status ? "default" : "secondary"}>
                  {selectedAccessData.status ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>

              {/* Credenciais */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    Credenciais de Acesso
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Usuário</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        value={selectedAccessData.usuario}
                        readOnly
                        className="font-mono bg-muted"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleCopy(selectedAccessData.usuario, selectedAccessData.id, 'usuario')}
                      >
                        {copiedFields[`${selectedAccessData.id}-usuario`] ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
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
                        className="font-mono bg-muted"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleRevealPassword(selectedAccessData.id)}
                      >
                        {revealedPasswords.has(selectedAccessData.id) ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleCopy(selectedAccessData.senha_criptografada, selectedAccessData.id, 'senha')}
                      >
                        {copiedFields[`${selectedAccessData.id}-senha`] ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
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

              {/* Informações adicionais */}
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Informações</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Empresa</label>
                      <p className="text-sm">{empresas.find(e => e.id === selectedAccessData.empresa_id)?.nome || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <div className="mt-1">
                        <Badge variant={selectedAccessData.status ? "default" : "secondary"}>
                          {selectedAccessData.status ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Histórico</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Criado em</label>
                      <p className="text-sm">
                        {selectedAccessData.criado_em 
                          ? format(new Date(selectedAccessData.criado_em), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                          : 'N/A'
                        }
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Criado por</label>
                      <p className="text-sm">{getNomeUsuario(selectedAccessData.criado_por) || 'N/A'}</p>
                    </div>
                    {selectedAccessData.ultimo_acesso && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Último acesso</label>
                        <p className="text-sm">
                          {format(new Date(selectedAccessData.ultimo_acesso), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Notas */}
              {selectedAccessData.notas && (
                <Card>
                  <CardHeader>
                    <CardTitle>Notas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{selectedAccessData.notas}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Globe className="w-24 h-24 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Selecione um acesso</h3>
              <p className="text-muted-foreground">
                Escolha um acesso na lista para visualizar os detalhes e credenciais
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientAccess;