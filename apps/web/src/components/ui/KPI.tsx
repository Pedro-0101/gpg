import React from 'react';
import { cn } from '../../lib/utils';

interface KPIProps {
  label: string;
  value: string | number;
  sub?: string;
  delta?: {
    value: string | number;
    trend: 'up' | 'down' | 'flat';
  };
  className?: string;
}

export const KPI: React.FC<KPIProps> = ({ label, value, sub, delta, className }) => {
  return (
    <div className={cn('card kpi', className)}>
      <div className="label">{label.toUpperCase()}</div>
      <div className="value">
        {value}
        {delta && (
          <span className={cn('delta', delta.trend)}>
            {delta.trend === 'up' ? '↑' : delta.trend === 'down' ? '↓' : '→'} {delta.value}
          </span>
        )}
      </div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
};
