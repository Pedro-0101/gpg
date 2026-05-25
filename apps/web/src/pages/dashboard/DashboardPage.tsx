import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { projectsApi } from '../../api/projects';
import { membersApi } from '../../api/members';
import { costsApi } from '../../api/costs';
import { milestonesApi } from '../../api/risks-milestones';
import { stagesApi } from '../../api/stages';
import { KPI } from '../../components/ui/KPI';
import { Avatar } from '../../components/ui/Avatar';
import { StatusChip } from '../../components/ui/StatusChip';
import { formatCurrency, formatDate } from '../../lib/utils';
import { differenceInCalendarDays } from 'date-fns';
import type { Project, MemberMetrics, Milestone } from '../../types';

export const DashboardPage: React.FC = () => {
  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: projectsApi.list,
  });

  const mainProject = projects[0];

  const { data: memberMetrics = [] } = useQuery<MemberMetrics[]>({
    queryKey: ['members', mainProject?.id, 'metrics'],
    queryFn: () => membersApi.metrics(mainProject!.id),
    enabled: !!mainProject?.id,
  });

  const { data: costsSummary } = useQuery({
    queryKey: ['costs', mainProject?.id, 'summary'],
    queryFn: () => costsApi.summary(mainProject!.id),
    enabled: !!mainProject?.id,
  });

  const { data: milestones = [] } = useQuery<Milestone[]>({
    queryKey: ['milestones', mainProject?.id],
    queryFn: () => milestonesApi.list(mainProject!.id),
    enabled: !!mainProject?.id,
  });

  const { data: stages = [] } = useQuery({
    queryKey: ['stages', mainProject?.id],
    queryFn: () => stagesApi.list(mainProject!.id),
    enabled: !!mainProject?.id,
  });

  if (isLoading) {
    return <div className="faint" style={{ padding: 32, textAlign: 'center' }}>Carregando painel...</div>;
  }

  // Progresso real do projeto principal
  const allSubtopics = (mainProject as any)?.stages?.flatMap((s: any) =>
    s.topics?.flatMap((t: any) => t.subtopics ?? []) ?? [],
  ) ?? [];
  const totalTasks = allSubtopics.length;
  const doneTasks = allSubtopics.filter((s: any) => s.status === 'done').length;
  const mainProgress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const plannedCost = costsSummary?.plannedCost ?? 0;
  const doneCost = costsSummary?.doneCost ?? 0;
  const totalSpent = costsSummary?.totalSpent ?? 0;
  const burnRate = plannedCost > 0 ? Math.round((doneCost / plannedCost) * 100) : 0;

  const daysLeft = mainProject?.endDate
    ? differenceInCalendarDays(new Date(mainProject.endDate), new Date())
    : null;

  const overloadedMembers = (memberMetrics as MemberMetrics[])
    .filter((m) => m.loadPercent > 85)
    .sort((a, b) => b.loadPercent - a.loadPercent);

  const upcomingMilestones = (milestones as Milestone[])
    .filter((m) => m.status === 'pending')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  function projectProgress(p: any) {
    const subs = (p.stages ?? []).flatMap((s: any) =>
      (s.topics ?? []).flatMap((t: any) => t.subtopics ?? []),
    );
    if (subs.length === 0) return 0;
    return Math.round((subs.filter((s: any) => s.status === 'done').length / subs.length) * 100);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="page-head">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-sub">Visão operacional do workspace</div>
        </div>
        {mainProject && (
          <Link to={`/projects/${mainProject.id}`} className="btn primary">
            Abrir projeto principal
          </Link>
        )}
      </div>

      {/* Hero do projeto principal */}
      {mainProject && (
        <div className="project-hero">
          <div className="row" style={{ gap: 16, alignItems: 'flex-start' }}>
            <div
              style={{
                width: 56, height: 56, borderRadius: 12,
                background: `linear-gradient(135deg, ${mainProject.color || '#4F46E5'}, #7C3AED)`,
                display: 'grid', placeItems: 'center',
                color: 'white', fontSize: 24, fontWeight: 700, flexShrink: 0,
              }}
            >
              {mainProject.name.charAt(0).toUpperCase()}
            </div>
            <div className="fill">
              <div className="row" style={{ gap: 6, marginBottom: 6 }}>
                {mainProject.client && <span className="chip accent xs">{mainProject.client}</span>}
                <StatusChip status={mainProject.status || 'active'} />
              </div>
              <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>
                {mainProject.name}
              </div>
              <div className="small muted" style={{ marginTop: 2 }}>
                {mainProject.description || 'Projeto em andamento'}
              </div>
              <div className="row" style={{ marginTop: 14, gap: 8 }}>
                <span className="xs faint">PROGRESSO</span>
                <div className="bar fill thick">
                  <span style={{ width: `${mainProgress}%` }} />
                </div>
                <span className="b small">{mainProgress}%</span>
                <span className="xs faint">· {doneTasks}/{totalTasks} tarefas</span>
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
            <div className="right" style={{ flexShrink: 0 }}>
              <div className="xs faint">DIAS RESTANTES</div>
              <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em' }}>
                {daysLeft !== null ? daysLeft : '—'}
              </div>
              {mainProject.endDate && (
                <div className="xs faint">{formatDate(mainProject.endDate)}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="kpi-grid">
        <KPI
          label="Projetos ativos"
          value={projects.filter((p) => p.status === 'active').length}
          sub={`de ${projects.length} total`}
        />
        <KPI
          label="Progresso principal"
          value={`${mainProgress}%`}
          sub={`${doneTasks} de ${totalTasks} tarefas`}
          delta={mainProgress > 0 ? { dir: 'up', text: `+${mainProgress}%` } : undefined}
        />
        <KPI
          label="Orçamento previsto"
          value={formatCurrency(plannedCost)}
          sub="total planejado pelas tasks"
        />
        <KPI
          label="Gastos realizados"
          value={formatCurrency(doneCost)}
          sub={plannedCost > 0 ? `${burnRate}% concluído` : 'tasks concluídas'}
          delta={burnRate > 80 ? { dir: 'down', text: 'Atenção' } : burnRate > 50 ? { dir: 'flat', text: `${burnRate}%` } : undefined}
        />
        <KPI
          label="Lançamentos manuais"
          value={formatCurrency(totalSpent)}
          sub="entradas avulsas de custo"
        />
        <KPI
          label="Equipe sobrecarregada"
          value={overloadedMembers.length}
          sub={overloadedMembers.length > 0 ? 'Acima de 85% de carga' : 'Nenhum'}
          delta={overloadedMembers.length > 0 ? { dir: 'down', text: 'Risco' } : { dir: 'up', text: 'OK' }}
        />
      </div>

      <div className="grid-2" style={{ gap: 12 }}>
        {/* Coluna esquerda */}
        <div className="col" style={{ gap: 12 }}>
          {/* Tabela de projetos */}
          <div className="card">
            <div className="card-head">
              <div className="card-title">Projetos</div>
              <Link to="/projects" className="btn sm ghost">Ver todos</Link>
            </div>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Orçamento</th>
                  <th>Status</th>
                  <th style={{ width: 120 }}>Progresso</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p: any) => {
                  const pct = projectProgress(p);
                  return (
                    <tr key={p.id}>
                      <td>
                        <div className="row">
                          <span className="sb-project-dot" style={{ background: p.color || 'var(--accent)' }} />
                          <Link to={`/projects/${p.id}`} className="b">{p.name}</Link>
                        </div>
                      </td>
                      <td className="mono xs faint">{formatCurrency(p.totalBudget || 0)}</td>
                      <td><StatusChip status={p.status || 'todo'} /></td>
                      <td>
                        <div className="row" style={{ gap: 8 }}>
                          <div className="bar fill">
                            <span style={{ width: `${pct}%` }} />
                          </div>
                          <span className="xs b" style={{ width: 30, textAlign: 'right' }}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {projects.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: 24, color: 'var(--text-3)' }}>
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
              <div className="card-title">Próximos marcos</div>
              {upcomingMilestones.length > 0 && (
                <span className="chip accent xs">{upcomingMilestones.length} pendentes</span>
              )}
            </div>
            <div className="card-body flush">
              {upcomingMilestones.length > 0 ? upcomingMilestones.map((m) => (
                <div key={m.id} className="list-item">
                  <span style={{ width: 8, height: 8, background: 'var(--warning)', transform: 'rotate(45deg)', flexShrink: 0 }} />
                  <span className="fill b small truncate">{m.name}</span>
                  <span className="xs faint">{formatDate(m.date)}</span>
                </div>
              )) : (
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
                <div className="card-title">Carga da equipe</div>
                <span className="xs faint">{memberMetrics.length} membros</span>
              </div>
              <div className="card-body flush">
                {(memberMetrics as MemberMetrics[]).slice(0, 6).map((m, i) => (
                  <div key={m.memberId} className="list-item">
                    <Avatar
                      initials={m.name.slice(0, 2).toUpperCase()}
                      colorIndex={i + 1}
                      size="sm"
                    />
                    <span className="fill small b truncate">{m.name}</span>
                    <div className="bar" style={{ width: 80 }}>
                      <span style={{
                        width: `${m.loadPercent}%`,
                        background: m.loadPercent > 85 ? 'var(--warning)' : 'var(--accent)',
                      }} />
                    </div>
                    <span className="xs b" style={{ width: 36, textAlign: 'right' }}>{m.loadPercent}%</span>
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
                      <div className="xs faint">{mainProject?.name}</div>
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

          {/* Resumo financeiro */}
          {mainProject && plannedCost > 0 && (
            <div className="card">
              <div className="card-head">
                <div className="card-title">Financeiro</div>
                <Link to={`/projects/${mainProject.id}/costs`} className="btn sm ghost">Ver custos</Link>
              </div>
              <div className="card-body">
                <div className="row between" style={{ marginBottom: 8 }}>
                  <span className="xs faint">Gastos realizados</span>
                  <span className="b mono">{formatCurrency(doneCost)}</span>
                </div>
                <div className="bar thick" style={{ marginBottom: 8 }}>
                  <span style={{
                    width: `${Math.min(burnRate, 100)}%`,
                    background: burnRate > 80 ? 'var(--warning)' : 'var(--accent)',
                  }} />
                </div>
                <div className="row between">
                  <span className="xs faint">Orçamento previsto</span>
                  <span className="xs faint mono">{formatCurrency(plannedCost)}</span>
                </div>
                <div className="row between" style={{ marginTop: 12 }}>
                  <span className="xs faint">Saldo restante</span>
                  <span className="b mono">{formatCurrency(plannedCost - doneCost)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
