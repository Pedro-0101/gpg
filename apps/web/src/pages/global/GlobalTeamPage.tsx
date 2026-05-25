import React, { useState, useEffect } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { projectsApi } from '../../api/projects';
import { membersApi } from '../../api/members';
import { Avatar } from '../../components/ui/Avatar';
import type { ProjectSummary, MemberMetrics } from '../../types';

export const GlobalTeamPage: React.FC = () => {
  const { data: summaries = [], isLoading } = useQuery<ProjectSummary[]>({
    queryKey: ['projects', 'summaries'],
    queryFn: projectsApi.summaries,
  });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (summaries.length > 0 && selectedIds.length === 0) {
      setSelectedIds(summaries.map((p) => p.id));
    }
  }, [summaries]);

  const selected = summaries.filter((p) => selectedIds.includes(p.id));

  // Fetch metrics for each selected project in parallel
  const metricsQueries = useQueries({
    queries: selected.map((p) => ({
      queryKey: ['members', p.id, 'metrics'],
      queryFn: () => membersApi.metrics(p.id),
    })),
  });

  function toggleProject(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.length === 1 ? prev : prev.filter((x) => x !== id)
        : [...prev, id]
    );
  }

  const isLoadingMetrics = metricsQueries.some((q) => q.isLoading);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="page-head">
        <div>
          <div className="page-title">Equipe</div>
          <div className="page-sub">Profissionais e carga de trabalho por projeto</div>
        </div>
      </div>

      {/* Project selector */}
      {summaries.length > 0 && (
        <div className="card" style={{ padding: '12px 16px' }}>
          <div className="row" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="xs faint" style={{ flexShrink: 0 }}>Projetos:</span>
            {summaries.map((p) => {
              const isSelected = selectedIds.includes(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => toggleProject(p.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '5px 10px', borderRadius: 'var(--radius)',
                    border: `1.5px solid ${isSelected ? p.color || 'var(--accent)' : 'var(--border)'}`,
                    background: isSelected ? `color-mix(in srgb, ${p.color || 'var(--accent)'} 12%, transparent)` : 'transparent',
                    color: isSelected ? 'var(--text)' : 'var(--text-3)',
                    cursor: 'pointer', fontSize: 13, fontWeight: isSelected ? 600 : 400,
                  }}
                >
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: isSelected ? (p.color || 'var(--accent)') : 'var(--border)',
                    flexShrink: 0,
                  }} />
                  {p.name}
                </button>
              );
            })}
            <button
              onClick={() => setSelectedIds(summaries.map((p) => p.id))}
              style={{ padding: '4px 8px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', fontSize: 12, color: 'var(--text-3)' }}
            >
              Todos
            </button>
          </div>
        </div>
      )}

      {(isLoading || isLoadingMetrics) && (
        <div className="faint" style={{ padding: 32, textAlign: 'center' }}>Carregando equipe...</div>
      )}

      {/* One card per selected project */}
      {selected.map((proj, idx) => {
        const metrics = (metricsQueries[idx]?.data ?? []) as MemberMetrics[];
        const overloaded = metrics.filter((m) => m.loadPercent > 85).length;

        return (
          <div key={proj.id} className="card">
            <div className="card-head">
              <div className="row" style={{ gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: `linear-gradient(135deg, ${proj.color || '#4F46E5'}, #7C3AED)`,
                  display: 'grid', placeItems: 'center', color: 'white', fontSize: 13, fontWeight: 700,
                }}>
                  {proj.name.charAt(0).toUpperCase()}
                </div>
                <div className="card-title">{proj.name}</div>
                {overloaded > 0 && (
                  <span className="chip high">{overloaded} sobrecarregado{overloaded > 1 ? 's' : ''}</span>
                )}
              </div>
              <Link to={`/projects/${proj.id}/professionals`} className="btn sm ghost">
                Ver profissionais
              </Link>
            </div>

            {metrics.length === 0 ? (
              <div style={{ padding: '16px 20px', color: 'var(--text-3)', fontSize: 13 }}>
                Nenhum profissional cadastrado.{' '}
                <Link to={`/projects/${proj.id}/professionals`} style={{ color: 'var(--accent)' }}>
                  Adicionar profissional.
                </Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 0 }}>
                {metrics.map((m, i) => (
                  <div key={m.memberId} className="list-item" style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
                    <Avatar initials={m.initials || m.name.slice(0, 2).toUpperCase()} colorIndex={(m.avatarColor ?? i) + 1} size="sm" />
                    <div className="fill" style={{ minWidth: 0 }}>
                      <div className="small b truncate">{m.name}</div>
                      <div className="xs faint">{m.role} · {m.activeHours}h esta semana</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
                      <div className="bar" style={{ width: 72 }}>
                        <span style={{
                          width: `${Math.min(m.loadPercent, 100)}%`,
                          background: m.loadPercent > 100 ? 'var(--danger)' : m.loadPercent > 85 ? 'var(--warning)' : 'var(--accent)',
                        }} />
                      </div>
                      <span className="xs b" style={{ color: m.loadPercent > 85 ? 'var(--warning)' : 'var(--text-3)' }}>
                        {m.loadPercent}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {!isLoading && selected.length === 0 && (
        <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-3)' }}>
          Selecione ao menos um projeto para ver a equipe.
        </div>
      )}
    </div>
  );
};
