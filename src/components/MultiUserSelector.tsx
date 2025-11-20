
import React, { useState } from 'react';
import { Check, X, Plus } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  name: string;
  avatar: string;
}

interface MultiUserSelectorProps {
  users: User[];
  selectedUserIds: string[];
  onSelectionChange: (userIds: string[]) => void;
  placeholder?: string;
}

const MultiUserSelector: React.FC<MultiUserSelectorProps> = ({
  users,
  selectedUserIds,
  onSelectionChange,
  placeholder = "Selecionar responsáveis"
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedUsers = users.filter(user => selectedUserIds.includes(user.id));
  const availableUsers = users.filter(user => !selectedUserIds.includes(user.id));

  const handleToggleUser = (userId: string) => {
    const newSelection = selectedUserIds.includes(userId)
      ? selectedUserIds.filter(id => id !== userId)
      : [...selectedUserIds, userId];
    onSelectionChange(newSelection);
  };

  const handleRemoveUser = (userId: string) => {
    onSelectionChange(selectedUserIds.filter(id => id !== userId));
  };

  return (
    <div className="space-y-2">
      {/* Selected Users Display */}
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 bg-muted/30 rounded-lg border">
          {selectedUsers.map(user => (
            <div
              key={user.id}
              className="flex items-center gap-2 bg-background border rounded-md px-2 py-1 text-sm"
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="text-xs">{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="text-foreground">{user.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveUser(user.id)}
                className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add Users Popover */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start text-left font-normal"
          >
            <Plus className="h-4 w-4 mr-2" />
            {selectedUsers.length === 0 ? placeholder : `Adicionar mais responsáveis`}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-2 border-b">
            <h4 className="font-medium text-sm text-foreground">Selecionar Responsáveis</h4>
            <p className="text-xs text-muted-foreground">Clique para adicionar ou remover responsáveis</p>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {users.map(user => (
              <div
                key={user.id}
                className={cn(
                  "flex items-center gap-3 p-2 cursor-pointer hover:bg-muted/50 transition-colors",
                  selectedUserIds.includes(user.id) && "bg-muted"
                )}
                onClick={() => handleToggleUser(user.id)}
              >
                <div className="relative">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="text-sm">{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  {selectedUserIds.includes(user.id) && (
                    <div className="absolute -top-1 -right-1 h-4 w-4 bg-primary rounded-full flex items-center justify-center">
                      <Check className="h-2 w-2 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">{user.name}</div>
                  <div className="text-xs text-muted-foreground">Membro da equipe DMM</div>
                </div>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default MultiUserSelector;
