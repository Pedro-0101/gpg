import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Avatar } from '../../components/ui/Avatar';
import { costsApi } from '../../api/costs';
import { membersApi } from '../../api/members';
import { decisionsApi } from '../../api/decisions';
import { stagesApi } from '../../api/stages';
import { milestonesApi } from '../../api/risks-milestones';
import { calcStageCost } from '../../lib/cost';
import { formatCurrency, formatDate } from '../../lib/utils';
import type { Project, Decision, MemberMetrics, CostEntry } from '../../types';

interface ReportsPageProps { project: Project; }

const STAGE_COLORS = ['#4F46E5', '#10B981', '#0EA5E9', '#F59E0B', '#EF4444', '#7C3AED', '#EC4899', '#06B6D4'];
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// ── SVG helpers ───────────────────────────────────────────────────────────────

function BarsVertical({ bars, unit = '' }: { bars: { v: number; c: string; l: string }[]; unit?: string }) {
  const max = Math.max(...bars.map(b => b.v), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 160, padding: '8px 4px 0' }}>
      {bars.map((b, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
          <div className="xs b" style={{ color: b.c }}>{b.v}{unit}</div>
          <div style={{
            width: '100%', maxWidth: 36,
            height: `${(b.v / max) * 120}px`,
            minHeight: b.v === 0 ? 2 : 8,
            background: b.c, borderRadius: '4px 4px 0 0',
            transition: 'height 0.3s',
          }} />
          <div className="xs faint" style={{ textAlign: 'center', fontSize: 10, marginTop: 4 }}>{b.l}</div>
        </div>
      ))}
    </div>
  );
}

function BarDualStages({ stages }: { stages: { name: string; done: number; todo: number; color: string }[] }) {
  const max = Math.max(...stages.flatMap(s => [s.done, s.todo]), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 180, padding: '8px 4px 0' }}>
      {stages.map((s, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 130 }}>
            <div style={{ width: 16, height: `${(s.todo / max) * 120}px`, minHeight: s.todo === 0 ? 2 : 4, background: 'var(--surface-3)', borderRadius: '3px 3px 0 0' }} title={`A fazer: ${s.todo}`} />
            <div style={{ width: 16, height: `${(s.done / max) * 120}px`, minHeight: s.done === 0 ? 2 : 4, background: s.color, borderRadius: '3px 3px 0 0' }} title={`Concluídas: ${s.done}`} />
          </div>
          <div className="xs faint" style={{ textAlign: 'center', fontSize: 10 }}>{s.name.length > 8 ? s.name.slice(0, 7) + '…' : s.name}</div>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ segments, label }: { segments: { v: number; c: string; l: string }[]; label?: string }) {
  const total = segments.reduce((n, s) => n + s.v, 0) || 1;
  const r = 38, cx = 48, cy = 48, circ = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <svg viewBox="0 0 96 96" width={96} height={96} style={{ flexShrink: 0 }}>
        {segments.map((s, i) => {
          const arc = (s.v / total) * circ;
          const rotation = (acc / total) * 360 - 90;
          acc += s.v;
          return (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={s.c} strokeWidth={15}
              strokeDasharray={`${arc} ${circ}`}
              transform={`rotate(${rotation}, ${cx}, ${cy})`}
            />
          );
        })}
        {label && <text x={cx} y={cy + 5} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--text)">{label}</text>}
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, flex: 1 }}>
        {segments.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ width: 9, height: 9, background: s.c, borderRadius: 2, flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 12 }}>{s.l}</span>
            <span style={{ fontSize: 12, fontWeight: 600 }}>{Math.round((s.v / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BurndownLine({ entries, plannedCost, startDate, endDate }: {
  entries: CostEntry[]; plannedCost: number; startDate: string; endDate?: string | null;
}) {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 3600 * 1000);
  const totalMs = end.getTime() - start.getTime();
  if (totalMs <= 0) return null;

  const W = 400, H = 160, PX = 8, PY = 10;
  const cW = W - PX * 2, cH = H - PY * 2;
  const today = new Date();

  const xPos = (d: Date) => PX + Math.max(0, Math.min(1, (d.getTime() - start.getTime()) / totalMs)) * cW;
  const yPos = (v: number) => PY + cH - Math.min(1, v / (plannedCost || 1)) * cH;

  // Cumulative spent by date
  const sorted = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  let cum = 0;
  const realPoints: { x: number; y: number }[] = [{ x: xPos(start), y: yPos(0) }];
  sorted.forEach(e => {
    cum += Number(e.amount);
    realPoints.push({ x: xPos(new Date(e.date)), y: yPos(cum) });
  });
  if (realPoints.length === 1) realPoints.push({ x: xPos(today), y: yPos(0) });

  const realPath = realPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const idealPath = `M ${xPos(start).toFixed(1)} ${yPos(0).toFixed(1)} L ${xPos(end).toFixed(1)} ${yPos(plannedCost).toFixed(1)}`;
  const todayX = xPos(today);

  return (
    <div style={{ width: '100%', aspectRatio: `${W}/${H}` }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <path d={idealPath} fill="none" stroke="var(--text-3)" strokeWidth="1.5" strokeDasharray="4 3" />
        <path d={realPath} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {todayX >= PX && todayX <= W - PX && (
          <>
            <line x1={todayX} y1={PY} x2={todayX} y2={PY + cH} stroke="var(--danger)" strokeWidth="1.5" strokeDasharray="3 2" />
            <text x={todayX + 3} y={PY + 10} fontSize="9" fill="var(--danger)">hoje</text>
          </>
        )}
        <line x1={PX} y1={PY + cH} x2={W - PX} y2={PY + cH} stroke="var(--border)" strokeWidth="1" />
      </svg>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export const ReportsPage: React.FC<ReportsPageProps> = ({ project }) => {
  const [view, setView] = useState<'analytics' | 'executivo'>('analytics');

  const { data: costsSummary } = useQuery({
    queryKey: ['costs', project.id, 'summary'],
    queryFn: () => costsApi.summary(project.id),
  });
  const { data: costEntries = [] } = useQuery<CostEntry[]>({
    queryKey: ['costs', project.id],
    queryFn: () => costsApi.list(project.id),
  });
  const { data: memberMetrics = [] } = useQuery<MemberMetrics[]>({
    queryKey: ['members', project.id, 'metrics'],
    queryFn: () => membersApi.metrics(project.id),
  });
  const { data: decisions = [] } = useQuery<Decision[]>({
    queryKey: ['decisions', project.id],
    queryFn: () => decisionsApi.list(project.id),
  });
  const { data: stages = [] } = useQuery({
    queryKey: ['stages', project.id],
    queryFn: () => stagesApi.list(project.id),
  });
  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones', project.id],
    queryFn: () => milestonesApi.list(project.id),
  });

  const today = new Date();
  const weekAgo = new Date(today.getTime() - WEEK_MS);
  const weekNumber = Math.ceil(today.getDate() / 7);

  // ── Derived data ──────────────────────────────────────────────────────────
  const allSubtopics = (stages as any[]).flatMap((s: any) =>
    (s.topics ?? []).flatMap((t: any) => t.subtopics ?? []),
  );
  const totalTasks    = allSubtopics.length;
  const doneTasks     = allSubtopics.filter((s: any) => s.status === 'done').length;
  const inProgTasks   = allSubtopics.filter((s: any) => s.status === 'inprog').length;
  const reviewTasks   = allSubtopics.filter((s: any) => s.status === 'review').length;
  const todoTasks     = allSubtopics.filter((s: any) => s.status === 'todo').length;
  const blockedTasks  = allSubtopics.filter((s: any) => s.status === 'blocked').length;
  const doneThisWeek  = allSubtopics.filter((s: any) => s.status === 'done' && new Date(s.updatedAt) >= weekAgo).length;
  const newThisWeek   = allSubtopics.filter((s: any) => new Date(s.createdAt) >= weekAgo).length;
  const delayed       = allSubtopics.filter((s: any) => s.deadline && new Date(s.deadline) < today && s.status !== 'done').length;

  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  // On-time: done tasks where endDate <= deadline (or no deadline = on time)
  const onTime  = allSubtopics.filter((s: any) => s.status === 'done' && (!s.deadline || new Date(s.endDate ?? s.updatedAt) <= new Date(s.deadline))).length;
  const lateOk  = Math.max(0, doneTasks - onTime);

  const plannedCost = costsSummary?.plannedCost ?? 0;
  const doneCost    = costsSummary?.doneCost ?? 0;
  const totalSpent  = costsSummary?.totalSpent ?? 0;
  const burnRate    = plannedCost > 0 ? Math.round((doneCost / plannedCost) * 100) : 0;
  const balance     = plannedCost - doneCost;

  const pendingDecisions = (decisions as Decision[]).filter((d) => d.status === 'pending');
  const resolvedDecisions = (decisions as Decision[]).filter((d) => d.status === 'decided');
  const overloadedMembers = (memberMetrics as MemberMetrics[]).filter((m) => m.loadPercent > 85);

  const upcomingMilestones = (milestones as any[])
    .filter((m: any) => m.status === 'pending')
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  // Per-stage metrics
  const stageMetrics = (stages as any[]).map((s: any, i: number) => {
    const subs = (s.topics ?? []).flatMap((t: any) => t.subtopics ?? []);
    const sDone = subs.filter((sub: any) => sub.status === 'done').length;
    const sTodo = subs.filter((sub: any) => sub.status !== 'done').length;
    const sCost = (costEntries as CostEntry[]).filter((e) => e.stageId === s.id).reduce((n, e) => n + Number(e.amount), 0);
    const sPlanned = calcStageCost(s);
    return {
      name: s.name, color: STAGE_COLORS[i % STAGE_COLORS.length],
      done: sDone, todo: sTodo, total: subs.length,
      spent: sCost, planned: sPlanned,
    };
  });

  // Executive headline
  const headline = overloadedMembers.length > 0
    ? `${overloadedMembers.length} membro(s) com carga acima de 85% — atenção à alocação.`
    : doneThisWeek > 0
    ? `${doneThisWeek} tarefa(s) concluída(s) esta semana — projeto em ${progress}% de progresso.`
    : `Acompanhamento do projeto ${project.name} — ${progress}% concluído.`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Toolbar */}
      <div className="page-head">
        <div>
          <div className="page-title">Relatórios</div>
          <div className="page-sub">Semana {weekNumber} · {formatDate(today.toISOString())} · {project.name}</div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <div className="seg">
            <button className={`seg-btn${view === 'analytics' ? ' active' : ''}`} onClick={() => setView('analytics')}>Analytics</button>
            <button className={`seg-btn${view === 'executivo' ? ' active' : ''}`} onClick={() => setView('executivo')}>Executivo</button>
          </div>
          <button className="btn ghost sm">Imprimir</button>
          <button className="btn primary sm">↓ Exportar PDF</button>
        </div>
      </div>

      {/* ════ ANALYTICS VIEW ════ */}
      {view === 'analytics' && (
        <>
          {/* KPIs */}
          <div className="kpi-grid">
            <KpiBox label="Total de tarefas"   value={totalTasks}  sub={`${progress}% concluídas`} />
            <KpiBox label="Concluídas"          value={doneTasks}   sub={`${doneThisWeek} esta semana`}  color="var(--success)" />
            <KpiBox label="Em progresso"        value={inProgTasks} sub={`${reviewTasks} em revisão`}   color="var(--accent)" />
            <KpiBox label="Atrasadas"           value={delayed}     sub={delayed > 0 ? 'com prazo vencido' : 'nenhuma atrasada'} color={delayed > 0 ? 'var(--danger)' : undefined} />
            <KpiBox label="Orçamento previsto"  value={formatCurrency(plannedCost)} sub={plannedCost > 0 ? `${burnRate}% já realizado` : 'tarefas concluídas'} />
            <KpiBox label="Gastos realizados"   value={formatCurrency(doneCost)}    sub={`saldo: ${formatCurrency(balance)}`} color={balance < 0 ? 'var(--danger)' : undefined} />
          </div>

          {/* Tasks per stage — dual bars */}
          {stageMetrics.length > 0 && (
            <div className="card">
              <div className="card-head">
                <div className="card-title">Tarefas por etapa
                  <span className="card-sub">a fazer vs concluídas</span>
                </div>
                <div className="row xs faint" style={{ gap: 12 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 12, height: 8, background: 'var(--surface-3)', borderRadius: 2, display: 'inline-block' }} />A fazer
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 12, height: 8, background: 'var(--accent)', borderRadius: 2, display: 'inline-block' }} />Concluídas
                  </span>
                </div>
              </div>
              <div className="card-body">
                <BarDualStages stages={stageMetrics} />
              </div>
            </div>
          )}

          <div className="grid-3" style={{ gap: 12 }}>
            {/* Distribuição por status */}
            <div className="card">
              <div className="card-head">
                <div className="card-title">Por status</div>
                <span className="card-sub">{totalTasks} tarefas</span>
              </div>
              <div className="card-body">
                <BarsVertical bars={[
                  { v: todoTasks,    c: '#6B7280',          l: 'A fazer' },
                  { v: inProgTasks,  c: 'var(--accent)',    l: 'Em prog.' },
                  { v: reviewTasks,  c: 'var(--warning)',   l: 'Revisão' },
                  { v: doneTasks,    c: 'var(--success)',   l: 'Concluída' },
                  { v: blockedTasks, c: 'var(--danger)',    l: 'Bloqueada' },
                ]} />
              </div>
            </div>

            {/* Conclusão por pessoa */}
            <div className="card">
              <div className="card-head">
                <div className="card-title">Carga por pessoa</div>
                <span className="card-sub">% de alocação</span>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {(memberMetrics as MemberMetrics[]).length === 0 && (
                  <div className="xs faint" style={{ fontStyle: 'italic', padding: '16px 0' }}>Nenhum membro cadastrado.</div>
                )}
                {(memberMetrics as MemberMetrics[])
                  .sort((a, b) => b.loadPercent - a.loadPercent)
                  .slice(0, 6)
                  .map((m, i) => (
                    <div key={m.memberId} className="row" style={{ gap: 8 }}>
                      <Avatar initials={m.name.slice(0, 2).toUpperCase()} colorIndex={i + 1} size="sm" />
                      <div className="fill" style={{ minWidth: 0 }}>
                        <div className="row between" style={{ marginBottom: 3 }}>
                          <span className="small b truncate">{m.name}</span>
                          <span className="xs b" style={{ color: m.loadPercent > 85 ? 'var(--danger)' : 'var(--text-2)', flexShrink: 0, marginLeft: 6 }}>
                            {m.loadPercent}%
                          </span>
                        </div>
                        <div className="bar">
                          <span style={{ width: `${Math.min(m.loadPercent, 100)}%`, background: m.loadPercent > 85 ? 'var(--danger)' : 'var(--accent)' }} />
                        </div>
                        <div className="xs faint" style={{ marginTop: 2 }}>{m.activeTasks} ativas · {m.completedTasks} concluídas</div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Custo por etapa */}
            <div className="card">
              <div className="card-head">
                <div className="card-title">Custo por etapa</div>
                <span className="card-sub">lançamentos manuais</span>
              </div>
              <div className="card-body">
                {stageMetrics.filter(s => s.spent > 0).length > 0 ? (
                  <BarsVertical bars={stageMetrics.filter(s => s.spent > 0).map(s => ({
                    v: Math.round(s.spent / 1000),
                    c: s.color,
                    l: s.name.length > 7 ? s.name.slice(0, 6) + '…' : s.name,
                  }))} unit="k" />
                ) : (
                  <div className="xs faint" style={{ padding: '24px 0', textAlign: 'center', fontStyle: 'italic' }}>
                    Sem lançamentos por etapa.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid-2" style={{ gap: 12 }}>
            {/* Cumprimento de prazo */}
            <div className="card">
              <div className="card-head">
                <div className="card-title">Cumprimento de prazo</div>
                <span className="card-sub">{doneTasks} tarefas concluídas</span>
              </div>
              <div className="card-body">
                {doneTasks > 0 ? (
                  <DonutChart
                    label={`${Math.round((onTime / doneTasks) * 100)}%`}
                    segments={[
                      { v: onTime,              c: 'var(--success)', l: 'No prazo' },
                      { v: Math.max(lateOk, 0), c: 'var(--danger)',  l: 'Com atraso' },
                    ]}
                  />
                ) : (
                  <div className="xs faint" style={{ padding: '24px 0', textAlign: 'center', fontStyle: 'italic' }}>
                    Nenhuma tarefa concluída ainda.
                  </div>
                )}
              </div>
            </div>

            {/* Distribuição de tarefas por etapa */}
            <div className="card">
              <div className="card-head">
                <div className="card-title">Tarefas por etapa</div>
                <span className="card-sub">{totalTasks} total</span>
              </div>
              <div className="card-body">
                {stageMetrics.filter(s => s.total > 0).length > 0 ? (
                  <DonutChart
                    label={`${totalTasks}`}
                    segments={stageMetrics.filter(s => s.total > 0).map(s => ({
                      v: s.total, c: s.color,
                      l: s.name.length > 12 ? s.name.slice(0, 11) + '…' : s.name,
                    }))}
                  />
                ) : (
                  <div className="xs faint" style={{ padding: '24px 0', textAlign: 'center', fontStyle: 'italic' }}>
                    Sem tarefas cadastradas.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Próximos marcos */}
          {upcomingMilestones.length > 0 && (
            <div className="card">
              <div className="card-head">
                <div className="card-title">Próximos marcos</div>
                <span className="chip accent xs">{upcomingMilestones.length} pendentes</span>
              </div>
              <div className="card-body flush">
                {upcomingMilestones.map((m: any) => {
                  const daysLeft = Math.ceil((new Date(m.date).getTime() - today.getTime()) / 86400000);
                  return (
                    <div key={m.id} className="list-item">
                      <span style={{ width: 8, height: 8, background: daysLeft < 7 ? 'var(--danger)' : 'var(--warning)', transform: 'rotate(45deg)', flexShrink: 0 }} />
                      <span className="fill small b truncate">{m.name}</span>
                      <span className="xs faint">{formatDate(m.date)}</span>
                      <span className="chip xs" style={{
                        background: daysLeft < 7 ? 'var(--danger-soft)' : 'var(--warning-soft)',
                        color: daysLeft < 7 ? 'var(--danger)' : 'var(--warning)',
                      }}>{daysLeft >= 0 ? `${daysLeft}d` : 'atrasado'}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ════ EXECUTIVO VIEW ════ */}
      {view === 'executivo' && (
        <div style={{ maxWidth: 860, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 0 }}>
          {/* Header */}
          <div style={{ paddingBottom: 24, borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
            <div className="row" style={{ gap: 8, marginBottom: 14 }}>
              <span style={{ background: 'var(--accent)', color: 'white', padding: '3px 10px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>SEMANA {weekNumber}</span>
              <span style={{ background: 'var(--surface-3)', color: 'var(--text-2)', padding: '3px 10px', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>{formatDate(today.toISOString())}</span>
              <span style={{ background: 'var(--surface-3)', color: 'var(--text-2)', padding: '3px 10px', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>Status Report · {project.name}</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 10 }}>
              {headline}
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.65 }}>
              Resumo executivo gerado automaticamente a partir das tarefas concluídas, gastos lançados e carga atual da equipe — <strong>{project.name}</strong>.
            </div>
          </div>

          {/* 01 — O que aconteceu */}
          <ExecSection n="01" title="O que aconteceu esta semana">
            <p style={{ color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 14 }}>
              {doneThisWeek > 0
                ? <>{doneThisWeek} tarefa{doneThisWeek > 1 ? 's' : ''} concluída{doneThisWeek > 1 ? 's' : ''} nesta semana. O projeto está em <strong>{progress}%</strong> de progresso geral{delayed > 0 ? `, com ${delayed} tarefa${delayed > 1 ? 's' : ''} atrasada${delayed > 1 ? 's' : ''}` : ' e sem atrasos'}.</>
                : <>Nenhuma tarefa concluída nesta semana. O projeto está em <strong>{progress}%</strong> de progresso geral{delayed > 0 ? `, com ${delayed} tarefa${delayed > 1 ? 's' : ''} atrasada${delayed > 1 ? 's' : ''}` : ''}.</>
              }
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              <StatBox n={doneThisWeek} label="Concluídas"   color="var(--success)" note="Esta semana" />
              <StatBox n={newThisWeek}  label="Novas tarefas" color="var(--accent)"  note="Criadas esta semana" />
              <StatBox n={delayed}      label="Atrasadas"     color={delayed > 0 ? 'var(--danger)' : 'var(--text-3)'} note={delayed > 0 ? 'Com prazo vencido' : 'Nenhuma atrasada'} />
            </div>
            {/* Progress bar for all stages */}
            {(stages as any[]).length > 0 && (
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {stageMetrics.map((s, i) => {
                  const pct = s.total > 0 ? Math.round((s.done / s.total) * 100) : 0;
                  return (
                    <div key={i} className="row" style={{ gap: 10 }}>
                      <span style={{ width: 20, height: 20, borderRadius: '50%', background: s.color, color: 'white', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                      <span style={{ width: 130, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>{s.name}</span>
                      <div style={{ flex: 1, height: 6, background: 'var(--surface-3)', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: s.color, borderRadius: 999 }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, width: 36, textAlign: 'right', flexShrink: 0 }}>{pct}%</span>
                      <span className="xs faint" style={{ width: 60, flexShrink: 0 }}>{s.done}/{s.total} tasks</span>
                    </div>
                  );
                })}
              </div>
            )}
          </ExecSection>

          {/* 02 — Orçamento */}
          <ExecSection n="02" title="Como está o orçamento">
            <p style={{ color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 14 }}>
              {plannedCost > 0
                ? <>O projeto tem <strong>{formatCurrency(plannedCost)}</strong> de orçamento previsto pelas tarefas. Foram realizados <strong>{formatCurrency(doneCost)}</strong> ({burnRate}% do total), com saldo de <strong style={{ color: balance < 0 ? 'var(--danger)' : 'inherit' }}>{formatCurrency(balance)}</strong>.{totalSpent > 0 ? ` Lançamentos manuais totalizam ${formatCurrency(totalSpent)}.` : ''}</>
                : <>Orçamento ainda não calculado pelas tarefas. {totalSpent > 0 ? `Lançamentos manuais registrados: ${formatCurrency(totalSpent)}.` : 'Nenhum lançamento registrado.'}</>
              }
            </p>
            <div className="card">
              <div className="card-body">
                {(costEntries as CostEntry[]).length > 0 ? (
                  <>
                    <div className="row" style={{ gap: 24, marginBottom: 20 }}>
                      <div>
                        <div className="xs faint" style={{ letterSpacing: '0.05em' }}>REALIZADO</div>
                        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)' }}>{formatCurrency(doneCost || totalSpent)}</div>
                        {plannedCost > 0 && <div className="xs b" style={{ color: burnRate > 100 ? 'var(--danger)' : 'var(--text-3)', marginTop: 2 }}>{burnRate}% do planejado</div>}
                      </div>
                      {plannedCost > 0 && (
                        <div style={{ flex: 1, paddingTop: 12 }}>
                          <div className="bar thick" style={{ height: 10, background: 'var(--surface-3)' }}>
                            <span style={{ width: `${Math.min(burnRate, 100)}%`, background: burnRate > 90 ? 'var(--danger)' : burnRate > 75 ? 'var(--warning)' : 'var(--success)' }} />
                          </div>
                          <div className="row between" style={{ marginTop: 6 }}>
                            <span className="xs faint">Início</span>
                            <span className="xs faint">Meta: {formatCurrency(plannedCost)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <BurndownLine
                      entries={costEntries as CostEntry[]}
                      plannedCost={Math.max(plannedCost, totalSpent)}
                      startDate={project.startDate}
                      endDate={project.endDate}
                    />
                    <div className="xs faint" style={{ marginTop: 6 }}>linha contínua: real · pontilhada: ideal</div>
                  </>
                ) : (
                  <div className="xs faint" style={{ padding: '16px 0', textAlign: 'center', fontStyle: 'italic' }}>
                    Sem lançamentos registrados ainda.
                  </div>
                )}
              </div>
            </div>
          </ExecSection>

          {/* 03 — Carga da equipe */}
          <ExecSection n="03" title="Quem está sobrecarregado">
            <p style={{ color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 14 }}>
              {overloadedMembers.length > 0
                ? <>{overloadedMembers.length} membro{overloadedMembers.length > 1 ? 's' : ''} com carga acima de 85%: <strong>{overloadedMembers.map(m => m.name).join(', ')}</strong>. Considere realocar tarefas para liberar capacidade.</>
                : <>{(memberMetrics as MemberMetrics[]).length > 0 ? 'Nenhum membro com carga crítica. A equipe está equilibrada esta semana.' : 'Nenhum membro cadastrado no projeto.'}</>
              }
            </p>
            {(memberMetrics as MemberMetrics[]).length > 0 && (
              <div className="card">
                <div className="card-body flush">
                  {(memberMetrics as MemberMetrics[])
                    .sort((a, b) => b.loadPercent - a.loadPercent)
                    .slice(0, 8)
                    .map((m, i) => (
                      <div key={m.memberId} className="list-item">
                        <Avatar initials={m.name.slice(0, 2).toUpperCase()} colorIndex={i + 1} size="sm" />
                        <span className="b small" style={{ width: 140, flexShrink: 0 }}>{m.name}</span>
                        <div className="bar fill">
                          <span style={{ width: `${Math.min(m.loadPercent, 100)}%`, background: m.loadPercent > 85 ? 'var(--danger)' : m.loadPercent > 70 ? 'var(--warning)' : 'var(--accent)' }} />
                        </div>
                        <span className="b" style={{ width: 40, textAlign: 'right', flexShrink: 0 }}>{m.loadPercent}%</span>
                        {m.loadPercent > 85 && <span className="chip med xs" style={{ flexShrink: 0 }}>realocar</span>}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </ExecSection>

          {/* 04 — Decisões e Resoluções */}
          <ExecSection n="04" title="Decisões e Resoluções">
            <p style={{ color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 14 }}>
              {pendingDecisions.length === 0
                ? 'Nenhuma decisão pendente no momento. O projeto pode avançar sem bloqueios conhecidos.'
                : `${pendingDecisions.length} decisão${pendingDecisions.length > 1 ? 'ões' : ''} aguardando resolução.`
              }
            </p>
            
            {pendingDecisions.length > 0 && (
              <div className="card" style={{ marginBottom: 16 }}>
                <div className="card-head" style={{ padding: '8px 16px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                  <span className="xs b" style={{ color: 'var(--warning)', letterSpacing: '0.05em' }}>AGUARDANDO DECISÃO</span>
                </div>
                <div className="card-body flush">
                  {pendingDecisions.map((d) => (
                    <div key={d.id} className="list-item">
                      <span style={{ width: 8, height: 8, background: 'var(--warning)', transform: 'rotate(45deg)', flexShrink: 0 }} />
                      <div className="fill">
                        <div className="b small">{d.title}</div>
                        {d.description && <div className="xs faint">{d.description}</div>}
                      </div>
                      {d.dueDate && <span className="xs faint">até {formatDate(d.dueDate)}</span>}
                      {d.professional && <span className="chip xs outline" style={{ flexShrink: 0 }}>{d.professional.name}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {resolvedDecisions.length > 0 && (
              <div className="card">
                <div className="card-head" style={{ padding: '8px 16px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                  <span className="xs b" style={{ color: 'var(--success)', letterSpacing: '0.05em' }}>RESOLVIDAS RECENTEMENTE</span>
                </div>
                <div className="card-body flush">
                  {resolvedDecisions.map((d) => (
                    <div key={d.id} className="list-item">
                      <span className="xs" style={{ color: 'var(--success)', flexShrink: 0 }}>✓</span>
                      <div className="fill">
                        <div className="small" style={{ color: 'var(--text-2)' }}>{d.title}</div>
                      </div>
                      <span className="xs faint">resolvida</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pendingDecisions.length === 0 && resolvedDecisions.length === 0 && (
              <div className="card" style={{ padding: '12px 16px', background: 'color-mix(in srgb, var(--success) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--success) 20%, transparent)' }}>
                <span style={{ color: 'var(--success)', fontSize: 13 }}>✓ Nenhuma decisão pendente. Ótimo!</span>
              </div>
            )}
          </ExecSection>

          <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid var(--border)', textAlign: 'center' }}>
            <div className="xs faint" style={{ letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Gerado automaticamente pelo GPG System
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────

function KpiBox({ label, value, sub, color }: { label: string; value: number | string; sub?: string; color?: string }) {
  return (
    <div className="kpi card">
      <div className="label">{label}</div>
      <div className="value" style={{ color: color ?? 'var(--text)' }}>{value}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
}

function StatBox({ n, label, color, note }: { n: number; label: string; color: string; note: string }) {
  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ fontSize: 34, fontWeight: 700, color, marginBottom: 2, letterSpacing: '-0.02em' }}>{n}</div>
      <div className="small b" style={{ textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-2)' }}>{label}</div>
      <div className="xs faint" style={{ marginTop: 4 }}>{note}</div>
    </div>
  );
}

function ExecSection({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 32, display: 'grid', gridTemplateColumns: '60px 1fr', gap: 16, alignItems: 'flex-start' }}>
      <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--accent)', lineHeight: 1, fontFamily: 'Geist Mono, ui-monospace, monospace', paddingTop: 4 }}>{n}</div>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em', textTransform: 'uppercase', margin: '0 0 12px' }}>{title}</h2>
        {children}
      </div>
    </section>
  );
}
