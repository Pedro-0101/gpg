import React, { useState, useEffect } from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '../../api/projects';

const ACCENTS = ['#4F46E5', '#0EA5E9', '#10B981', '#EF4444', '#F59E0B', '#7C3AED'];

function applyTheme(dark: boolean, accent: string) {
  document.body.classList.toggle('theme-dark', dark);
  document.documentElement.style.setProperty('--accent', accent);
  document.documentElement.style.setProperty(
    '--accent-soft',
    accent + (dark ? '26' : '1A'),
  );
  document.documentElement.style.setProperty('--accent-text', accent);
}

export const Topbar: React.FC = () => {
  const { pathname } = useLocation();
  const { projectId } = useParams();
  const [dark, setDark] = useState(() => document.body.classList.contains('theme-dark'));
  const [accent, setAccent] = useState('#4F46E5');
  const [showAccents, setShowAccents] = useState(false);

  const { data: project } = useQuery({
    queryKey: ['projects', projectId],
    queryFn: () => projectsApi.get(projectId!),
    enabled: !!projectId,
  });

  useEffect(() => { applyTheme(dark, accent); }, [dark, accent]);

  const segments = pathname.split('/').filter(Boolean);
  const sectionLabel: Record<string, string> = {
    gantt: 'Gantt',
    team: 'Equipe',
    costs: 'Custos',
    reports: 'Relatórios',
    settings: 'Configurações',
    projects: 'Projetos',
  };

  return (
    <header className="topbar">
      <div className="bread">
        <Link to="/" className="crumb">GPG</Link>
        {project && (
          <>
            <span className="sep">/</span>
            <Link to={`/projects/${project.id}`} className="crumb">{project.name}</Link>
          </>
        )}
        {segments[0] && segments[0] !== 'projects' && (
          <>
            <span className="sep">/</span>
            <span className="crumb curr">{sectionLabel[segments[0]] || segments[0]}</span>
          </>
        )}
        {segments[0] === 'projects' && segments.length > 1 && !project && (
          <>
            <span className="sep">/</span>
            <span className="crumb curr">Projeto</span>
          </>
        )}
      </div>

      <div className="row" style={{ gap: 6, marginLeft: 'auto' }}>
        <div className="search-mini" style={{ minWidth: 160 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span>Buscar</span>
          <span className="kbd">⌘K</span>
        </div>

        {/* Theme toggle */}
        <button
          className="icon-btn ghost"
          title={dark ? 'Modo claro' : 'Modo escuro'}
          onClick={() => setDark(d => !d)}
          style={{ fontSize: 15 }}
        >
          {dark ? '☀' : '☽'}
        </button>

        {/* Accent color picker */}
        <div style={{ position: 'relative' }}>
          <button
            className="icon-btn ghost"
            title="Cor de acento"
            onClick={() => setShowAccents(s => !s)}
          >
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: accent, display: 'block' }} />
          </button>
          {showAccents && (
            <div style={{
              position: 'absolute', right: 0, top: 34,
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)', padding: 8,
              display: 'flex', gap: 6, zIndex: 50,
              boxShadow: 'var(--shadow-md)',
            }}>
              {ACCENTS.map(c => (
                <button
                  key={c}
                  onClick={() => { setAccent(c); setShowAccents(false); }}
                  style={{
                    width: 20, height: 20, borderRadius: '50%', background: c,
                    border: c === accent ? '2px solid var(--text)' : '2px solid transparent',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* User avatar */}
        <div className="av av-c1" style={{ cursor: 'pointer' }}>PM</div>
      </div>
    </header>
  );
};
