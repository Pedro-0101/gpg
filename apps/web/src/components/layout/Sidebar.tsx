import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Inbox, 
  Calendar, 
  BarChart2, 
  Users, 
  DollarSign, 
  FileText,
  Search,
  Plus,
  Settings
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '../../api/projects';

export const Sidebar: React.FC = () => {
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.list
  });

  return (
    <aside className="sidebar">
      {/* Workspace Header */}
      <div className="sb-workspace">
        <div className="sb-logo">A</div>
        <div className="fill">
          <div className="sb-wsname truncate">Acme Studio</div>
          <div className="sb-wssub">WORKSPACE</div>
        </div>
      </div>

      {/* Quick Search */}
      <div className="px-2 mb-4">
        <div className="search-mini">
          <Search size={14} />
          <span>Buscar</span>
          <span className="kbd ml-auto">⌘K</span>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 space-y-1">
        <SidebarItem to="/" icon={<LayoutDashboard size={16} />} label="Dashboard" />
        <SidebarItem to="/tasks" icon={<CheckSquare size={16} />} label="Minhas tarefas" count={6} />
        <SidebarItem to="/inbox" icon={<Inbox size={16} />} label="Inbox" count={12} />
        <SidebarItem to="/calendar" icon={<Calendar size={16} />} label="Calendário" />

        <div className="sb-section">Workspace</div>
        <SidebarItem to="/gantt" icon={<BarChart2 size={16} />} label="Gantt" />
        <SidebarItem to="/team" icon={<Users size={16} />} label="Equipe" />
        <SidebarItem to="/costs" icon={<DollarSign size={16} />} label="Custos" />
        <SidebarItem to="/reports" icon={<FileText size={16} />} label="Relatórios" />

        <div className="sb-section">Projetos</div>
        {projects?.map((p: any) => (
          <SidebarItem 
            key={p.id} 
            to={`/projects/${p.id}`} 
            label={p.name} 
            dotColor={p.color || '#4F46E5'} 
          />
        ))}
        
        <button className="sb-item w-full text-left mt-2 opacity-60 hover:opacity-100">
          <Plus size={16} />
          <span>Novo projeto</span>
        </button>
      </nav>

      {/* Bottom Nav */}
      <div className="mt-auto pt-4 border-t border-border/50">
        <SidebarItem to="/settings" icon={<Settings size={16} />} label="Configurações" />
      </div>
    </aside>
  );
};

interface SidebarItemProps {
  to: string;
  icon?: React.ReactNode;
  label: string;
  count?: number;
  dotColor?: string;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ to, icon, label, count, dotColor }) => {
  return (
    <NavLink 
      to={to} 
      className={({ isActive }) => cn('sb-item', isActive && 'active')}
    >
      {icon && <span className="icon">{icon}</span>}
      {dotColor && <span className="sb-project-dot" style={{ background: dotColor }} />}
      <span className="truncate">{label}</span>
      {count !== undefined && <span className="count">{count}</span>}
    </NavLink>
  );
};
