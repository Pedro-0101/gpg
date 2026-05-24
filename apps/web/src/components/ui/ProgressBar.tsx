import React from 'react';
import { cn } from '../../lib/utils';

interface ProgressBarProps {
  progress: number;
  variant?: 'default' | 'success';
  className?: string;
  showLabel?: boolean;
  style?: React.CSSProperties;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  variant = 'default',
  className,
  showLabel = false,
  style,
}) => {
  return (
    <div className={cn('row fill', className)} style={style}>
      <div className={cn('bar fill', variant === 'success' && 'success')}>
        <span style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
      </div>
      {showLabel && (
        <span className="xs muted mono" style={{ width: '32px', textAlign: 'right' }}>
          {Math.round(progress)}%
        </span>
      )}
    </div>
  );
};
