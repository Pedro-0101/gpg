import React from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import { Search, ChevronRight, Bell, HelpCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '../../api/projects';
import { Avatar } from '../ui/Avatar';

export const Topbar: React.FC = () => {
  const { pathname } = useLocation();
  const { projectId } = useParams();
  
  const { data: project } = useQuery({
    queryKey: ['projects', projectId],
    queryFn: () => projectsApi.get(projectId!),
    enabled: !!projectId
  });

  // Gerar breadcrumbs simples com base no path
  const segments = pathname.split('/').filter(Boolean);
  
  return (
    <header className="topbar">
      <div className="bread">
        <Link to="/" className="crumb">Acme Studio</Link>
        
        {project && (
          <>
            <ChevronRight size={14} className="sep" />
            <Link to={`/projects/${project.id}`} className="crumb">{project.name}</Link>
          </>
        )}

        {segments.length > 0 && segments[0] !== 'projects' && (
          <>
            <ChevronRight size={14} className="sep" />
            <span className="crumb curr capitalize">{segments[0]}</span>
          </>
        )}
      </div>

      <div className="row ml-auto px-2">
        <div className="search-mini w-48 hidden md:flex">
          <Search size={14} />
          <span>Buscar...</span>
        </div>
        
        <button className="icon-btn ghost muted"><Bell size={18} /></button>
        <button className="icon-btn ghost muted"><HelpCircle size={18} /></button>
        
        <div className="divider vertical mx-2 h-6" />
        
        <Avatar initials="JD" colorIndex={2} size="sm" className="cursor-pointer" />
      </div>
    </header>
  );
};
