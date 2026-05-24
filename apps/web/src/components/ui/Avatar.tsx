import React from 'react';
import { cn } from '../../lib/utils';

interface AvatarProps {
  initials: string;
  colorIndex?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  initials,
  colorIndex = 0,
  size = 'md',
  className,
}) => {
  const colorClass = `av-c${(Math.abs(colorIndex) % 8) + 1}`;
  const sizeClass = size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : size === 'xl' ? 'xl' : '';

  return (
    <div className={cn('av', colorClass, sizeClass, className)}>
      {initials.slice(0, 2).toUpperCase()}
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
