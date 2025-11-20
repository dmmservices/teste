
import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
  className?: string;
}

const STATUS_COLORS = {
  'could-do': 'bg-slate-600 text-white',
  'should-do': 'bg-orange-500 text-white',
  'ready-to-do': 'bg-pink-500 text-white',
  'in-progress': 'bg-purple-500 text-white',
  'in-review': 'bg-blue-500 text-white',
  'recurring': 'bg-amber-700 text-white',
  'completed': 'bg-green-500 text-white',
  'rejected': 'bg-red-600 text-white'
};

const STATUS_LABELS = {
  'could-do': 'Poderia Fazer',
  'should-do': 'Devemos Fazer',
  'ready-to-do': 'Pronto para Fazer',
  'in-progress': 'Em Progresso',
  'in-review': 'Em Revisão',
  'recurring': 'Recorrente',
  'completed': 'Concluído',
  'rejected': 'Rejeitado'
};

export const getStatusClasses = (status: string) => {
  return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || 'bg-gray-500 text-white';
};

export const getStatusDotClasses = (status: string) => {
  const colorClass = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || 'bg-gray-500';
  // Extract just the background color for the dot
  return colorClass.split(' ')[0];
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md', className = '' }) => {
  const colorClasses = getStatusClasses(status);
  const sizeClasses = size === 'sm' 
    ? 'px-2 py-0.5 text-[11px] md:text-xs' 
    : 'px-2.5 py-0.5 text-xs md:text-[13px]';
  
  const label = STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status;

  return (
    <span className={`inline-flex items-center rounded-full font-semibold ${colorClasses} ${sizeClasses} ${className}`}>
      {label}
    </span>
  );
};

export default StatusBadge;
