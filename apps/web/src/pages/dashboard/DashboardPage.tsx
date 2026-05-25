import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
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

  // Selected project IDs for KPI aggregation — defaults to all once loaded
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  // Hero project = first selected
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

  // ---- Aggregated KPIs across selected projects ----
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

  // ---- Hero project stats ----
  const heroProgress = heroSummary?.progress ?? 0;
  const heroDone = heroSummary?.doneTasks ?? 0;
  const heroTotal = heroSummary?.totalTasks ?? 0;

  const heroDeadline = heroSummary?.lastTaskDate ?? heroSummary?.endDate ?? null;
  const daysLeft = heroDeadline ? differenceInCalendarDays(new Date(heroDeadline), new Date()) : null;

  // ---- Overloaded members ----
  const overloadedMembers = (memberMetrics as MemberMetrics[])
    .filter((m) => m.loadPercent > 85)
    .sort((a, b) => b.loadPercent - a.loadPercent);

  // ---- Milestones ----
  const upcomingMilestones = (milestones as Milestone[])
    .filter((m) => m.status === 'pending')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  // ---- Toggle helpers ----
  function toggleProject(id: string) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.length === 1 ? prev : prev.filter((x) => x !== id);
      }
      return [...prev, id];
    });
  }

  function setHero(id: string) {
    setSelectedIds((prev) => {
      if (!prev.includes(id)) return [id, ...prev];
      return [id, ...prev.filter((x) => x !== id)];
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header + project selector */}
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

      {/* Project chips selector */}
      {summaries.length > 0 && (
        <div className="card" style={{ padding: '12px 16px' }}>
          <div className="row" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="xs faint" style={{ flexShrink: 0 }}>Projetos:</span>
            {summaries.map((p) => {
              const isSelected = selectedIds.includes(p.id);
              const isHero = p.id === heroId;
              return (
                <div key={p.id} className="row" style={{ gap: 4 }}>
                  <button
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
                    {isHero && <span style={{ fontSize: 10, color: p.color || 'var(--accent)', fontWeight: 700 }}>★</span>}
                  </button>
                  {isSelected && !isHero && (
                    <button
                      onClick={() => setHero(p.id)}
                      title="Definir como projeto principal"
                      style={{
                        padding: '4px 7px', borderRadius: 'var(--radius)',
                        border: '1px solid var(--border)', background: 'transparent',
                        color: 'var(--text-3)', cursor: 'pointer', fontSize: 11,
                      }}
                    >
                      ★
                    </button>
                  )}
                </div>
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

      {/* Hero do projeto principal */}
      {heroSummary && (
        <div className="project-hero">
          <div className="row" style={{ gap: 16, alignItems: 'flex-start' }}>
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
                <div className="stepper" style={{ marginTop: 14, flexWrap: 'wrap' }}>
                  {(stages as any[]).slice(0, 6).map((stage: any, i: number) => {
                    const stageDone = (stage.topics ?? []).every((t: any) =>
                      (t.subtopics ?? []).every((s: any) => s.status === 'done'),
                    );
                    const stagePending = (stage.topics ?? []).some((t: any) =>
                      (t.subtopics ?? []).some((s: any) => s.status === 'inprog'),
                    );
                    const cls = stageDone ? 'done' : stagePending ? 'current' : '';
                    return (
                      <React.Fragment key={stage.id}>
                        {i > 0 && <div className="arrow" />}
                        <div className={`step ${cls}`} style={{ fontSize: 12, padding: '5px 10px' }}>
                          <span className="xs faint" style={{ fontFamily: 'monospace' }}>E{i + 1}</span>
                          <span>{stage.name}</span>
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

      {/* KPIs — aggregated across selected */}
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
        {/* Coluna esquerda */}
        <div className="col" style={{ gap: 12 }}>
          {/* Tabela de projetos selecionados */}
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

          {/* Próximos marcos */}
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

        {/* Coluna direita */}
        <div className="col" style={{ gap: 12 }}>
          {/* Carga da equipe */}
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

          {/* Alertas críticos */}
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

          {/* Resumo financeiro agregado */}
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
