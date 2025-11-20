
import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { ArrowUpDown, RotateCcw, Save } from 'lucide-react';

interface FilterState {
  selectedCompanyFilter: string;
  selectedUserFilter: string;
  selectedStatusFilter: string;
  primarySort: string;
  secondarySort: string;
  sortOrder: 'asc' | 'desc';
  secondarySortOrder: 'asc' | 'desc';
}

interface AdvancedFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  companies: string[];
  users: Array<{ id: string; name: string }>;
  statusConfig: Record<string, { label: string }>;
  sortOptions: Array<{ value: string; label: string }>;
  onSaveFilters: () => void;
  onResetFilters: () => void;
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  companies,
  users,
  statusConfig,
  sortOptions,
  onSaveFilters,
  onResetFilters
}) => {
  const updateFilter = (key: keyof FilterState, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const CustomSelect = ({ 
    value, 
    onChange, 
    options, 
    placeholder, 
    description 
  }: { 
    value: string; 
    onChange: (value: string) => void; 
    options: Array<{ value: string; label: string }>;
    placeholder: string;
    description: string;
  }) => (
    <div className="space-y-2">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full h-10 px-3 py-2 text-sm rounded-md border border-input bg-background",
          "hover:border-ring focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50"
        )}
      >
        <option value="">{placeholder}</option>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Filtros Avançados</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Company Filter */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Filtrar por Empresa</Label>
            <CustomSelect
              value={filters.selectedCompanyFilter}
              onChange={(value) => updateFilter('selectedCompanyFilter', value)}
              options={companies.map(company => ({ value: company, label: company }))}
              placeholder="Todas as Empresas"
              description="Mostra apenas tarefas da empresa selecionada"
            />
          </div>

          {/* User Filter */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Filtrar por Responsável</Label>
            <CustomSelect
              value={filters.selectedUserFilter}
              onChange={(value) => updateFilter('selectedUserFilter', value)}
              options={users.map(user => ({ value: user.id, label: user.name }))}
              placeholder="Todos os Responsáveis"
              description="Mostra apenas tarefas atribuídas ao responsável selecionado"
            />
          </div>

          {/* Status Filter */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Filtrar por Status</Label>
            <CustomSelect
              value={filters.selectedStatusFilter}
              onChange={(value) => updateFilter('selectedStatusFilter', value)}
              options={Object.entries(statusConfig).map(([key, config]) => ({ 
                value: key, 
                label: config.label 
              }))}
              placeholder="Todos os Status"
              description="Mostra apenas tarefas com o status selecionado"
            />
          </div>

          {/* Sorting */}
          <div className="space-y-4">
            <Label className="text-sm font-medium block">Ordenação</Label>
            
            {/* Primary Sort */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Ordenação Principal</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <CustomSelect
                    value={filters.primarySort}
                    onChange={(value) => updateFilter('primarySort', value)}
                    options={sortOptions}
                    placeholder="Selecionar ordenação principal"
                    description="Critério principal para ordenar as tarefas"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => updateFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="h-10 px-3"
                  title={`Ordem ${filters.sortOrder === 'asc' ? 'crescente' : 'decrescente'}`}
                >
                  <ArrowUpDown className="h-4 w-4" />
                  {filters.sortOrder === 'asc' ? '↑' : '↓'}
                </Button>
              </div>
            </div>

            {/* Secondary Sort */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Ordenação Secundária (Opcional)</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <CustomSelect
                    value={filters.secondarySort}
                    onChange={(value) => updateFilter('secondarySort', value)}
                    options={sortOptions.filter(option => option.value !== filters.primarySort)}
                    placeholder="Nenhuma ordenação secundária"
                    description="Critério adicional para ordenar tarefas com valores iguais na ordenação principal"
                  />
                </div>
                {filters.secondarySort && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => updateFilter('secondarySortOrder', filters.secondarySortOrder === 'asc' ? 'desc' : 'asc')}
                    className="h-10 px-3"
                    title={`Ordem secundária ${filters.secondarySortOrder === 'asc' ? 'crescente' : 'decrescente'}`}
                  >
                    <ArrowUpDown className="h-4 w-4" />
                    {filters.secondarySortOrder === 'asc' ? '↑' : '↓'}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button 
              type="button"
              onClick={onResetFilters}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Limpar Filtros
            </Button>
            <Button 
              type="button"
              onClick={onSaveFilters}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar Filtros
            </Button>
            <Button 
              type="button"
              onClick={onClose}
              size="sm"
              className="flex-1"
            >
              Aplicar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdvancedFilters;
