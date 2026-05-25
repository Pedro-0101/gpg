import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { KPI } from '../../components/ui/KPI';
import { Avatar, AvatarStack } from '../../components/ui/Avatar';
import { StatusChip } from '../../components/ui/StatusChip';
import { costsApi } from '../../api/costs';
import { milestonesApi } from '../../api/risks-milestones';
import { calcSubtopicCost } from '../../lib/cost';
import { formatCurrency, formatDate } from '../../lib/utils';
import { differenceInCalendarDays } from 'date-fns';

interface ProjectOverviewPageProps { project: any; }

function BudgetChart({ project }: { project: any }) {
  const allSubs = (project.stages ?? []).flatMap((s: any) =>
    (s.topics ?? []).flatMap((t: any) => (t.subtopics ?? []).map((sub: any) => ({
      endDate: sub.endDate as string | null,
      cost: calcSubtopicCost(sub),
      done: sub.status === 'done',
    })))
  );

  if (allSubs.length === 0) return (
    <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
      Sem tarefas com custo calculado.
    </div>
  );

  const projectStart = new Date(project.startDate);
  const endDates = allSubs.map((s: any) => (s.endDate ? new Date(s.endDate) : null)).filter((d: Date | null): d is Date => d !== null);
  const lastTaskDate = endDates.length > 0 ? new Date(Math.max(...endDates.map((d: Date) => d.getTime()))) : new Date();
  const projectEnd = project.endDate
    ? new Date(Math.max(new Date(project.endDate).getTime(), lastTaskDate.getTime()))
    : lastTaskDate;

  const cursor = new Date(projectStart.getFullYear(), projectStart.getMonth(), 1);
  const endMonth = new Date(projectEnd.getFullYear(), projectEnd.getMonth() + 1, 0);
  const points: Array<{ label: string; planned: number; spent: number }> = [];

  while (cursor <= endMonth) {
    const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59);
    let planned = 0;
    let spent = 0;
    for (const sub of allSubs) {
      if (sub.endDate && new Date(sub.endDate) <= monthEnd) {
        planned += sub.cost;
        if (sub.done) spent += sub.cost;
      }
    }
    points.push({
      label: cursor.toLocaleDateString('pt-BR', { month: 'short' }),
      planned,
      spent,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  if (points.length < 2) return null;

  const maxVal = Math.max(...points.map(p => p.planned), 1);
  const W = 600, H = 150, PX = 6, PY = 10, LH = 16;
  const cH = H - PY * 2 - LH;
  const cW = W - PX * 2;

  const xPos = (i: number) => PX + (i / (points.length - 1)) * cW;
  const yPos = (v: number) => PY + cH - (v / maxVal) * cH;

  const pathLine = (vals: number[]) =>
    vals.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xPos(i).toFixed(1)} ${yPos(v).toFixed(1)}`).join(' ');

  const pathArea = (vals: number[]) =>
    `${pathLine(vals)} L ${xPos(vals.length - 1).toFixed(1)} ${yPos(0).toFixed(1)} L ${PX} ${yPos(0).toFixed(1)} Z`;

  const today = new Date();
  const totalMs = projectEnd.getTime() - projectStart.getTime();
  const elapsedMs = today.getTime() - projectStart.getTime();
  const todayFrac = Math.max(0, Math.min(1, elapsedMs / totalMs));
  const todayX = PX + todayFrac * cW;

  const labelStep = points.length <= 8 ? 1 : Math.ceil(points.length / 6);

  return (
    <div>
      <div className="row" style={{ gap: 20, marginBottom: 10, fontSize: 12 }}>
        <span className="row" style={{ gap: 5, alignItems: 'center' }}>
          <span style={{ width: 24, height: 2, background: 'var(--border)', display: 'inline-block', borderRadius: 2 }} />
          <span className="xs faint">Previsto</span>
        </span>
        <span className="row" style={{ gap: 5, alignItems: 'center' }}>
          <span style={{ width: 24, height: 3, background: 'var(--accent)', display: 'inline-block', borderRadius: 2 }} />
          <span className="xs faint">Realizado</span>
        </span>
        <span className="row" style={{ gap: 5, alignItems: 'center' }}>
          <span style={{ width: 14, height: 2, background: 'var(--danger)', display: 'inline-block', borderRadius: 2 }} />
          <span className="xs faint">Hoje</span>
        </span>
      </div>
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        {/* Planned area (light fill, dashed line) */}
        <path d={pathArea(points.map(p => p.planned))} fill="var(--accent)" fillOpacity="0.07" />
        <path d={pathLine(points.map(p => p.planned))} fill="none" stroke="var(--text-3)" strokeWidth="1.5" strokeDasharray="5 4" />
        {/* Spent area (solid fill, accent line) */}
        <path d={pathArea(points.map(p => p.spent))} fill="var(--accent)" fillOpacity="0.35" />
        <path d={pathLine(points.map(p => p.spent))} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" />
        {/* Today marker */}
        <line x1={todayX} y1={PY} x2={todayX} y2={PY + cH} stroke="var(--danger)" strokeWidth="1.5" strokeDasharray="3 2" strokeOpacity="0.7" />
        {/* Baseline */}
        <line x1={PX} y1={PY + cH} x2={W - PX} y2={PY + cH} stroke="var(--border)" strokeWidth="1" />
        {/* X labels */}
        {points.map((p, i) =>
          i % labelStep === 0 || i === points.length - 1 ? (
            <text key={i} x={xPos(i)} y={H - 2} textAnchor="middle" fontSize="9" fill="var(--text-3)">{p.label}</text>
          ) : null
        )}
      </svg>
    </div>
  );
}

export const ProjectOverviewPage: React.FC<ProjectOverviewPageProps> = ({ project }) => {
  const { data: costsSummary } = useQuery({
    queryKey: ['costs', project.id, 'summary'],
    queryFn: () => costsApi.summary(project.id),
  });
  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones', project.id],
    queryFn: () => milestonesApi.list(project.id),
  });

  const allSubtopics = (project.stages ?? []).flatMap((s: any) =>
    (s.topics ?? []).flatMap((t: any) => t.subtopics ?? []),
  );
  const totalTasks = allSubtopics.length;
  const completedTasks = allSubtopics.filter((s: any) => s.status === 'done').length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const plannedCost = costsSummary?.plannedCost ?? 0;
  const doneCost = costsSummary?.doneCost ?? 0;
  const burnRate = plannedCost > 0 ? Math.round((doneCost / plannedCost) * 100) : 0;

  const lastTaskDate = allSubtopics.reduce((max: Date | null, sub: any) => {
    const d = sub.endDate ? new Date(sub.endDate) : null;
    if (!d) return max;
    return !max || d > max ? d : max;
  }, null as Date | null);

  const deadlineDate = lastTaskDate ?? (project.endDate ? new Date(project.endDate) : null);
  const daysLeft = deadlineDate ? differenceInCalendarDays(deadlineDate, new Date()) : null;

  const teams = (project.teams ?? []) as any[];
  const professionalsCount = teams.reduce((n: number, t: any) => n + (t.professionals?.length ?? 0), 0);

  const upcomingMilestones = (milestones as any[])
    .filter((m) => m.status === 'pending')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 4);

  function stageProgress(stage: any) {
    const subs = (stage.topics ?? []).flatMap((t: any) => t.subtopics ?? []);
    if (subs.length === 0) return 0;
    return Math.round((subs.filter((s: any) => s.status === 'done').length / subs.length) * 100);
  }

  function stageStatus(stage: any): string {
    const subs = (stage.topics ?? []).flatMap((t: any) => t.subtopics ?? []);
    if (subs.length === 0) return 'todo';
    const done = subs.filter((s: any) => s.status === 'done').length;
    const inprog = subs.filter((s: any) => s.status === 'inprog').length;
    if (done === subs.length) return 'done';
    if (inprog > 0 || done > 0) return 'inprog';
    return 'todo';
  }

  const STAGE_COLORS = ['var(--success)', 'var(--accent)', 'var(--text)', 'var(--purple)'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Project hero */}
      <div className="row" style={{ gap: 16, alignItems: 'flex-start' }}>
        <div style={{
          width: 64, height: 64, borderRadius: 14, flexShrink: 0,
          background: `linear-gradient(135deg, ${project.color || '#4F46E5'}, #7C3AED)`,
          display: 'grid', placeItems: 'center', color: 'white', fontSize: 28, fontWeight: 700,
        }}>
          {project.name.charAt(0).toUpperCase()}
        </div>
        <div className="fill">
          <div className="row" style={{ gap: 6, marginBottom: 4 }}>
            {project.client && <span className="chip accent xs">{project.client}</span>}
            <StatusChip status={project.status || 'active'} />
          </div>
          <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em' }}>{project.name}</div>
          <div className="muted small" style={{ marginTop: 2 }}>
            {project.manager ? `PM ${project.manager.name}` : 'Sem PM'} · {formatDate(project.startDate)} → {deadlineDate ? formatDate(deadlineDate) : '—'}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div className="xs faint">PROGRESSO</div>
          <div style={{ fontSize: 24, fontWeight: 600 }}>{progress}%</div>
          <div className="bar" style={{ width: 140, marginTop: 4 }}>
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* KPI + Etapas grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
        {/* Etapas — span 2 rows */}
        <div className="card" style={{ gridRow: 'span 2' }}>
          <div className="card-head">
            <div className="card-title">Etapas <span className="card-sub">{(project.stages ?? []).length} totais</span></div>
            <Link to="gantt" className="btn sm ghost">Ver no Gantt</Link>
          </div>
          <div className="card-body flush">
            {(project.stages ?? []).map((stage: any, si: number) => {
              const tone = STAGE_COLORS[si % STAGE_COLORS.length];
              const pct = stageProgress(stage);
              const status = stageStatus(stage);
              const assignees = (stage.topics ?? [])
                .flatMap((t: any) => (t.subtopics ?? []).flatMap((s: any) =>
                  (s.teams ?? []).flatMap((st: any) => st.team?.professionals ?? [])
                ))
                .reduce((acc: any[], tp: any) => {
                  if (!acc.find((x: any) => x.professional?.id === tp.professional?.id)) acc.push(tp);
                  return acc;
                }, []).slice(0, 3);
              return (
                <div key={stage.id} className="list-item" style={{ padding: '14px 16px', alignItems: 'flex-start' }}>
                  <span style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: `color-mix(in srgb, ${tone} 12%, transparent)`,
                    color: tone, display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 600, flexShrink: 0,
                  }}>
                    {status === 'done' ? '✓' : si + 1}
                  </span>
                  <div className="fill">
                    <div className="row" style={{ gap: 6 }}>
                      <span className="b">{stage.name}</span>
                      <StatusChip status={status} />
                    </div>
                    <div className="xs faint" style={{ marginTop: 2 }}>
                      {(stage.topics ?? []).length} tópicos · {(stage.topics ?? []).reduce((n: number, t: any) => n + (t.subtopics?.length ?? 0), 0)} tarefas
                      {stage.endDate && ` · até ${formatDate(stage.endDate)}`}
                    </div>
                    <div className="row" style={{ marginTop: 6, gap: 8 }}>
                      <div className="bar fill">
                        <span style={{ width: `${pct}%`, background: tone }} />
                      </div>
                      <span className="xs b" style={{ minWidth: 32 }}>{pct}%</span>
                    </div>
                  </div>
                  <AvatarStack>
                    {assignees.length > 0
                      ? assignees.map((tp: any) => <Avatar key={tp.professional.id} initials={tp.professional.initials} colorIndex={tp.professional.avatarColor} size="sm" />)
                      : <Avatar initials="?" colorIndex={8} size="sm" />}
                  </AvatarStack>
                </div>
              );
            })}
            {(project.stages ?? []).length === 0 && (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-3)' }}>
                Nenhuma etapa. <Link to="stages" style={{ color: 'var(--accent)' }}>Criar etapas.</Link>
              </div>
            )}
          </div>
        </div>

        <KPI
          label="Orçamento previsto"
          value={formatCurrency(plannedCost)}
          sub={plannedCost > 0 ? `${burnRate}% já realizado` : 'calculado pelas tarefas'}
        />
        <KPI
          label="Prazo final das tarefas"
          value={deadlineDate ? formatDate(deadlineDate) : '—'}
          sub={daysLeft !== null ? (daysLeft < 0 ? `${Math.abs(daysLeft)} dias atrás` : `em ${daysLeft} dias`) : ''}
          delta={daysLeft !== null && daysLeft < 0 ? { dir: 'down', text: 'atrasado' } : daysLeft !== null ? { dir: 'flat', text: 'no prazo' } : undefined}
        />
        <KPI label="Tarefas abertas" value={totalTasks - completedTasks} sub={`${completedTasks} concluídas`} />
        <KPI label="Equipes alocadas" value={teams.length} sub={`${professionalsCount} profissionais`} />
      </div>

      {/* Budget area chart */}
      <div className="card">
        <div className="card-head">
          <div className="card-title">Orçamento previsto × realizado</div>
          <div className="row" style={{ gap: 16 }}>
            <span className="xs faint">Previsto: <span className="b">{formatCurrency(plannedCost)}</span></span>
            <span className="xs" style={{ color: 'var(--accent)' }}>Realizado: <span className="b">{formatCurrency(doneCost)}</span></span>
          </div>
        </div>
        <div className="card-body" style={{ paddingTop: 4 }}>
          <BudgetChart project={project} />
        </div>
      </div>

      <div className="grid-3" style={{ gap: 12 }}>
        {/* Equipes alocadas */}
        <div className="card">
          <div className="card-head">
            <div className="card-title">Equipes alocadas</div>
            <Link to="teams" className="btn sm ghost">Gerenciar</Link>
          </div>
          <div className="card-body flush">
            {teams.slice(0, 6).map((team: any) => (
              <div key={team.id} className="list-item">
                <div style={{
                  width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                  background: 'var(--surface-2)', display: 'grid', placeItems: 'center',
                }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>
                    {team.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="fill" style={{ minWidth: 0 }}>
                  <div className="small b truncate">{team.name}</div>
                  <div className="xs faint">{(team.professionals ?? []).length} profissionais</div>
                </div>
                <AvatarStack>
                  {(team.professionals ?? []).slice(0, 3).map((tp: any) => (
                    <Avatar
                      key={tp.professional.id}
                      initials={tp.professional.initials}
                      colorIndex={tp.professional.avatarColor}
                      size="sm"
                    />
                  ))}
                </AvatarStack>
              </div>
            ))}
            {teams.length === 0 && (
              <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-3)' }}>
                Sem equipes. <Link to="teams" style={{ color: 'var(--accent)' }}>Criar equipes.</Link>
              </div>
            )}
          </div>
        </div>

        {/* Próximas entregas */}
        <div className="card">
          <div className="card-head">
            <div className="card-title">Próximas entregas</div>
          </div>
          <div className="card-body flush">
            {upcomingMilestones.map((m: any) => (
              <div key={m.id} className="list-item">
                <span style={{ width: 8, height: 8, background: 'var(--warning)', transform: 'rotate(45deg)', flexShrink: 0 }} />
                <span className="fill small b truncate">{m.name}</span>
                <span className="xs faint">{formatDate(m.date)}</span>
              </div>
            ))}
            {upcomingMilestones.length === 0 && (
              <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-3)' }}>
                Sem marcos pendentes.
                <br />
                <Link to="gantt" style={{ color: 'var(--accent)', fontSize: 12 }}>Adicionar no Gantt.</Link>
              </div>
            )}
          </div>
        </div>

        {/* Ações rápidas */}
        <div className="card">
          <div className="card-head">
            <div className="card-title">Ações rápidas</div>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              ['Abrir Gantt', 'gantt'],
              ['Ver tarefas', 'stages'],
              ['Lançar despesa', 'costs'],
              ['Gerenciar equipes', 'teams'],
              ['Gerar relatório', 'reports'],
            ].map(([label, to]) => (
              <Link
                key={to}
                to={to}
                style={{ padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}
              >
                <span className="fill small b">{label}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
