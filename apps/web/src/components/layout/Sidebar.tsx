import React from 'react';
import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '../../api/projects';
import { cn } from '../../lib/utils';

const ICONS = {
  dashboard: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10',
  projects:  'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  team:      'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75',
  costs:     'M12 1v22 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  settings:  'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
  plus:      'M12 5v14 M5 12h14',
  search:    'M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0',
};

function SvgIcon({ d, size = 14 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {d.split(' M').map((path, i) => (
        <path key={i} d={(i === 0 ? '' : 'M') + path} />
      ))}
    </svg>
  );
}

export const Sidebar: React.FC = () => {
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.list,
  });

  return (
    <aside className="sidebar">
      {/* Workspace */}
      <div className="sb-workspace">
        <div className="sb-logo">G</div>
        <div className="fill">
          <div className="sb-wsname">GPG</div>
          <div className="sb-wssub">Workspace</div>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '0 4px 8px' }}>
        <div className="search-mini">
          <SvgIcon d={ICONS.search} size={13} />
          <span>Buscar</span>
          <span className="kbd">⌘K</span>
        </div>
      </div>

      {/* Navegação global do sistema */}
      <div className="sb-section">Geral</div>
      <SidebarItem to="/" icon={ICONS.dashboard} label="Dashboard" end />
      <SidebarItem to="/projects" icon={ICONS.projects} label="Projetos" />
      <SidebarItem to="/equipe" icon={ICONS.team} label="Equipe" />
      <SidebarItem to="/custos" icon={ICONS.costs} label="Custos" />

      {/* Lista de projetos para acesso rápido */}
      <div className="sb-section">Projetos</div>
      {(projects as any[]).map((p: any) => (
        <SidebarItem
          key={p.id}
          to={`/projects/${p.id}`}
          label={p.name}
          dot={p.color || '#4F46E5'}
        />
      ))}
      <NavLink to="/projects?new=1" className="sb-item" style={{ opacity: 0.6 }}>
        <span className="icon"><SvgIcon d={ICONS.plus} size={13} /></span>
        <span>Novo projeto</span>
      </NavLink>

      {/* Bottom */}
      <div style={{ marginTop: 'auto', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
        <SidebarItem to="/settings" icon={ICONS.settings} label="Configurações" />
      </div>
    </aside>
  );
};

interface SidebarItemProps {
  to: string;
  icon?: string;
  label: string;
  count?: number;
  dot?: string;
  end?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ to, icon, label, count, dot, end }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) => cn('sb-item', isActive && 'active')}
  >
    {icon && <span className="icon"><SvgIcon d={icon} size={14} /></span>}
    {dot && <span className="sb-project-dot" style={{ background: dot }} />}
    <span className="fill truncate">{label}</span>
    {count !== undefined && <span className="count">{count}</span>}
  </NavLink>
);
