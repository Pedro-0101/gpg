import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { KPI } from '../../components/ui/KPI';
import { Avatar, AvatarStack } from '../../components/ui/Avatar';
import { StatusChip } from '../../components/ui/StatusChip';
import { costsApi } from '../../api/costs';
import { milestonesApi, risksApi } from '../../api/risks-milestones';
import { decisionsApi } from '../../api/decisions';
import { projectsApi } from '../../api/projects';
import { calcSubtopicCost, calcStageCost, calcStageDoneCost } from '../../lib/cost';
import { formatCurrency, formatDate } from '../../lib/utils';
import { differenceInCalendarDays } from 'date-fns';

interface ProjectOverviewPageProps { project: any; }

const STAGE_PALETTE = ['#4F46E5', '#10B981', '#0EA5E9', '#F59E0B', '#EF4444', '#7C3AED', '#EC4899', '#06B6D4'];

const CAT_COLORS: Record<string, string> = {
  Pessoal:        'var(--accent)',
  Ferramentas:    'var(--purple)',
  Infraestrutura: 'var(--success)',
  Freelancers:    'var(--warning)',
  Outros:         'var(--text-3)',
};

const STATUS_META: Array<{ key: string; label: string; color: string }> = [
  { key: 'done',    label: 'Concluídas',   color: 'var(--success)' },
  { key: 'inprog',  label: 'Em progresso', color: 'var(--info)' },
  { key: 'review',  label: 'Em revisão',   color: 'var(--warning)' },
  { key: 'blocked', label: 'Bloqueadas',   color: 'var(--danger)' },
  { key: 'todo',    label: 'A fazer',      color: 'var(--text-3)' },
];

const PROB_LABEL: Record<string, string> = { high: 'alta', med: 'média', low: 'baixa' };
const IMPACT_LABEL: Record<string, string> = { high: 'alto', med: 'médio', low: 'baixo' };

function BudgetChart({ project }: { project: any }) {
  const [hoveredIdx, setHoveredIdx] = React.useState<number | null>(null);
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
  const points: Array<{ label: string; fullLabel: string; planned: number; spent: number }> = [];

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
      label: cursor.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
      fullLabel: cursor.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      planned,
      spent,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  if (points.length < 2) return null;

  const maxVal = Math.max(...points.map(p => p.planned), 1);
  const W = 1200, H = 320, PX = 40, PY = 30, LH = 24;
  const cH = H - PY * 2 - LH;
  const cW = W - PX * 2;

  const xPos = (i: number) => PX + (i / (points.length - 1)) * cW;
  const yPos = (v: number) => PY + cH - (v / maxVal) * cH;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    
    let bestIdx = 0;
    let minDist = Infinity;
    for (let i = 0; i < points.length; i++) {
      const dist = Math.abs(xPos(i) - x);
      if (dist < minDist) {
        minDist = dist;
        bestIdx = i;
      }
    }
    setHoveredIdx(bestIdx);
  };

  const pathLine = (vals: number[]) =>
    vals.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xPos(i).toFixed(1)} ${yPos(v).toFixed(1)}`).join(' ');

  const pathArea = (vals: number[]) =>
    `${pathLine(vals)} L ${xPos(vals.length - 1).toFixed(1)} ${yPos(0).toFixed(1)} L ${PX} ${yPos(0).toFixed(1)} Z`;

  const today = new Date();
  const totalMs = projectEnd.getTime() - projectStart.getTime();
  const elapsedMs = today.getTime() - projectStart.getTime();
  const todayFrac = Math.max(0, Math.min(1, elapsedMs / totalMs));
  const todayX = PX + todayFrac * cW;

  const labelStep = Math.max(1, Math.ceil(points.length / 12));

  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: `${W}/${H}`, maxWidth: '100%' }}>
      <div className="row" style={{ gap: 24, marginBottom: 16, fontSize: 13 }}>
        <span className="row" style={{ gap: 8, alignItems: 'center' }}>
          <span style={{ width: 14, height: 14, background: 'var(--accent)', opacity: 0.1, borderRadius: 3, border: '1px dashed var(--text-3)' }} />
          <span className="faint">Orçamento Previsto</span>
        </span>
        <span className="row" style={{ gap: 8, alignItems: 'center' }}>
          <span style={{ width: 14, height: 14, background: 'var(--accent)', opacity: 0.4, borderRadius: 3 }} />
          <span className="faint">Custo Realizado</span>
        </span>
        <span className="row" style={{ gap: 8, alignItems: 'center' }}>
          <span style={{ width: 2, height: 14, background: 'var(--danger)', borderLeft: '2px dashed var(--danger)' }} />
          <span className="faint">Hoje</span>
        </span>
      </div>
      <svg 
        width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredIdx(null)}
        style={{ overflow: 'visible', cursor: 'crosshair', display: 'block' }}
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(p => (
          <line key={p} x1={PX} y1={yPos(maxVal * p)} x2={W - PX} y2={yPos(maxVal * p)} stroke="var(--border)" strokeWidth="0.5" strokeDasharray="6 4" />
        ))}

        {/* Planned area (light fill, dashed line) */}
        <path d={pathArea(points.map(p => p.planned))} fill="var(--accent)" fillOpacity="0.05" />
        <path d={pathLine(points.map(p => p.planned))} fill="none" stroke="var(--text-3)" strokeWidth="1.2" strokeDasharray="5 5" strokeOpacity="0.4" />
        
        {/* Spent area (solid fill, accent line) */}
        <path d={pathArea(points.map(p => p.spent))} fill="var(--accent)" fillOpacity="0.15" />
        <path d={pathLine(points.map(p => p.spent))} fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinejoin="round" />
        
        {/* Today marker */}
        <line x1={todayX} y1={PY} x2={todayX} y2={PY + cH} stroke="var(--danger)" strokeWidth="2" strokeDasharray="4 3" />
        
        {/* Baseline */}
        <line x1={PX} y1={PY + cH} x2={W - PX} y2={PY + cH} stroke="var(--border-strong)" strokeWidth="1.5" />
        
        {/* X labels */}
        {points.map((p, i) => {
          const isLast = i === points.length - 1;
          const isStep = i % labelStep === 0;
          if (!isStep && !isLast) return null;
          
          // Avoid showing last label if it's too close to the previous step label
          if (isLast && !isStep && (i % labelStep) < (labelStep / 2)) return null;

          let anchor: "start" | "middle" | "end" = "middle";
          if (i === 0) anchor = "start";
          else if (i === points.length - 1) anchor = "end";

          return (
            <text key={i} x={xPos(i)} y={H - 6} textAnchor={anchor} fontSize="11" fill="var(--text-3)" fontWeight="500">{p.label}</text>
          );
        })}

        {/* Transparent hit area to capture mouse events across the whole SVG */}
        <rect width={W} height={H} fill="transparent" />

        {/* Hover elements */}
        {hoveredIdx !== null && (
          <g style={{ pointerEvents: 'none' }}>
            <line x1={xPos(hoveredIdx)} y1={PY} x2={xPos(hoveredIdx)} y2={PY + cH} stroke="var(--accent)" strokeWidth="2" strokeDasharray="5 3" />
            <circle cx={xPos(hoveredIdx)} cy={yPos(points[hoveredIdx].planned)} r="5" fill="white" stroke="var(--text-3)" strokeWidth="2" />
            <circle cx={xPos(hoveredIdx)} cy={yPos(points[hoveredIdx].spent)} r="5" fill="white" stroke="var(--accent)" strokeWidth="2.5" />
            
            <g transform={`translate(${xPos(hoveredIdx) > W / 2 ? xPos(hoveredIdx) - 195 : xPos(hoveredIdx) + 15}, ${PY + 20})`}>
              <rect width="180" height="64" rx="8" fill="white" stroke="var(--border-strong)" strokeWidth="1" style={{ filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.1))' }} />
              <text x="12" y="22" fontSize="12" fontWeight="700" fill="var(--text)">{points[hoveredIdx].fullLabel}</text>
              <text x="12" y="40" fontSize="11" fill="var(--text-2)">Previsto: <tspan fontWeight="600" fill="var(--text)">{formatCurrency(points[hoveredIdx].planned)}</tspan></text>
              <text x="12" y="54" fontSize="11" fill="var(--text-2)">Realizado: <tspan fontWeight="700" fill="var(--accent)">{formatCurrency(points[hoveredIdx].spent)}</tspan></text>
            </g>
          </g>
        )}
      </svg>
    </div>
  );
}

export const ProjectOverviewPage: React.FC<ProjectOverviewPageProps> = ({ project }) => {
  const queryClient = useQueryClient();
  const { data: costsSummary } = useQuery({
    queryKey: ['costs', project.id, 'summary'],
    queryFn: () => costsApi.summary(project.id),
  });
  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones', project.id],
    queryFn: () => milestonesApi.list(project.id),
  });
  const { data: costEntries = [] } = useQuery({
    queryKey: ['costs', project.id],
    queryFn: () => costsApi.list(project.id),
  });
  const { data: risks = [] } = useQuery({
    queryKey: ['risks', project.id],
    queryFn: () => risksApi.list(project.id),
  });
  const { data: decisions = [] } = useQuery({
    queryKey: ['decisions', project.id],
    queryFn: () => decisionsApi.list(project.id),
  });

  const recalcMut = useMutation({
    mutationFn: () => projectsApi.recalculate(project.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', project.id] });
    },
  });

  const allSubtopics = (project.stages ?? []).flatMap((s: any) =>
    (s.topics ?? []).flatMap((t: any) => t.subtopics ?? []),
  );
  const totalTasks = allSubtopics.length;
  const completedTasks = allSubtopics.filter((s: any) => s.status === 'done').length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const taskPlannedCost = costsSummary?.plannedCost ?? 0;
  const userBudget = Number(project.totalBudget ?? 0);
  const plannedCost = userBudget > 0 ? userBudget : taskPlannedCost;
  const doneCost = costsSummary?.doneCost ?? 0;
  const miscSpent = costsSummary?.totalSpent ?? 0;
  const miscCount = costsSummary?.count ?? 0;
  const totalRealized = doneCost + miscSpent;
  const balance = plannedCost - totalRealized;
  const burnRate = plannedCost > 0 ? Math.round((totalRealized / plannedCost) * 100) : 0;

  const costByCategory = Object.entries(costsSummary?.byCategory ?? {})
    .map(([cat, val]) => [cat, Number(val)] as [string, number])
    .sort((a, b) => b[1] - a[1]);

  const entriesByStage: Record<string, number> = {};
  let unassignedMisc = 0;
  for (const e of costEntries as any[]) {
    if (e.stageId) entriesByStage[e.stageId] = (entriesByStage[e.stageId] ?? 0) + Number(e.amount);
    else unassignedMisc += Number(e.amount);
  }

  const stageCostRows = (project.stages ?? []).map((stage: any, si: number) => {
    const personnel = calcStageCost(stage);
    const personnelDone = calcStageDoneCost(stage);
    const misc = entriesByStage[stage.id] ?? 0;
    return {
      id: stage.id,
      name: stage.name,
      tone: STAGE_PALETTE[si % STAGE_PALETTE.length],
      personnel,
      personnelDone,
      misc,
      total: personnel + misc,
    };
  });
  const grandTotal = stageCostRows.reduce((n: number, r: any) => n + r.total, 0) + unassignedMisc;

  const overdueTasks = allSubtopics.filter(
    (s: any) => s.status !== 'done' && s.endDate && new Date(s.endDate) < new Date(),
  ).length;
  const statusCounts = allSubtopics.reduce((acc: Record<string, number>, s: any) => {
    acc[s.status] = (acc[s.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sevRank: Record<string, number> = { high: 3, med: 2, low: 1 };
  const activeRisks = ((risks as any[]) ?? [])
    .filter((r) => r.status === 'active')
    .sort((a, b) =>
      (sevRank[b.probability] ?? 0) * (sevRank[b.impact] ?? 0) -
      (sevRank[a.probability] ?? 0) * (sevRank[a.impact] ?? 0),
    );
  const criticalRisks = activeRisks.filter((r) => r.probability === 'high' && r.impact === 'high').length;
  const pendingDecisions = ((decisions as any[]) ?? [])
    .filter((d) => d.status === 'pending')
    .sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

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

      {/* KPI row — financeiro */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <KPI
          label="Orçamento previsto"
          value={formatCurrency(plannedCost)}
          sub={userBudget > 0 ? 'valor fixo definido para o projeto' : 'sem orçamento definido — usando custo de pessoal'}
          accentColor="var(--accent)"
        />
        <KPI
          label="Custo previsto de pessoal"
          value={formatCurrency(taskPlannedCost)}
          sub="calculado pelas tarefas (horas × custo/h)"
          accentColor="var(--info)"
        />
        <KPI
          label="Custo realizado"
          value={formatCurrency(totalRealized)}
          delta={plannedCost > 0 ? { dir: burnRate > 100 ? 'down' : 'flat', text: `${burnRate}%` } : undefined}
          sub="tarefas concluídas + lançamentos"
          accentColor="var(--success)"
        />
        <KPI
          label="Lançamentos diversos"
          value={formatCurrency(miscSpent)}
          sub={`${miscCount} lançamento${miscCount === 1 ? '' : 's'} no projeto`}
          accentColor="var(--purple)"
        />
        <KPI
          label="Saldo restante"
          value={formatCurrency(Math.abs(balance))}
          delta={plannedCost > 0 ? (balance < 0 ? { dir: 'down', text: 'déficit' } : { dir: 'up', text: 'folga' }) : undefined}
          sub={balance >= 0 ? 'orçamento ainda disponível' : 'acima do previsto'}
          accentColor={balance < 0 ? 'var(--danger)' : 'var(--warning)'}
        />
      </div>

      {/* KPI row — execução */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <KPI
          label="Prazo final das tarefas"
          value={deadlineDate ? formatDate(deadlineDate) : '—'}
          sub={daysLeft !== null ? (daysLeft < 0 ? `${Math.abs(daysLeft)} dias atrás` : `em ${daysLeft} dias`) : ''}
          delta={daysLeft !== null && daysLeft < 0 ? { dir: 'down', text: 'atrasado' } : daysLeft !== null ? { dir: 'flat', text: 'no prazo' } : undefined}
        />
        <KPI
          label="Tarefas abertas"
          value={totalTasks - completedTasks}
          sub={`${completedTasks} concluídas de ${totalTasks}`}
          delta={overdueTasks > 0 ? { dir: 'down', text: `${overdueTasks} atrasada${overdueTasks === 1 ? '' : 's'}` } : undefined}
        />
        <KPI label="Equipes alocadas" value={teams.length} sub={`${professionalsCount} profissionais`} />
        <KPI
          label="Riscos ativos"
          value={activeRisks.length}
          sub={`${pendingDecisions.length} decis${pendingDecisions.length === 1 ? 'ão' : 'ões'} pendente${pendingDecisions.length === 1 ? '' : 's'}`}
          delta={criticalRisks > 0 ? { dir: 'down', text: `${criticalRisks} crítico${criticalRisks === 1 ? '' : 's'}` } : undefined}
        />
      </div>

      {/* Etapas — card grid */}
      <div className="card">
        <div className="card-head">
          <div className="card-title">Etapas <span className="card-sub">{(project.stages ?? []).length} etapas · cada uma destrava a próxima</span></div>
          <Link to="gantt" className="btn sm ghost">Ver no Gantt →</Link>
        </div>
        <div className="card-body">
          {(project.stages ?? []).length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
              {(project.stages ?? []).map((stage: any, si: number) => {
                const tone = STAGE_PALETTE[si % STAGE_PALETTE.length];
                const pct = stageProgress(stage);
                const status = stageStatus(stage);
                const taskCount = (stage.topics ?? []).reduce((n: number, t: any) => n + (t.subtopics?.length ?? 0), 0);
                const topicCount = (stage.topics ?? []).length;
                const stageTotal = calcStageCost(stage) + (entriesByStage[stage.id] ?? 0);
                return (
                  <div key={stage.id} style={{
                    border: `1px solid color-mix(in srgb, ${tone} 25%, var(--border))`,
                    borderRadius: 8, padding: 14,
                    background: status === 'inprog'
                      ? `color-mix(in srgb, ${tone} 5%, var(--surface))`
                      : 'var(--surface)',
                    position: 'relative',
                  }}>
                    {status === 'inprog' && (
                      <div style={{
                        position: 'absolute', top: -8, right: 10,
                        background: tone, color: 'white',
                        padding: '1px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                      }}>ATUAL</div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{
                        width: 24, height: 24, borderRadius: '50%',
                        background: tone, color: 'white',
                        display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0,
                      }}>
                        {status === 'done' ? '✓' : si + 1}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--text-3)', textAlign: 'right' }}>
                        {stage.startDate && stage.endDate
                          ? `${formatDate(stage.startDate).slice(0, 5)} → ${formatDate(stage.endDate).slice(0, 5)}`
                          : ''}
                      </span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 14, marginTop: 8, lineHeight: 1.3 }}>{stage.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>
                      {topicCount} tópicos · {taskCount} tarefas
                    </div>
                    {stageTotal > 0 && (
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', marginTop: 4 }}>
                        {formatCurrency(stageTotal)} <span style={{ fontWeight: 400, color: 'var(--text-3)' }}>custo total</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
                      <div style={{ flex: 1, height: 6, background: 'var(--surface-3)', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: tone, borderRadius: 999 }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, minWidth: 28, textAlign: 'right' }}>{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--text-3)' }}>
              Nenhuma etapa. <Link to="stages" style={{ color: 'var(--accent)' }}>Criar etapas.</Link>
            </div>
          )}
        </div>
      </div>

      {/* Budget area chart */}
      <div className="card">
        <div className="card-head">
          <div className="card-title">Orçamento previsto × realizado</div>
          <div className="row" style={{ gap: 16 }}>
            <span className="xs faint">Previsto: <span className="b">{formatCurrency(taskPlannedCost)}</span></span>
            <span className="xs" style={{ color: 'var(--accent)' }}>Realizado: <span className="b">{formatCurrency(doneCost)}</span></span>
          </div>
        </div>
        <div className="card-body" style={{ paddingTop: 4 }}>
          <BudgetChart project={project} />
        </div>
      </div>

      {/* Custo geral por etapa */}
      <div className="card">
        <div className="card-head">
          <div className="card-title">
            Custo geral por etapa <span className="card-sub">pessoal + lançamentos diversos</span>
          </div>
          <Link to="costs" className="btn sm ghost">Ver custos →</Link>
        </div>
        {stageCostRows.length === 0 ? (
          <div className="card-body" style={{ textAlign: 'center', color: 'var(--text-3)', padding: 24 }}>
            Nenhuma etapa cadastrada.
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Etapa</th>
                <th className="right">Pessoal previsto</th>
                <th className="right">Pessoal realizado</th>
                <th className="right">Lançamentos</th>
                <th className="right">Custo total</th>
                <th style={{ width: 150 }}>% do projeto</th>
              </tr>
            </thead>
            <tbody>
              {stageCostRows.map((row: any, i: number) => {
                const sharePct = grandTotal > 0 ? (row.total / grandTotal) * 100 : 0;
                return (
                  <tr key={row.id}>
                    <td>
                      <div className="row" style={{ gap: 8 }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          padding: '1px 6px', borderRadius: 4, fontSize: 9, fontWeight: 700,
                          background: `color-mix(in srgb, ${row.tone} 12%, transparent)`, color: row.tone,
                          border: `1px solid ${row.tone}33`, flexShrink: 0,
                        }}>
                          E{i + 1}
                        </span>
                        <span className="small b">{row.name}</span>
                      </div>
                    </td>
                    <td className="right mono xs">{formatCurrency(row.personnel)}</td>
                    <td className="right mono xs">{formatCurrency(row.personnelDone)}</td>
                    <td className="right mono xs">{row.misc > 0 ? formatCurrency(row.misc) : '—'}</td>
                    <td className="right mono small b">{formatCurrency(row.total)}</td>
                    <td>
                      <div className="row" style={{ gap: 8, alignItems: 'center' }}>
                        <div style={{ flex: 1, height: 6, background: 'var(--surface-3)', borderRadius: 999, overflow: 'hidden' }}>
                          <div style={{ width: `${sharePct}%`, height: '100%', background: row.tone, borderRadius: 999 }} />
                        </div>
                        <span className="xs faint" style={{ width: 32, textAlign: 'right' }}>{Math.round(sharePct)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {unassignedMisc > 0 && (
                <tr>
                  <td><span className="xs faint" style={{ fontStyle: 'italic' }}>Lançamentos sem etapa</span></td>
                  <td className="right mono xs">—</td>
                  <td className="right mono xs">—</td>
                  <td className="right mono xs">{formatCurrency(unassignedMisc)}</td>
                  <td className="right mono small b">{formatCurrency(unassignedMisc)}</td>
                  <td>
                    <div className="row" style={{ gap: 8, alignItems: 'center' }}>
                      <div style={{ flex: 1, height: 6, background: 'var(--surface-3)', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{ width: `${grandTotal > 0 ? (unassignedMisc / grandTotal) * 100 : 0}%`, height: '100%', background: 'var(--text-3)', borderRadius: 999 }} />
                      </div>
                      <span className="xs faint" style={{ width: 32, textAlign: 'right' }}>
                        {grandTotal > 0 ? Math.round((unassignedMisc / grandTotal) * 100) : 0}%
                      </span>
                    </div>
                  </td>
                </tr>
              )}
              <tr style={{ background: 'var(--surface-2)' }}>
                <td className="small b">Total do projeto</td>
                <td className="right mono xs b">{formatCurrency(taskPlannedCost)}</td>
                <td className="right mono xs b">{formatCurrency(doneCost)}</td>
                <td className="right mono xs b">{formatCurrency(miscSpent)}</td>
                <td className="right mono small b">{formatCurrency(grandTotal)}</td>
                <td />
              </tr>
            </tbody>
          </table>
        )}
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
            <button
              onClick={() => recalcMut.mutate()}
              disabled={recalcMut.isPending}
              style={{
                padding: '10px 12px', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', gap: 10,
                cursor: recalcMut.isPending ? 'wait' : 'pointer',
                background: 'none', font: 'inherit', width: '100%', textAlign: 'left',
              }}
            >
              <span className="fill small b">
                {recalcMut.isPending ? 'Recalculando...' : recalcMut.isSuccess ? 'Recalculado ✓' : 'Recalcular cronograma'}
              </span>
              {!recalcMut.isPending && !recalcMut.isSuccess && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="grid-3" style={{ gap: 12 }}>
        {/* Status das tarefas */}
        <div className="card">
          <div className="card-head">
            <div className="card-title">Status das tarefas</div>
            <span className="card-sub">{totalTasks} no total</span>
          </div>
          <div className="card-body">
            {totalTasks === 0 ? (
              <div style={{ padding: '8px 0', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                Nenhuma tarefa cadastrada.
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', height: 10, borderRadius: 999, overflow: 'hidden', background: 'var(--surface-3)', marginBottom: 14 }}>
                  {STATUS_META.map(({ key, color }) => {
                    const n = statusCounts[key] ?? 0;
                    if (n === 0) return null;
                    return <div key={key} style={{ width: `${(n / totalTasks) * 100}%`, background: color }} />;
                  })}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {STATUS_META.map(({ key, label, color }) => {
                    const n = statusCounts[key] ?? 0;
                    return (
                      <div key={key} className="row" style={{ gap: 8 }}>
                        <span style={{ width: 10, height: 10, borderRadius: 3, background: color, flexShrink: 0 }} />
                        <span className="fill small">{label}</span>
                        <span className="mono xs b">{n}</span>
                        <span className="xs faint" style={{ width: 36, textAlign: 'right' }}>
                          {Math.round((n / totalTasks) * 100)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
                {overdueTasks > 0 && (
                  <div className="row" style={{ gap: 8, marginTop: 12, padding: '8px 10px', background: 'var(--danger-soft)', borderRadius: 'var(--radius)' }}>
                    <span style={{ color: 'var(--danger)', fontWeight: 700, fontSize: 12 }}>!</span>
                    <span className="xs" style={{ color: 'var(--danger)' }}>
                      {overdueTasks} tarefa{overdueTasks === 1 ? '' : 's'} com prazo vencido
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Lançamentos por categoria */}
        <div className="card">
          <div className="card-head">
            <div className="card-title">Lançamentos por categoria</div>
            <Link to="costs" className="btn sm ghost">Detalhar</Link>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {costByCategory.length === 0 ? (
              <div style={{ padding: '8px 0', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                Nenhum lançamento registrado.
                <br />
                <Link to="costs" style={{ color: 'var(--accent)', fontSize: 12 }}>Lançar despesa.</Link>
              </div>
            ) : (
              <>
                {costByCategory.map(([cat, val]) => {
                  const color = CAT_COLORS[cat] ?? 'var(--text-3)';
                  const pct = miscSpent > 0 ? (val / miscSpent) * 100 : 0;
                  return (
                    <div key={cat}>
                      <div className="row between" style={{ marginBottom: 4 }}>
                        <span className="row small" style={{ gap: 6, alignItems: 'center' }}>
                          <span style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
                          {cat}
                        </span>
                        <span className="mono xs b">
                          {formatCurrency(val)} <span className="faint">· {Math.round(pct)}%</span>
                        </span>
                      </div>
                      <div style={{ height: 6, background: 'var(--surface-3)', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 999 }} />
                      </div>
                    </div>
                  );
                })}
                <div className="row between" style={{ marginTop: 4, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                  <span className="small b">Total lançado</span>
                  <span className="mono small b">{formatCurrency(miscSpent)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Riscos e decisões */}
        <div className="card">
          <div className="card-head">
            <div className="card-title">Riscos e decisões</div>
            {criticalRisks > 0 && (
              <span className="chip high xs">{criticalRisks} crítico{criticalRisks === 1 ? '' : 's'}</span>
            )}
          </div>
          <div className="card-body flush">
            <div className="xs faint b" style={{ padding: '10px 16px 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Riscos ativos
            </div>
            {activeRisks.slice(0, 3).map((r: any) => (
              <div key={r.id} className="list-item" style={{ alignItems: 'flex-start' }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%', marginTop: 5, flexShrink: 0,
                  background: r.impact === 'high' ? 'var(--danger)' : r.impact === 'med' ? 'var(--warning)' : 'var(--text-3)',
                }} />
                <div className="fill" style={{ minWidth: 0 }}>
                  <div className="small b truncate">{r.title}</div>
                  <div className="xs faint">
                    prob. {PROB_LABEL[r.probability] ?? r.probability} · impacto {IMPACT_LABEL[r.impact] ?? r.impact}
                  </div>
                </div>
              </div>
            ))}
            {activeRisks.length === 0 && (
              <div className="xs faint" style={{ padding: '6px 16px 10px' }}>Nenhum risco ativo.</div>
            )}
            <div className="xs faint b" style={{ padding: '10px 16px 4px', textTransform: 'uppercase', letterSpacing: '0.05em', borderTop: '1px solid var(--border)' }}>
              Decisões pendentes
            </div>
            {pendingDecisions.slice(0, 3).map((d: any) => (
              <div key={d.id} className="list-item">
                <span style={{ width: 8, height: 8, background: 'var(--purple)', transform: 'rotate(45deg)', flexShrink: 0 }} />
                <span className="fill small b truncate">{d.title}</span>
                <span className="xs faint">{d.dueDate ? formatDate(d.dueDate) : 'sem prazo'}</span>
              </div>
            ))}
            {pendingDecisions.length === 0 && (
              <div className="xs faint" style={{ padding: '6px 16px 12px' }}>Nenhuma decisão pendente.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
