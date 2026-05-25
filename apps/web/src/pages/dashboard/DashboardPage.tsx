import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { projectsApi } from '../../api/projects';
import { membersApi } from '../../api/members';
import { milestonesApi } from '../../api/risks-milestones';
import { stagesApi } from '../../api/stages';
import { KPI } from '../../components/ui/KPI';
import { Avatar } from '../../components/ui/Avatar';
import { StatusChip } from '../../components/ui/StatusChip';
import { formatCurrency, formatDate } from '../../lib/utils';
import { differenceInCalendarDays } from 'date-fns';
import type { ProjectSummary, MemberMetrics, Milestone } from '../../types';

export const DashboardPage: React.FC = () => {
  const { data: summaries = [], isLoading } = useQuery<ProjectSummary[]>({
    queryKey: ['projects', 'summaries'],
    queryFn: projectsApi.summaries,
  });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const heroId = selectedIds[0] ?? null;

  useEffect(() => {
    if (summaries.length > 0 && selectedIds.length === 0) {
      setSelectedIds(summaries.map((p) => p.id));
    }
  }, [summaries]);

  const heroSummary = summaries.find((p) => p.id === heroId) ?? summaries[0] ?? null;

  const { data: stages = [] } = useQuery({
    queryKey: ['stages', heroSummary?.id],
    queryFn: () => stagesApi.list(heroSummary!.id),
    enabled: !!heroSummary?.id,
  });

  const { data: memberMetrics = [] } = useQuery<MemberMetrics[]>({
    queryKey: ['members', heroSummary?.id, 'metrics'],
    queryFn: () => membersApi.metrics(heroSummary!.id),
    enabled: !!heroSummary?.id,
  });

  const { data: milestones = [] } = useQuery<Milestone[]>({
    queryKey: ['milestones', heroSummary?.id],
    queryFn: () => milestonesApi.list(heroSummary!.id),
    enabled: !!heroSummary?.id,
  });

  if (isLoading) {
    return <div className="faint" style={{ padding: 32, textAlign: 'center' }}>Carregando painel...</div>;
  }

  const selected = summaries.filter((p) => selectedIds.includes(p.id));
  const activeCount = selected.filter((p) => p.status === 'active').length;
  const totalTasks = selected.reduce((n, p) => n + p.totalTasks, 0);
  const doneTasks = selected.reduce((n, p) => n + p.doneTasks, 0);
  const avgProgress = selected.length > 0
    ? Math.round(selected.reduce((n, p) => n + p.progress, 0) / selected.length)
    : 0;
  const totalPlanned = selected.reduce((n, p) => n + p.plannedCost, 0);
  const totalDone = selected.reduce((n, p) => n + p.doneCost, 0);
  const burnRate = totalPlanned > 0 ? Math.round((totalDone / totalPlanned) * 100) : 0;

  const heroProgress = heroSummary?.progress ?? 0;
  const heroDone = heroSummary?.doneTasks ?? 0;
  const heroTotal = heroSummary?.totalTasks ?? 0;

  const heroDeadline = heroSummary?.lastTaskDate ?? heroSummary?.endDate ?? null;
  const daysLeft = heroDeadline ? differenceInCalendarDays(new Date(heroDeadline), new Date()) : null;

  const overloadedMembers = (memberMetrics as MemberMetrics[])
    .filter((m) => m.loadPercent > 85)
    .sort((a, b) => b.loadPercent - a.loadPercent);

  const upcomingMilestones = (milestones as Milestone[])
    .filter((m) => m.status === 'pending')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  function toggleProject(id: string) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.length === 1 ? prev : prev.filter((x) => x !== id);
      }
      return [...prev, id];
    });
  }

  function rotateHero(direction: 1 | -1) {
    if (selectedIds.length <= 1) return;
    const currentIndex = selectedIds.indexOf(heroId || '');
    let nextIndex = (currentIndex + direction + selectedIds.length) % selectedIds.length;
    if (nextIndex === -1) nextIndex = selectedIds.length - 1;
    
    const nextId = selectedIds[nextIndex];
    setSelectedIds((prev) => [nextId, ...prev.filter((id) => id !== nextId)]);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      <div className="page-head" style={{ alignItems: 'flex-start', gap: 12 }}>
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-sub">Visão operacional do workspace</div>
        </div>
        {heroSummary && (
          <Link to={`/projects/${heroSummary.id}`} className="btn primary" style={{ flexShrink: 0 }}>
            Abrir projeto
          </Link>
        )}
      </div>

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
                    padding: '4px 10px', borderRadius: 'var(--radius)',
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
              Selecionar todos
            </button>
          </div>
        </div>
      )}

      {heroSummary && (
        <div className="project-hero" style={{ 
          position: 'relative', 
          transition: 'all 0.3s ease-in-out',
        }}>
          {selectedIds.length > 1 && (
            <>
              <button 
                onClick={() => rotateHero(-1)}
                style={{ 
                  position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', 
                  padding: '8px', cursor: 'pointer', background: 'var(--card-bg)', 
                  border: '1px solid var(--border)', borderRadius: '50%',
                  display: 'grid', placeItems: 'center', transition: 'transform 0.2s', zIndex: 10
                }}
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={() => rotateHero(1)}
                style={{ 
                  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', 
                  padding: '8px', cursor: 'pointer', background: 'var(--card-bg)', 
                  border: '1px solid var(--border)', borderRadius: '50%',
                  display: 'grid', placeItems: 'center', transition: 'transform 0.2s', zIndex: 10
                }}
              >
                <ChevronRight size={16} />
              </button>
            </>
          )}
          <div className="row" style={{ gap: 16, alignItems: 'flex-start', padding: '0 24px' }}>
            <div style={{
              width: 56, height: 56, borderRadius: 12,
              background: `linear-gradient(135deg, ${heroSummary.color || '#4F46E5'}, #7C3AED)`,
              display: 'grid', placeItems: 'center',
              color: 'white', fontSize: 24, fontWeight: 700, flexShrink: 0,
            }}>
              {heroSummary.name.charAt(0).toUpperCase()}
            </div>
            <div className="fill">
              <div className="row" style={{ gap: 6, marginBottom: 6 }}>
                {heroSummary.client && <span className="chip accent xs">{heroSummary.client}</span>}
                <StatusChip status={heroSummary.status || 'active'} />
              </div>
              <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>
                {heroSummary.name}
              </div>
              <div className="small muted" style={{ marginTop: 2 }}>
                {heroSummary.description || 'Projeto em andamento'}
              </div>
              <div className="row" style={{ marginTop: 14, gap: 8 }}>
                <span className="xs faint">PROGRESSO</span>
                <div className="bar fill thick">
                  <span style={{ width: `${heroProgress}%` }} />
                </div>
                <span className="b small">{heroProgress}%</span>
                <span className="xs faint">· {heroDone}/{heroTotal} tarefas</span>
              </div>
              {(stages as any[]).length > 0 && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 4, marginTop: 14,
                  overflowX: 'auto', paddingBottom: 2,
                  msOverflowStyle: 'none' as any, scrollbarWidth: 'none' as any,
                }}>
                  {(stages as any[]).map((stage: any, i: number) => {
                    const stageDone = (stage.topics ?? []).every((t: any) =>
                      (t.subtopics ?? []).every((s: any) => s.status === 'done'),
                    );
                    const stagePending = (stage.topics ?? []).some((t: any) =>
                      (t.subtopics ?? []).some((s: any) => s.status === 'inprog'),
                    );
                    const color = stageDone ? '#10B981' : stagePending ? '#4F46E5' : 'var(--text-3)';
                    const bg    = stageDone ? '#10B98115' : stagePending ? '#4F46E515' : 'var(--surface-2)';
                    const border = stageDone ? '#10B98140' : stagePending ? '#4F46E540' : 'var(--border)';
                    return (
                      <React.Fragment key={stage.id}>
                        {i > 0 && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--border-strong)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        )}
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
                          padding: '4px 10px', borderRadius: 20,
                          background: bg, border: `1px solid ${border}`,
                          fontSize: 12, color, fontWeight: stagePending ? 600 : 400,
                          whiteSpace: 'nowrap',
                        }}>
                          <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, opacity: 0.7 }}>E{i + 1}</span>
                          <span style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>{stage.name}</span>
                          {stageDone && <span style={{ fontSize: 10 }}>✓</span>}
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              )}
            </div>
            <div style={{ flexShrink: 0, textAlign: 'right' }}>
              <div className="xs faint">DIAS RESTANTES</div>
              <div style={{
                fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em',
                color: daysLeft !== null && daysLeft < 0 ? 'var(--danger)' : 'var(--text)',
              }}>
                {daysLeft !== null ? Math.abs(daysLeft) : '—'}
              </div>
              {daysLeft !== null && (
                <div className="xs faint">
                  {daysLeft < 0 ? 'dias em atraso' : 'dias até o prazo'}
                </div>
              )}
              {heroDeadline && (
                <div className="xs faint" style={{ marginTop: 2 }}>{formatDate(heroDeadline)}</div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="kpi-grid">
        <KPI
          label="Projetos selecionados"
          value={selected.length}
          sub={`${activeCount} ativos · ${selected.length} de ${summaries.length}`}
        />
        <KPI
          label="Progresso médio"
          value={`${avgProgress}%`}
          sub={`${doneTasks} de ${totalTasks} tarefas concluídas`}
          delta={avgProgress > 0 ? { dir: 'up', text: `${avgProgress}%` } : undefined}
        />
        <KPI
          label="Orçamento previsto"
          value={formatCurrency(totalPlanned)}
          sub="calculado pelas tarefas"
        />
        <KPI
          label="Gastos realizados"
          value={formatCurrency(totalDone)}
          sub={totalPlanned > 0 ? `${burnRate}% do previsto concluído` : 'tarefas concluídas'}
          delta={burnRate > 80 ? { dir: 'down', text: 'Atenção' } : burnRate > 50 ? { dir: 'flat', text: `${burnRate}%` } : undefined}
        />
        <KPI
          label="Saldo restante"
          value={formatCurrency(totalPlanned - totalDone)}
          sub="orçamento disponível"
          delta={totalPlanned - totalDone < 0 ? { dir: 'down', text: 'Estourado' } : undefined}
        />
        <KPI
          label="Profissionais sobrecarregados"
          value={overloadedMembers.length}
          sub={overloadedMembers.length > 0 ? 'Acima de 85% de carga esta semana' : 'Nenhum'}
          delta={overloadedMembers.length > 0 ? { dir: 'down', text: 'Risco' } : { dir: 'up', text: 'OK' }}
        />
      </div>

      <div className="grid-2" style={{ gap: 12 }}>
        <div className="col" style={{ gap: 12 }}>
          <div className="card">
            <div className="card-head">
              <div className="card-title">
                Projetos
                {selected.length < summaries.length && (
                  <span className="card-sub">{selected.length} selecionados</span>
                )}
              </div>
              <Link to="/projects" className="btn sm ghost">Ver todos</Link>
            </div>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Orçamento</th>
                  <th>Realizado</th>
                  <th>Status</th>
                  <th style={{ width: 120 }}>Progresso</th>
                </tr>
              </thead>
              <tbody>
                {selected.map((p) => (
                  <tr key={p.id} style={{ opacity: selectedIds.includes(p.id) ? 1 : 0.4 }}>
                    <td>
                      <div className="row" style={{ gap: 6 }}>
                        <span className="sb-project-dot" style={{ background: p.color || 'var(--accent)' }} />
                        <Link to={`/projects/${p.id}`} className="b">{p.name}</Link>
                        {p.id === heroId && <span style={{ fontSize: 10, color: p.color || 'var(--accent)' }}>★</span>}
                      </div>
                    </td>
                    <td className="mono xs">{formatCurrency(p.plannedCost)}</td>
                    <td className="mono xs faint">
                      {formatCurrency(p.doneCost)}
                      {p.plannedCost > 0 && (
                        <span className="xs faint" style={{ marginLeft: 4 }}>
                          ({Math.round((p.doneCost / p.plannedCost) * 100)}%)
                        </span>
                      )}
                    </td>
                    <td><StatusChip status={p.status || 'todo'} /></td>
                    <td>
                      <div className="row" style={{ gap: 6 }}>
                        <div className="bar fill">
                          <span style={{ width: `${p.progress}%` }} />
                        </div>
                        <span className="xs b" style={{ width: 32, textAlign: 'right' }}>
                          {p.progress}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
                {selected.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--text-3)' }}>
                      Nenhum projeto selecionado.
                    </td>
                  </tr>
                )}
                {summaries.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--text-3)' }}>
                      Nenhum projeto. <Link to="/projects" style={{ color: 'var(--accent)' }}>Criar projeto.</Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="card">
            <div className="card-head">
              <div className="card-title">
                Próximos marcos
                {heroSummary && <span className="card-sub">{heroSummary.name}</span>}
              </div>
              {upcomingMilestones.length > 0 && (
                <span className="chip accent xs">{upcomingMilestones.length} pendentes</span>
              )}
            </div>
            <div className="card-body flush">
              {upcomingMilestones.length > 0 ? upcomingMilestones.map((m) => {
                const mDays = differenceInCalendarDays(new Date(m.date), new Date());
                return (
                  <div key={m.id} className="list-item">
                    <span style={{ width: 8, height: 8, background: mDays < 7 ? 'var(--danger)' : 'var(--warning)', transform: 'rotate(45deg)', flexShrink: 0 }} />
                    <span className="fill b small truncate">{m.name}</span>
                    <span className="xs faint">{formatDate(m.date)}</span>
                    {mDays >= 0 && <span className="xs faint" style={{ marginLeft: 4 }}>({mDays}d)</span>}
                  </div>
                );
              }) : (
                <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                  Nenhum marco pendente.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col" style={{ gap: 12 }}>
          {memberMetrics.length > 0 && (
            <div className="card">
              <div className="card-head">
                <div className="card-title">
                  Carga dos profissionais
                  {heroSummary && <span className="card-sub">{heroSummary.name}</span>}
                </div>
                <span className="xs faint">{memberMetrics.length} membros</span>
              </div>
              <div className="card-body flush">
                {(memberMetrics as MemberMetrics[]).slice(0, 8).map((m, i) => (
                  <div key={m.memberId} className="list-item">
                    <Avatar initials={m.name.slice(0, 2).toUpperCase()} colorIndex={i + 1} size="sm" />
                    <div className="fill" style={{ minWidth: 0 }}>
                      <div className="small b truncate">{m.name}</div>
                      <div className="xs faint">{m.activeHours}h esta semana</div>
                    </div>
                    <div className="bar" style={{ width: 72, flexShrink: 0 }}>
                      <span style={{
                        width: `${Math.min(m.loadPercent, 100)}%`,
                        background: m.loadPercent > 100 ? 'var(--danger)' : m.loadPercent > 85 ? 'var(--warning)' : 'var(--accent)',
                      }} />
                    </div>
                    <span className="xs b" style={{ width: 38, textAlign: 'right', flexShrink: 0, color: m.loadPercent > 85 ? 'var(--warning)' : 'inherit' }}>
                      {m.loadPercent}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(burnRate > 80 || overloadedMembers.length > 0) && (
            <div className="card">
              <div className="card-head">
                <div className="card-title">Alertas críticos</div>
                <span className="chip high">{(burnRate > 80 ? 1 : 0) + overloadedMembers.length} ativos</span>
              </div>
              <div className="card-body flush">
                {burnRate > 80 && (
                  <div className="list-item" style={{ alignItems: 'flex-start' }}>
                    <div className="icon-circle" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>!</div>
                    <div className="fill">
                      <div className="small b">Budget crítico — {burnRate}% consumido</div>
                      <div className="xs faint">Projetos selecionados</div>
                    </div>
                  </div>
                )}
                {overloadedMembers.slice(0, 3).map((m) => (
                  <div key={m.memberId} className="list-item" style={{ alignItems: 'flex-start' }}>
                    <div className="icon-circle" style={{ background: 'var(--warning-soft)', color: 'var(--warning)' }}>!</div>
                    <div className="fill">
                      <div className="small b">{m.name} sobrecarregado</div>
                      <div className="xs faint">{m.loadPercent}% esta semana · {m.activeHours}h / cap. {m.capacityHours}h</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {totalPlanned > 0 && (
            <div className="card">
              <div className="card-head">
                <div className="card-title">Financeiro</div>
                {heroSummary && (
                  <Link to={`/projects/${heroSummary.id}/costs`} className="btn sm ghost">Ver custos</Link>
                )}
              </div>
              <div className="card-body">
                <div className="row between" style={{ marginBottom: 8 }}>
                  <span className="xs faint">Orçamento previsto</span>
                  <span className="xs faint mono">{formatCurrency(totalPlanned)}</span>
                </div>
                <div className="bar thick" style={{ marginBottom: 8 }}>
                  <span style={{
                    width: `${Math.min(burnRate, 100)}%`,
                    background: burnRate > 80 ? 'var(--warning)' : 'var(--accent)',
                  }} />
                </div>
                <div className="row between" style={{ marginBottom: 12 }}>
                  <span className="xs faint">Gastos realizados</span>
                  <span className="b mono">{formatCurrency(totalDone)}</span>
                </div>
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                  <div className="row between">
                    <span className="xs faint">Saldo disponível</span>
                    <span className="b mono" style={{ color: totalPlanned - totalDone < 0 ? 'var(--danger)' : 'inherit' }}>
                      {formatCurrency(totalPlanned - totalDone)}
                    </span>
                  </div>
                  <div className="row between" style={{ marginTop: 6 }}>
                    <span className="xs faint">Projetos incluídos</span>
                    <span className="xs faint">{selected.length} de {summaries.length}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
