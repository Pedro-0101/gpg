import React from 'react';
import { cn } from '../../lib/utils';

type StatusType = 'todo' | 'inprog' | 'review' | 'done' | 'blocked' | string;

interface StatusChipProps {
  status: StatusType;
  className?: string;
}

const statusMap: Record<string, { label: string; class: string }> = {
  // Task statuses
  todo:      { label: 'A fazer',       class: 'chip todo' },
  inprog:    { label: 'Em progresso',  class: 'chip inprog' },
  review:    { label: 'Em revisão',    class: 'chip review' },
  done:      { label: 'Concluído',     class: 'chip done' },
  blocked:   { label: 'Bloqueado',     class: 'chip blocked' },
  // Project statuses
  active:    { label: 'Ativo',         class: 'chip accent' },
  paused:    { label: 'Pausado',       class: 'chip outline' },
  completed: { label: 'Concluído',     class: 'chip done' },
  cancelled: { label: 'Cancelado',     class: 'chip blocked' },
};

export const StatusChip: React.FC<StatusChipProps> = ({ status, className }) => {
  const config = statusMap[status] || { label: status, class: 'chip outline' };
  
  return (
    <div className={cn(config.class, className)}>
      {status === 'inprog' && <span className="dot animate-pulse" />}
      {config.label}
    </div>
  );
};
