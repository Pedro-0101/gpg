import React from 'react';
import { cn } from '../../lib/utils';

interface KPIProps {
  label: string;
  value: string | number;
  sub?: string;
  delta?: {
    value?: string | number;
    text?: string;
    trend?: 'up' | 'down' | 'flat';
    dir?: 'up' | 'down' | 'flat';
  };
  className?: string;
}

export const KPI: React.FC<KPIProps> = ({ label, value, sub, delta, className }) => {
  const dir = delta?.dir ?? delta?.trend ?? 'flat';
  const deltaText = delta?.text ?? (delta?.value != null ? String(delta.value) : '');

  return (
    <div className={cn('card kpi', className)}>
      <div className="label">{label}</div>
      <div className="value">
        {value}
        {delta && (
          <span className={cn('delta', dir)}>
            {deltaText}
          </span>
        )}
      </div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
};
