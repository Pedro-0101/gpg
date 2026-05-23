import React from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { cn } from '../../lib/utils';

interface TabBarProps {
  tabs: {
    to: string;
    label: string;
    count?: number;
    end?: boolean;
  }[];
  className?: string;
}

export const TabBar: React.FC<TabBarProps> = ({ tabs, className }) => {
  const { projectId } = useParams();

  return (
    <div className={cn('tab-bar', className)}>
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to === '' ? `/projects/${projectId}` : `/projects/${projectId}/${tab.to}`}
          end={tab.end}
          className={({ isActive }) => cn('tb-tab', isActive && 'active')}
        >
          {tab.label}
          {tab.count !== undefined && <span className="count">{tab.count}</span>}
        </NavLink>
      ))}
    </div>
  );
};
