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
  accentColor?: string;
}

export const KPI: React.FC<KPIProps> = ({ label, value, sub, delta, className, accentColor }) => {
  const dir = delta?.dir ?? delta?.trend ?? 'flat';
  const deltaText = delta?.text ?? (delta?.value != null ? String(delta.value) : '');

  return (
    <div className={cn('card kpi', className)} style={accentColor ? { borderTop: `2px solid ${accentColor}` } : undefined}>
      <div className="label" title={label}>{label}</div>
      <div className="value" title={String(value)}>
        {value}
        {delta && (
          <span className={cn('delta', dir)}>
            {deltaText}
          </span>
        )}
      </div>
      {sub && <div className="sub" title={sub}>{sub}</div>}
    </div>
  );
};
