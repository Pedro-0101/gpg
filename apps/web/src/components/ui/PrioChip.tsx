import React from 'react';
import type { SubtopicPriority } from '../../types';

interface PrioChipProps {
  priority: SubtopicPriority | string;
}

const LABELS: Record<string, string> = {
  high: 'Alta',
  med: 'Média',
  low: 'Baixa',
};

export const PrioChip: React.FC<PrioChipProps> = ({ priority }) => (
  <span className={`chip ${priority}`}>{LABELS[priority] ?? priority}</span>
);
