import React from 'react';
import { cn } from '../../lib/utils';

interface AvatarProps {
  initials: string;
  colorIndex?: number;
  size?: 'sm' | 'md' | 'xl';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ 
  initials, 
  colorIndex = 0, 
  size = 'md',
  className 
}) => {
  // Cores definidas no index.css (av-c1 até av-c6)
  const colorClass = colorIndex === 8 ? 'av-c8' : `av-c${(colorIndex % 6) + 1}`;
  
  return (
    <div className={cn(
      'av',
      colorClass,
      size === 'sm' && 'av.sm',
      size === 'xl' && 'av.xl',
      className
    )}>
      {initials.toUpperCase()}
    </div>
  );
};

interface AvatarStackProps {
  children: React.ReactNode;
  className?: string;
}

export const AvatarStack: React.FC<AvatarStackProps> = ({ children, className }) => {
  return (
    <div className={cn('av-stack', className)}>
      {children}
    </div>
  );
};
