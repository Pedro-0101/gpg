import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({ children, className, style }) => (
  <div className={cn('card', className)} style={style}>{children}</div>
);

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ title, subtitle, children, className }) => (
  <div className={cn('card-head', className)}>
    <div className="row">
      <span className="card-title">{title}</span>
      {subtitle && <span className="card-sub">{subtitle}</span>}
    </div>
    {children}
  </div>
);

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
  flush?: boolean;
}

export const CardBody: React.FC<CardBodyProps> = ({ children, className, flush }) => (
  <div className={cn('card-body', flush && 'flush', className)}>{children}</div>
);
