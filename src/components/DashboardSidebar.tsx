import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, FileText, DollarSign, Key, CheckSquare, Users, Calendar, BarChart3, Building2, ChevronDown, ChevronsRight, LogOut, Settings, ListTodo, Bell, Moon, Sun } from 'lucide-react';
import DmmLogo from './DmmLogo';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { useEmpresas } from '@/hooks/useEmpresas';
interface MenuItem {
  title: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
  path?: string;
  isPlaceholder?: boolean;
}
interface DashboardSidebarProps {
  userType: 'team' | 'client';
  onLogout?: () => void;
}
const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  userType,
  onLogout
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();
  const {
    isDark,
    toggleTheme
  } = useTheme();
  const {
    signOut,
    perfil
  } = useAuthContext();
  const {
    empresas
  } = useEmpresas();
  const teamMenuItems: MenuItem[] = [{
    title: 'Dashboard',
    icon: Home,
    path: '/dashboard-team'
  }, {
    title: 'Tarefas',
    icon: ListTodo,
    path: '/tasks-team'
  }, {
    title: 'Checklist',
    icon: CheckSquare,
    path: '/checklist-team'
  }, {
    title: 'Acessos',
    icon: Key,
    path: '/access-team'
  }, {
    title: 'Clientes',
    icon: Building2,
    path: '/clients-team'
  }, {
    title: 'Documentos',
    icon: FileText,
    isPlaceholder: true
  }, {
    title: 'Financeiro',
    icon: DollarSign,
    path: '/financial-team'
  }, {
    title: 'Relatórios',
    icon: BarChart3,
    isPlaceholder: true
  }];
  const clientMenuItems: MenuItem[] = [{
    title: 'Dashboard',
    icon: Home,
    path: '/dashboard-client'
  }, {
    title: 'Tarefas',
    icon: ListTodo,
    path: '/tasks-client'
  }, {
    title: 'Checklist',
    icon: CheckSquare,
    path: '/checklist-client'
  }, {
    title: 'Meus Acessos',
    icon: Key,
    path: '/access-client'
  }, {
    title: 'Documentos',
    icon: FileText,
    isPlaceholder: true
  }, {
    title: 'Financeiro',
    icon: DollarSign,
    path: '/financial-client'
  }, {
    title: 'Relatórios',
    icon: BarChart3,
    isPlaceholder: true
  }];
  const menuItems = userType === 'team' ? teamMenuItems : clientMenuItems;
  const handleLogout = async () => {
    try {
      await signOut();
      if (onLogout) {
        onLogout();
      }
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };
  const MenuItem: React.FC<{
    item: MenuItem;
  }> = ({
    item
  }) => {
    const Icon = item.icon;
    if (item.isPlaceholder) {
      return <div className="flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-not-allowed opacity-60 text-muted-foreground hover:bg-muted/50">
          <Icon className="h-4 w-4 mr-3 flex-shrink-0" />
          {!isCollapsed && <span className="truncate">{item.title}</span>}
        </div>;
    }
    return <NavLink to={item.path || '#'} className={({
      isActive
    }) => `flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`} end>
        <Icon className="h-4 w-4 mr-3 flex-shrink-0" />
        {!isCollapsed && <span className="truncate">{item.title}</span>}
      </NavLink>;
  };
  return <div className={`bg-sidebar border-r border-sidebar-border transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'} flex flex-col h-screen`}>
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex flex-col items-center text-center space-y-3">
          {!isCollapsed && (
            <>
              {/* Logo da empresa - apenas para TEAM */}
              {userType === 'team' && (
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center">
                  <DmmLogo size="md" showText={false} />
                </div>
              )}

              {/* Nome da empresa */}
              <div className="text-center">
                <span className="text-sm font-semibold text-foreground block">
                  {userType === 'client' 
                    ? (empresas.find(e => e.id === perfil?.empresa_id)?.nome || 'Cliente')
                    : 'DMM Services'
                  }
                </span>
              </div>

              {/* Tipo de painel */}
              <div className="text-xs text-muted-foreground">
                {userType === 'team' ? 'Painel da Equipe' : 'Painel do Cliente'}
              </div>
            </>
          )}
          
          {isCollapsed && (
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center">
              {userType === 'team' ? (
                <DmmLogo size="sm" showText={false} />
              ) : (
                <div className="w-full h-full bg-primary/20 rounded flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">
                    {empresas.find(e => e.id === perfil?.empresa_id)?.nome?.charAt(0) || 'C'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item, index) => <MenuItem key={index} item={item} />)}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border space-y-2">
        {isCollapsed ? <>
            <Button variant="ghost" size="sm" onClick={() => setIsCollapsed(false)} className="w-full justify-center text-muted-foreground hover:text-foreground">
              <ChevronsRight className="h-4 w-4 rotate-180" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowNotifications(!showNotifications)} className="w-full justify-center text-muted-foreground hover:text-foreground relative">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </Button>
            <Button variant="ghost" size="sm" onClick={toggleTheme} className="w-full justify-center text-muted-foreground hover:text-foreground">
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-center text-muted-foreground hover:text-white hover:bg-red-500 dark:hover:text-white dark:hover:bg-red-600">
              <LogOut className="h-4 w-4" />
            </Button>
          </> : <>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Button variant="ghost" size="sm" onClick={() => setShowNotifications(!showNotifications)} className="text-muted-foreground hover:text-foreground relative">
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </Button>
              <Button variant="ghost" size="sm" onClick={toggleTheme} className="text-muted-foreground hover:text-foreground">
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setIsCollapsed(true)} className="text-muted-foreground hover:text-foreground">
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:bg-muted hover:text-foreground">
              <Settings className="h-4 w-4 mr-3" />
              Configurações
            </Button>
            <Button variant="ghost" onClick={handleLogout} className="w-full justify-start text-muted-foreground hover:text-white hover:bg-red-500 dark:hover:text-white dark:hover:bg-red-600">
              <LogOut className="h-4 w-4 mr-3" />
              Sair
            </Button>
          </>}
      </div>
    </div>;
};
export default DashboardSidebar;