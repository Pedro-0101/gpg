import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { KPI } from '../../components/ui/KPI';
import { Avatar } from '../../components/ui/Avatar';
import { costsApi } from '../../api/costs';
import { membersApi } from '../../api/members';
import { stagesApi } from '../../api/stages';
import { calcStageCost, calcStageDoneCost } from '../../lib/cost';
import { formatCurrency, formatDate } from '../../lib/utils';
import type { Project, CostEntry, CostSummary } from '../../types';

interface CostsPageProps { project: Project; }

const CATEGORIES = ['Pessoal', 'Ferramentas', 'Infraestrutura', 'Freelancers', 'Outros'];

const STAGE_PALETTE = [
  { color: 'var(--success)', soft: 'var(--success-soft)', grad: 'linear-gradient(90deg,#16A34A,#4ADE80)' },
  { color: 'var(--accent)',  soft: 'var(--accent-soft)',  grad: 'linear-gradient(90deg,#4F46E5,#818CF8)' },
  { color: 'var(--purple)',  soft: 'var(--purple-soft)',  grad: 'linear-gradient(90deg,#7C3AED,#A78BFA)' },
  { color: 'var(--warning)', soft: 'var(--warning-soft)', grad: 'linear-gradient(90deg,#D97706,#FCD34D)' },
  { color: 'var(--info)',    soft: 'var(--info-soft)',    grad: 'linear-gradient(90deg,#2563EB,#60A5FA)' },
  { color: 'var(--danger)',  soft: 'var(--danger-soft)',  grad: 'linear-gradient(90deg,#DC2626,#F87171)' },
  { color: '#F59E0B', soft: 'rgba(245,158,11,0.12)', grad: 'linear-gradient(90deg,#F59E0B,#FDE68A)' },
  { color: '#06B6D4', soft: 'rgba(6,182,212,0.12)',  grad: 'linear-gradient(90deg,#06B6D4,#67E8F9)' },
  { color: '#EC4899', soft: 'rgba(236,72,153,0.12)', grad: 'linear-gradient(90deg,#EC4899,#F9A8D4)' },
];

const AV_GRADS = [
  'linear-gradient(90deg,#6366F1,#8B5CF6)',
  'linear-gradient(90deg,#EC4899,#F43F5E)',
  'linear-gradient(90deg,#10B981,#06B6D4)',
  'linear-gradient(90deg,#F59E0B,#EF4444)',
  'linear-gradient(90deg,#3B82F6,#2DD4BF)',
  'linear-gradient(90deg,#A855F7,#EC4899)',
  'linear-gradient(90deg,#14B8A6,#84CC16)',
  'linear-gradient(90deg,#F97316,#EAB308)',
];

const CAT_COLORS: Record<string, string> = {
  Pessoal:        'var(--accent)',
  Ferramentas:    'var(--purple)',
  Infraestrutura: 'var(--success)',
  Freelancers:    'var(--warning)',
  Outros:         'var(--text-3)',
};

type Period = 'sem' | 'mês' | 'trim';

function fmtK(v: number): string {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `R$ ${Math.round(v / 1_000)}k`;
  return `R$ ${Math.round(v)}`;
}

function getFilterStart(period: Period): Date {
  const now = new Date();
  if (period === 'sem')  return new Date(now.getTime() - 7 * 86_400_000);
  if (period === 'trim') return new Date(now.getTime() - 90 * 86_400_000);
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '5px 8px', border: '1px solid var(--border)',
  borderRadius: 'var(--radius)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: 12.5,
};

export const CostsPage: React.FC<CostsPageProps> = ({ project }) => {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [period, setPeriod]     = useState<Period>('mês');

  const { data: entries = [] } = useQuery({
    queryKey: ['costs', project.id],
    queryFn:  () => costsApi.list(project.id),
  });
  const { data: summary } = useQuery<CostSummary>({
    queryKey: ['costs', project.id, 'summary'],
    queryFn:  () => costsApi.summary(project.id),
  });
  const { data: members = [] } = useQuery({
    queryKey: ['members', project.id],
    queryFn:  () => membersApi.list(project.id),
  });
  const { data: stages = [] } = useQuery({
    queryKey: ['stages', project.id],
    queryFn:  () => stagesApi.list(project.id),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => costsApi.create(project.id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['costs', project.id] }); setShowForm(false); reset(); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => costsApi.remove(project.id, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['costs', project.id] }),
  });

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      description: '', category: 'Pessoal', amount: 0, hours: '',
      date: new Date().toISOString().slice(0, 10), professionalId: '', stageId: '',
    },
  });

  const plannedCost = summary?.plannedCost ?? 0;
  const doneCost    = summary?.doneCost    ?? 0;
  const balance     = plannedCost - doneCost;
  const burnRate    = plannedCost > 0 ? (doneCost / plannedCost) * 100 : 0;

  const filterStart      = useMemo(() => getFilterStart(period), [period]);
  const filteredEntries  = useMemo(
    () => (entries as CostEntry[]).filter((e) => new Date(e.date) >= filterStart),
    [entries, filterStart],
  );
  const periodSpent = filteredEntries.reduce((n, e) => n + Number(e.amount), 0);

  const stageData = useMemo(() => {
    return (stages as any[]).map((s: any, i: number) => {
      const pal     = STAGE_PALETTE[i % STAGE_PALETTE.length];
      const planned = calcStageCost(s);
      const tasksDone = calcStageDoneCost(s);
      const manual  = (entries as CostEntry[]).filter((e) => e.stageId === s.id).reduce((n, e) => n + Number(e.amount), 0);
      const actual  = tasksDone + manual;
      return { name: s.name, planned, actual, ...pal };
    }).filter((s) => s.planned > 0 || s.actual > 0);
  }, [stages, entries]);

  const allEntries  = entries as CostEntry[];
  const monthsMap: Record<string, number> = {};
  allEntries.forEach((e) => {
    const d   = new Date(e.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthsMap[key] = (monthsMap[key] ?? 0) + Number(e.amount);
  });
  const months = Object.keys(monthsMap).sort();
  let cumAcc = 0;
  const realData = months.map((m) => { cumAcc += monthsMap[m]; return cumAcc; });
  const chartMax = Math.max(...realData, plannedCost, 100);

  const periodByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    filteredEntries.forEach((e) => { map[e.category] = (map[e.category] ?? 0) + Number(e.amount); });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filteredEntries]);

  const memberSpend = useMemo(() => {
    const map: Record<string, number> = {};
    filteredEntries.forEach((e) => {
      if (e.professionalId) map[e.professionalId] = (map[e.professionalId] ?? 0) + Number(e.amount);
    });
    return map;
  }, [filteredEntries]);

  const periodLabel = period === 'sem' ? 'semana' : period === 'mês' ? 'mês corrente' : 'trimestre';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Header ── */}
      <div className="page-head">
        <div>
          <div className="page-title">Custos do projeto</div>
          <div className="page-sub">Orçamento aprovado · acompanhamento financeiro</div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <div className="seg">
            {(['sem', 'mês', 'trim'] as Period[]).map((p) => (
              <button key={p} className={`seg-btn${period === p ? ' active' : ''}`} onClick={() => setPeriod(p)}>
                {p === 'sem' ? 'Sem.' : p === 'mês' ? 'Mês' : 'Trim.'}
              </button>
            ))}
          </div>
          <button className="btn primary" onClick={() => setShowForm((v) => !v)}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Novo lançamento
          </button>
        </div>
      </div>

      {/* ── KPI grid — cada card com acento colorido ── */}
      <div className="kpi-grid">
        <KPI label="Orçamento previsto" value={fmtK(plannedCost)}
          sub="total planejado pelas tasks" accentColor="var(--accent)" />
        <KPI label="Gastos realizados" value={fmtK(doneCost)}
          delta={plannedCost > 0 ? { dir: burnRate > 80 ? 'down' : 'flat', text: `${Math.round(burnRate)}%` } : undefined}
          sub="tasks com status concluído" accentColor="var(--success)" />
        <KPI label={`Lançamentos · ${periodLabel}`} value={fmtK(periodSpent)}
          sub={`${filteredEntries.length} entr${filteredEntries.length === 1 ? 'ada' : 'adas'}`}
          accentColor="var(--purple)" />
        <KPI label="Saldo restante" value={fmtK(Math.abs(balance))}
          delta={balance < 0 ? { dir: 'down', text: 'Déficit' } : balance > 0 ? { dir: 'up', text: 'Folga' } : undefined}
          sub={balance >= 0 ? 'a realizar' : 'acima do planejado'}
          accentColor={balance < 0 ? 'var(--danger)' : 'var(--warning)'} />
      </div>

      {/* ── Formulário ── */}
      {showForm && (
        <div className="card">
          <div className="card-head">
            <div className="card-title">Novo lançamento</div>
            <button className="icon-btn ghost" onClick={() => { setShowForm(false); reset(); }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit((d) => createMutation.mutate({
              description: d.description, category: d.category, amount: Number(d.amount),
              hours: d.hours ? Number(d.hours) : null,
              date: d.date || undefined, professionalId: d.professionalId || null, stageId: d.stageId || null,
            }))}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
                <div>
                  <label className="xs faint" style={{ display: 'block', marginBottom: 3 }}>Descrição *</label>
                  <input style={inputStyle} placeholder="Ex: Horas Ana · UI sistema" {...register('description', { required: true })} />
                </div>
                <div>
                  <label className="xs faint" style={{ display: 'block', marginBottom: 3 }}>Categoria</label>
                  <select style={inputStyle} {...register('category')}>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="xs faint" style={{ display: 'block', marginBottom: 3 }}>Valor (R$) *</label>
                  <input type="number" min={0} step={0.01} style={inputStyle} {...register('amount', { required: true })} />
                </div>
                <div>
                  <label className="xs faint" style={{ display: 'block', marginBottom: 3 }}>Data</label>
                  <input type="date" style={inputStyle} {...register('date')} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                <div>
                  <label className="xs faint" style={{ display: 'block', marginBottom: 3 }}>Horas</label>
                  <input type="number" min={0} step={0.5} style={inputStyle} placeholder="Opcional" {...register('hours')} />
                </div>
                <div>
                  <label className="xs faint" style={{ display: 'block', marginBottom: 3 }}>Profissional</label>
                  <select style={inputStyle} {...register('professionalId')}>
                    <option value="">Nenhum</option>
                    {(members as any[]).map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="xs faint" style={{ display: 'block', marginBottom: 3 }}>Etapa</label>
                  <select style={inputStyle} {...register('stageId')}>
                    <option value="">Nenhuma</option>
                    {(stages as any[]).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="row" style={{ gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn ghost" onClick={() => { setShowForm(false); reset(); }}>Cancelar</button>
                <button type="submit" disabled={createMutation.isPending} className="btn primary">
                  {createMutation.isPending ? 'Salvando…' : 'Salvar lançamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Orçado vs Realizado por etapa ── */}
      <div className="card">
        <div className="card-head" style={{
          background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface-2) 100%)',
        }}>
          <div className="card-title">Orçado vs Realizado · por etapa</div>
          <div className="row xs faint" style={{ gap: 12 }}>
            <span className="row" style={{ gap: 4 }}>
              <span style={{ width: 12, height: 8, background: 'var(--surface-3)', borderRadius: 2, display: 'inline-block', border: '1px solid var(--border-strong)' }} />
              orçado
            </span>
            <span className="row" style={{ gap: 4 }}>
              <span style={{ width: 12, height: 8, background: 'var(--accent)', borderRadius: 2, display: 'inline-block' }} />
              realizado
            </span>
          </div>
        </div>
        <div className="card-body" style={{ padding: '8px 20px 14px' }}>
          {stageData.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
              As etapas ainda não têm subtarefas com equipes alocadas ou lançamentos manuais.
            </div>
          ) : (() => {
            const maxVal = Math.max(...stageData.map((s) => Math.max(s.planned, s.actual)), 1);
            return stageData.map((s, i) => {
              const pct        = s.planned > 0 ? Math.round((s.actual / s.planned) * 100) : (s.actual > 0 ? 100 : 0);
              const chipClass  = pct > 90 ? 'chip high' : pct > 60 ? 'chip med' : 'chip done';
              const plannedPct = (s.planned / maxVal) * 100;
              const actualPct  = Math.min((s.actual / maxVal) * 100, plannedPct);
              return (
                <div key={i} style={{
                  padding: '13px 0 13px 14px',
                  borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                  borderLeft: `3px solid ${s.color}`,
                  marginLeft: -20,
                  paddingLeft: 17,
                }}>
                  <div className="row between" style={{ marginBottom: 10 }}>
                    <div className="row" style={{ gap: 8 }}>
                      {/* Chip colorido por etapa */}
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                        background: s.soft, color: s.color,
                        border: `1px solid ${s.color}33`,
                        letterSpacing: '0.03em',
                      }}>
                        E{i + 1}
                      </span>
                      <span className="b small">{s.name}</span>
                    </div>
                    <div className="row" style={{ gap: 8 }}>
                      <span className="mono xs">
                        <b>{formatCurrency(s.actual)}</b>
                        <span className="faint"> / {formatCurrency(s.planned)}</span>
                      </span>
                      <span className={`${chipClass} xs`} style={{ minWidth: 44, justifyContent: 'center', display: 'inline-flex' }}>
                        {pct}%
                      </span>
                    </div>
                  </div>
                  {/* Barra de progresso */}
                  <div style={{ position: 'relative', height: 14, borderRadius: 6, overflow: 'hidden' }}>
                    {/* Track (orçado) */}
                    <div style={{
                      position: 'absolute', left: 0, top: 0,
                      width: `${plannedPct}%`, height: '100%',
                      background: 'var(--surface-3)',
                      borderRadius: 6,
                    }} />
                    {/* Fill (realizado) com gradiente */}
                    {s.actual > 0 && (
                      <div style={{
                        position: 'absolute', left: 0, top: 0,
                        width: `${actualPct}%`, height: '100%',
                        background: s.grad,
                        borderRadius: 6,
                        boxShadow: `0 1px 4px ${s.color}55`,
                      }} />
                    )}
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>

      {/* ── Curva financeira ── */}
      <div className="card">
        <div className="card-head">
          <div className="card-title">Curva financeira</div>
          <div className="row xs faint" style={{ gap: 12 }}>
            <span className="row" style={{ gap: 4 }}>
              <span style={{ display: 'inline-block', width: 14, height: 0, borderTop: '1.5px dashed var(--text-3)', verticalAlign: 'middle' }} />
              ideal
            </span>
            <span className="row" style={{ gap: 4 }}>
              <span style={{ display: 'inline-block', width: 14, height: 2, background: 'var(--accent)', borderRadius: 1, verticalAlign: 'middle' }} />
              real
            </span>
          </div>
        </div>
        <div className="card-body" style={{ padding: '16px 20px' }}>
          {realData.length < 2 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-3)' }}>
              Registre lançamentos para ver a curva financeira.
            </div>
          ) : (() => {
            const W = 640, H = 220, PL = 54, PR = 12, PT = 20, PB = 28;
            const chartW = W - PL - PR;
            const chartH = H - PT - PB;
            const n      = realData.length;
            const yMax   = Math.max(chartMax, 1);
            const toX    = (i: number) => PL + (i / Math.max(n - 1, 1)) * chartW;
            const toY    = (v: number) => PT + chartH - (v / yMax) * chartH;
            const realPts = realData.map((v, i) => `${toX(i)},${toY(v)}`).join(' ');
            const todayX  = toX(n - 1);
            const yLabels = [0, 0.25, 0.5, 0.75, 1].map((f) => f * yMax);
            return (
              <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H }}>
                <defs>
                  <linearGradient id="cost-area-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {yLabels.map((v, i) => {
                  const y = toY(v);
                  return (
                    <g key={i}>
                      <line x1={PL} x2={W - PR} y1={y} y2={y} stroke="var(--border)" strokeDasharray="2 3" />
                      <text x={PL - 4} y={y + 4} fontSize="10" fill="var(--text-3)" textAnchor="end">
                        {v >= 1000 ? `${Math.round(v / 1000)}k` : String(Math.round(v))}
                      </text>
                    </g>
                  );
                })}
                <line x1={toX(0)} y1={toY(0)} x2={toX(n - 1)} y2={toY(plannedCost > 0 ? plannedCost : yMax)}
                  stroke="var(--text-3)" strokeWidth="1.5" strokeDasharray="4 3" />
                <polygon points={`${realPts} ${toX(n - 1)},${PT + chartH} ${toX(0)},${PT + chartH}`}
                  fill="url(#cost-area-grad)" />
                <polyline points={realPts} fill="none" stroke="var(--accent)" strokeWidth="2.5"
                  strokeLinejoin="round" strokeLinecap="round" />
                <line x1={todayX} y1={PT} x2={todayX} y2={PT + chartH}
                  stroke="var(--danger)" strokeWidth="1.5" strokeDasharray="3 3" />
                <rect x={todayX - 14} y={PT} width={28} height={14} rx="3" fill="var(--danger)" />
                <text x={todayX} y={PT + 10} fontSize="9" fill="white" textAnchor="middle" fontWeight="600">hoje</text>
                {months.map((m, i) => (
                  <text key={m} x={toX(i)} y={H - 4} fontSize="10" fill="var(--text-3)" textAnchor="middle">
                    {m.slice(5)}
                  </text>
                ))}
              </svg>
            );
          })()}
        </div>
      </div>

      <div className="grid-2" style={{ gap: 12 }}>

        {/* ── Distribuição por categoria ── */}
        <div className="card">
          <div className="card-head">
            <div className="card-title">Distribuição por categoria</div>
            <span className="card-sub">realizado: {fmtK(periodSpent)}</span>
          </div>
          <div className="card-body row" style={{ gap: 20, alignItems: 'center' }}>
            {periodByCategory.length === 0 ? (
              <div className="xs faint" style={{ fontStyle: 'italic' }}>Nenhum lançamento no período.</div>
            ) : (() => {
              const total   = periodByCategory.reduce((n, [, v]) => n + v, 0) || 1;
              const r = 38, cx = 55, cy = 55, circ = 2 * Math.PI * r;
              let offsetAcc = 0;
              return (
                <>
                  <svg viewBox="0 0 110 110" width={110} height={110} style={{ flexShrink: 0 }}>
                    <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--surface-3)" strokeWidth="14" />
                    {periodByCategory.map(([cat, val]) => {
                      const len  = circ * val / total;
                      const dash = `${len} ${circ}`;
                      const off  = -offsetAcc;
                      offsetAcc += len;
                      return (
                        <circle key={cat} cx={cx} cy={cy} r={r} fill="none"
                          stroke={CAT_COLORS[cat] ?? 'var(--text-3)'} strokeWidth="14"
                          strokeDasharray={dash} strokeDashoffset={off}
                          transform={`rotate(-90 ${cx} ${cy})`}
                        />
                      );
                    })}
                    <text x={cx} y={cy - 4} textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--text)">
                      {fmtK(total)}
                    </text>
                    <text x={cx} y={cy + 10} textAnchor="middle" fontSize="9" fill="var(--text-3)">realizado</text>
                  </svg>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {periodByCategory.map(([cat, val]) => (
                      <div key={cat} className="row" style={{ gap: 8 }}>
                        <span style={{ width: 10, height: 10, background: CAT_COLORS[cat] ?? 'var(--text-3)', borderRadius: 3, flexShrink: 0 }} />
                        <span className="fill small">{cat}</span>
                        <span className="mono xs b">{fmtK(val)}</span>
                        <span className="xs faint" style={{ width: 36, textAlign: 'right' }}>
                          {Math.round((val / total) * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        {/* ── Custo por pessoa ── */}
        <div className="card">
          <div className="card-head">
            <div className="card-title">
              Custo por pessoa
              <span className="card-sub">{periodLabel}</span>
            </div>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(() => {
              const memberList = (members as any[])
                .map((m: any) => ({ ...m, spent: memberSpend[m.id] ?? 0 }))
                .filter((m: any) => m.spent > 0)
                .sort((a: any, b: any) => b.spent - a.spent)
                .slice(0, 8);
              if (memberList.length === 0) {
                return (
                  <div className="xs faint" style={{ fontStyle: 'italic', padding: '8px 0' }}>
                    Nenhum gasto vinculado a profissionais no período.
                  </div>
                );
              }
              const maxSpent = Math.max(...memberList.map((m: any) => m.spent), 1);
              return memberList.map((m: any) => {
                const grad = AV_GRADS[(m.avatarColor ?? 0) % AV_GRADS.length];
                const pct  = (m.spent / maxSpent) * 100;
                return (
                  <div key={m.id} className="row" style={{ gap: 10, alignItems: 'center' }}>
                    <Avatar initials={m.initials} colorIndex={m.avatarColor} size="sm" />
                    <div style={{ width: 90, minWidth: 0, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}
                      className="small b">{m.name}</div>
                    <span className="mono xs faint" style={{ width: 52, flexShrink: 0 }}>
                      R$ {Number(m.hourlyCost).toFixed(0)}/h
                    </span>
                    {/* Barra com gradiente personalizado */}
                    <div style={{
                      flex: 1, height: 8, background: 'var(--surface-3)',
                      borderRadius: 999, overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${pct}%`, height: '100%',
                        background: grad,
                        borderRadius: 999,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                        transition: 'width 0.6s ease',
                      }} />
                    </div>
                    <span className="mono xs b" style={{ width: 48, textAlign: 'right', flexShrink: 0 }}>
                      {fmtK(m.spent)}
                    </span>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>

      {/* ── Alertas financeiros ── */}
      <div className="card">
        <div className="card-head">
          <div className="card-title">Alertas financeiros</div>
          {burnRate > 80 && (
            <span className="chip high xs">{Math.round(burnRate)}% do orçamento usado</span>
          )}
        </div>
        <div className="card-body flush">
          {burnRate > 80 && (
            <div className="list-item" style={{ alignItems: 'flex-start' }}>
              <div className="icon-circle" style={{ background: 'var(--warning-soft)', color: 'var(--warning)' }}>!</div>
              <div className="fill">
                <div className="small b">Burn rate alto — {Math.round(burnRate)}%</div>
                <div className="xs faint">Projeção indica uso completo do orçamento antes do prazo.</div>
              </div>
            </div>
          )}
          {balance < 0 && (
            <div className="list-item" style={{ alignItems: 'flex-start' }}>
              <div className="icon-circle" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>!</div>
              <div className="fill">
                <div className="small b">Orçamento estourado</div>
                <div className="xs faint">Déficit de {formatCurrency(Math.abs(balance))}.</div>
              </div>
            </div>
          )}
          {burnRate <= 80 && balance >= 0 && (
            <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
              Sem alertas ativos · orçamento dentro do planejado.
            </div>
          )}
        </div>
      </div>

      {/* ── Lançamentos ── */}
      <div className="card">
        <div className="card-head">
          <div className="card-title">Lançamentos</div>
          <span className="card-sub">{filteredEntries.length} no {periodLabel}</span>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Data</th><th>Descrição</th><th>Etapa</th>
              <th>Categoria</th><th>Responsável</th><th>Horas</th>
              <th className="right">Valor</th><th />
            </tr>
          </thead>
          <tbody>
            {filteredEntries.slice(0, 30).map((entry) => (
              <tr key={entry.id}>
                <td className="xs faint mono">{formatDate(entry.date)}</td>
                <td className="b">{entry.description}</td>
                <td>{entry.stage && <span className="chip outline xs">{entry.stage.name}</span>}</td>
                <td>
                  <span className="chip xs" style={{
                    background: `color-mix(in srgb, ${CAT_COLORS[entry.category] ?? 'var(--text-3)'} 12%, transparent)`,
                    color: CAT_COLORS[entry.category] ?? 'var(--text-3)',
                    border: `1px solid color-mix(in srgb, ${CAT_COLORS[entry.category] ?? 'var(--text-3)'} 25%, transparent)`,
                  }}>{entry.category}</span>
                </td>
                <td>
                  {entry.professional && (
                    <div className="row" style={{ gap: 6 }}>
                      <Avatar initials={entry.professional.initials} colorIndex={entry.professional.avatarColor} size="sm" />
                      <span className="xs b">{entry.professional.name}</span>
                    </div>
                  )}
                </td>
                <td className="mono xs">{entry.hours ? `${entry.hours}h` : '—'}</td>
                <td className="right b mono">
                  {formatCurrency(Number(entry.amount))}
                </td>
                <td>
                  <button className="icon-btn ghost"
                    onClick={() => window.confirm('Excluir lançamento?') && deleteMutation.mutate(entry.id)}
                    style={{ color: 'var(--danger)' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
            {filteredEntries.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--text-3)' }}>
                  Nenhum lançamento no período selecionado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};
