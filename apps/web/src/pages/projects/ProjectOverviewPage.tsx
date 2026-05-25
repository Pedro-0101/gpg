import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { KPI } from '../../components/ui/KPI';
import { Avatar, AvatarStack } from '../../components/ui/Avatar';
import { StatusChip } from '../../components/ui/StatusChip';
import { costsApi } from '../../api/costs';
import { milestonesApi } from '../../api/risks-milestones';
import { formatCurrency, formatDate } from '../../lib/utils';
import { differenceInCalendarDays } from 'date-fns';

interface ProjectOverviewPageProps { project: any; }

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

  const budget = Number(project.totalBudget) || 0;
  const totalSpent = costsSummary?.totalSpent ?? 0;
  const burnRate = budget > 0 ? Math.round((totalSpent / budget) * 100) : 0;

  const daysLeft = project.endDate ? differenceInCalendarDays(new Date(project.endDate), new Date()) : null;

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
            {project.manager ? `PM ${project.manager.name}` : 'Sem PM'} · {formatDate(project.startDate)} → {project.endDate ? formatDate(project.endDate) : '—'}
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

        <KPI label="Orçamento" value={formatCurrency(budget)} sub={`${burnRate}% consumido`} />
        <KPI label="Prazo final" value={project.endDate ? formatDate(project.endDate) : '—'}
          sub={daysLeft !== null ? `em ${Math.abs(daysLeft)} dias` : ''}
          delta={daysLeft !== null && daysLeft < 0 ? { dir: 'down', text: 'atrasado' } : { dir: 'flat', text: 'no prazo' }} />
        <KPI label="Tarefas abertas" value={totalTasks - completedTasks} sub={`${completedTasks} concluídas`} />
        <KPI label="Equipe ativa" value={(project.members ?? []).length} sub="pessoas alocadas" />
      </div>

      <div className="grid-3" style={{ gap: 12 }}>
        {/* Equipe alocada */}
        <div className="card">
          <div className="card-head">
            <div className="card-title">Equipe alocada</div>
            <Link to="team" className="btn sm ghost">Gerenciar</Link>
          </div>
          <div className="card-body flush">
            {(project.members ?? []).slice(0, 6).map((member: any, i: number) => (
              <div key={member.id} className="list-item">
                <Avatar initials={member.initials} colorIndex={member.avatarColor} size="sm" />
                <span className="fill small b truncate">{member.name}</span>
                <span className="xs faint">{member.role}</span>
              </div>
            ))}
            {(project.members ?? []).length === 0 && (
              <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-3)' }}>Sem membros.</div>
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
              ['stages', 'Abrir Gantt', 'gantt'],
              ['stages', 'Ver kanban', 'stages'],
              ['costs', 'Lançar despesa', 'costs'],
              ['team', 'Convidar membro', 'team'],
              ['reports', 'Gerar relatório', 'reports'],
            ].map(([, label, to]) => (
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
