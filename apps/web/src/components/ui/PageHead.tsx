import React from 'react';
import { cn } from '../../lib/utils';

interface PageHeadProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
}

export const PageHead: React.FC<PageHeadProps> = ({ title, subtitle, children, className }) => {
  return (
    <div className={cn('page-head', className)}>
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-sub">{subtitle}</p>}
      </div>
      <div className="row">
        {children}
      </div>
    </div>
  );
};
