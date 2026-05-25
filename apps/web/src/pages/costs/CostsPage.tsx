import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { KPI } from '../../components/ui/KPI';
import { BurndownChart } from '../../components/ui/BurndownChart';
import { Avatar } from '../../components/ui/Avatar';
import { costsApi } from '../../api/costs';
import { membersApi } from '../../api/members';
import { stagesApi } from '../../api/stages';
import { calcStageCost } from '../../lib/cost';
import { formatCurrency, formatDate } from '../../lib/utils';
import type { Project, CostEntry, CostSummary } from '../../types';

interface CostsPageProps { project: Project; }
const CATEGORIES = ['Pessoal', 'Ferramentas', 'Infraestrutura', 'Freelancers', 'Outros'];
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '5px 8px', border: '1px solid var(--border)',
  borderRadius: 'var(--radius)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: 12.5,
};

export const CostsPage: React.FC<CostsPageProps> = ({ project }) => {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: entries = [] } = useQuery({
    queryKey: ['costs', project.id],
    queryFn: () => costsApi.list(project.id),
  });
  const { data: summary } = useQuery<CostSummary>({
    queryKey: ['costs', project.id, 'summary'],
    queryFn: () => costsApi.summary(project.id),
  });
  const { data: members = [] } = useQuery({
    queryKey: ['members', project.id],
    queryFn: () => membersApi.list(project.id),
  });
  const { data: stages = [] } = useQuery({
    queryKey: ['stages', project.id],
    queryFn: () => stagesApi.list(project.id),
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
    defaultValues: { description: '', category: 'Pessoal', amount: 0, hours: '', date: new Date().toISOString().slice(0, 10), professionalId: '', stageId: '' },
  });

  const totalSpent = summary?.totalSpent ?? 0;
  const plannedCost = summary?.plannedCost ?? 0;
  const doneCost = summary?.doneCost ?? 0;
  const balance = plannedCost > 0 ? plannedCost - doneCost : 0;
  const burnRate = plannedCost > 0 ? (doneCost / plannedCost) * 100 : 0;

  // Burndown chart data
  const monthsMap: Record<string, number> = {};
  (entries as CostEntry[]).forEach((e) => {
    const d = new Date(e.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthsMap[key] = (monthsMap[key] ?? 0) + Number(e.amount);
  });
  const months = Object.keys(monthsMap).sort();
  let acc = 0;
  const chartData = [0, ...months.map((m) => { acc += monthsMap[m]; return acc; })];
  const totalMonths = Math.max(months.length, 1);
  const idealStep = plannedCost / totalMonths;
  const idealData = Array.from({ length: chartData.length }, (_, i) => idealStep * i);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="page-head">
        <div>
          <div className="page-title">Custos do projeto</div>
          <div className="page-sub">Orçamento aprovado · acompanhamento financeiro</div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <div className="seg">
            <button className="seg-btn active">Mês</button>
            <button className="seg-btn">Sem.</button>
            <button className="seg-btn">Trim.</button>
          </div>
          <button className="btn primary" onClick={() => setShowForm(!showForm)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Novo lançamento
          </button>
        </div>
      </div>

      <div className="kpi-grid">
        <KPI label="Orçamento previsto" value={formatCurrency(plannedCost)} sub="total planejado pelas tasks" />
        <KPI label="Gastos realizados" value={formatCurrency(doneCost)}
          delta={plannedCost > 0 ? { dir: burnRate > 80 ? 'down' : 'flat', text: `${Math.round(burnRate)}% concluído` } : undefined}
          sub="tasks com status concluído" />
        <KPI label="Lançamentos manuais" value={formatCurrency(totalSpent)} sub="entradas avulsas de custo" />
        <KPI label="Saldo restante" value={formatCurrency(balance)}
          delta={balance < 0 ? { dir: 'down', text: 'Deficit' } : undefined}
          sub={balance >= 0 ? 'a realizar' : 'acima do planejado'} />
      </div>

      {/* Form */}
      {showForm && (
        <div className="card">
          <div className="card-head">
            <div className="card-title">Novo lançamento</div>
            <button className="icon-btn ghost" onClick={() => { setShowForm(false); reset(); }}>✕</button>
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
                  <input style={inputStyle} placeholder="Ex: Horas Lina · UI sistema" {...register('description', { required: true })} />
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
                  {createMutation.isPending ? 'Salvando...' : 'Salvar lançamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Per-stage budget vs actual */}
      {(stages as any[]).length > 0 && (() => {
        const STAGE_COLORS = ['#4F46E5', '#10B981', '#0EA5E9', '#F59E0B', '#EF4444', '#7C3AED', '#EC4899', '#06B6D4'];
        const stageData = (stages as any[]).map((s: any, i: number) => {
          const planned = calcStageCost(s);
          const actual = (entries as CostEntry[])
            .filter((e) => e.stageId === s.id)
            .reduce((n, e) => n + Number(e.amount), 0);
          return { name: s.name, planned, actual, color: STAGE_COLORS[i % STAGE_COLORS.length] };
        }).filter((s) => s.planned > 0 || s.actual > 0);
        if (stageData.length === 0) return null;
        const maxVal = Math.max(...stageData.map((s) => Math.max(s.planned, s.actual)), 1);
        return (
          <div className="card">
            <div className="card-head">
              <div className="card-title">Orçado vs Realizado · por etapa</div>
              <div className="row xs faint" style={{ gap: 12 }}>
                <span className="row" style={{ gap: 4 }}>
                  <span style={{ width: 12, height: 8, border: '1.5px dashed var(--text-3)', borderRadius: 2, display: 'inline-block' }} />
                  orçado
                </span>
                <span className="row" style={{ gap: 4 }}>
                  <span style={{ width: 12, height: 8, background: 'var(--accent)', borderRadius: 2, display: 'inline-block' }} />
                  realizado
                </span>
              </div>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {stageData.map((s, i) => {
                const pct = s.planned > 0 ? Math.round((s.actual / s.planned) * 100) : 0;
                const pctColor = pct > 90 ? 'var(--danger)' : pct > 70 ? 'var(--warning)' : 'var(--success)';
                return (
                  <div key={i} style={{ padding: '12px 0', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                    <div className="row between" style={{ marginBottom: 8 }}>
                      <div className="row" style={{ gap: 6 }}>
                        <span className="chip accent xs">E{i + 1}</span>
                        <span className="b small">{s.name}</span>
                      </div>
                      <div className="row" style={{ gap: 8 }}>
                        <span className="mono xs">
                          <b>{formatCurrency(s.actual)}</b>
                          <span className="faint"> / {formatCurrency(s.planned)}</span>
                        </span>
                        <span className="chip xs" style={{ background: `color-mix(in srgb, ${pctColor} 15%, transparent)`, color: pctColor, minWidth: 44, justifyContent: 'center' }}>
                          {pct}%
                        </span>
                      </div>
                    </div>
                    <div style={{ position: 'relative', height: 20 }}>
                      <div style={{
                        position: 'absolute', left: 0, top: 5,
                        width: `${(s.planned / maxVal) * 100}%`,
                        height: 10, border: '1.5px dashed var(--text-3)',
                        borderRadius: 3, background: 'transparent',
                      }} />
                      <div style={{
                        position: 'absolute', left: 0, top: 5,
                        width: `${(s.actual / maxVal) * 100}%`,
                        height: 10, background: s.color, borderRadius: 3,
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      <div className="grid-2" style={{ gap: 12 }}>
        {/* Burndown chart */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="card-head">
            <div className="card-title">Curva financeira</div>
            <div className="row xs faint" style={{ gap: 12 }}>
              <span><span style={{ display: 'inline-block', width: 12, height: 2, background: 'var(--text-3)', marginRight: 4 }} />ideal</span>
              <span><span style={{ display: 'inline-block', width: 12, height: 2, background: 'var(--accent)', marginRight: 4 }} />real</span>
            </div>
          </div>
          <div className="card-body">
            {chartData.length > 1 ? (
              <BurndownChart data={chartData} ideal={idealData} height={220} />
            ) : (
              <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-3)' }}>
                Registre lançamentos para ver o burndown.
              </div>
            )}
          </div>
        </div>

        {/* Por categoria — donut */}
        <div className="card">
          <div className="card-head">
            <div className="card-title">Distribuição por categoria</div>
            <span className="card-sub">total realizado: {formatCurrency(totalSpent)}</span>
          </div>
          <div className="card-body row" style={{ gap: 20, alignItems: 'center' }}>
            {(() => {
              const CAT_COLORS: Record<string, string> = {
                Pessoal: 'var(--accent)',
                Ferramentas: 'var(--purple)',
                Infraestrutura: 'var(--success)',
                Freelancers: 'var(--warning)',
                Outros: 'var(--text-3)',
              };
              const catEntries = Object.entries(summary?.byCategory ?? {}) as [string, number][];
              if (catEntries.length === 0) {
                return <div className="xs faint" style={{ fontStyle: 'italic' }}>Nenhum lançamento ainda.</div>;
              }
              const total = catEntries.reduce((n, [, v]) => n + v, 0) || 1;
              const r = 40, cx = 52, cy = 52, circ = 2 * Math.PI * r;
              let acc = 0;
              return (
                <>
                  <svg viewBox="0 0 104 104" width={104} height={104} style={{ flexShrink: 0 }}>
                    {catEntries.map(([cat, val], i) => {
                      const arc = (val / total) * circ;
                      const rotation = (acc / total) * 360 - 90;
                      acc += val;
                      const color = CAT_COLORS[cat] || 'var(--text-3)';
                      return (
                        <circle key={cat} cx={cx} cy={cy} r={r}
                          fill="none" stroke={color} strokeWidth={16}
                          strokeDasharray={`${arc} ${circ}`}
                          transform={`rotate(${rotation}, ${cx}, ${cy})`}
                        />
                      );
                    })}
                    <text x={cx} y={cy + 5} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--text)">
                      {total >= 1000 ? `R$${Math.round(total / 1000)}k` : `R$${total.toFixed(0)}`}
                    </text>
                  </svg>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {catEntries.map(([cat, val]) => (
                      <div key={cat} className="row" style={{ gap: 8 }}>
                        <span style={{ width: 10, height: 10, background: CAT_COLORS[cat] || 'var(--text-3)', borderRadius: 3, flexShrink: 0 }} />
                        <span className="fill small">{cat}</span>
                        <span className="mono xs b">{formatCurrency(val)}</span>
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

        {/* Alertas financeiros */}
        <div className="card">
          <div className="card-head">
            <div className="card-title">Alertas financeiros</div>
          </div>
          <div className="card-body flush">
            {burnRate > 80 && (
              <div className="list-item" style={{ alignItems: 'flex-start' }}>
                <div className="icon-circle" style={{ background: 'var(--warning-soft)', color: 'var(--warning)' }}>!</div>
                <div className="fill">
                  <div className="small b">Burn rate alto — {Math.round(burnRate)}%</div>
                  <div className="xs faint">Projeção indica uso completo antes do prazo.</div>
                </div>
              </div>
            )}
            {balance < 0 && (
              <div className="list-item" style={{ alignItems: 'flex-start' }}>
                <div className="icon-circle" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>!</div>
                <div className="fill">
                  <div className="small b">Orçamento estourado</div>
                  <div className="xs faint">Deficit de {formatCurrency(Math.abs(balance))}.</div>
                </div>
              </div>
            )}
            {burnRate <= 80 && balance >= 0 && (
              <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                Sem alertas ativos.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lançamentos recentes */}
      <div className="card">
        <div className="card-head">
          <div className="card-title">Lançamentos recentes</div>
          <button className="btn sm ghost">Ver todos</button>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Data</th>
              <th>Descrição</th>
              <th>Etapa</th>
              <th>Categoria</th>
              <th>Responsável</th>
              <th>Horas</th>
              <th className="right">Valor</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(entries as CostEntry[]).slice(0, 20).map((entry) => (
              <tr key={entry.id}>
                <td className="xs faint mono">{formatDate(entry.date)}</td>
                <td className="b">{entry.description}</td>
                <td>{entry.stage && <span className="chip accent xs">{entry.stage.name}</span>}</td>
                <td><span className="chip accent xs">{entry.category}</span></td>
                <td>
                  {entry.professional && (
                    <div className="row">
                      <Avatar initials={entry.professional.initials} colorIndex={entry.professional.avatarColor} size="sm" />
                      <span className="xs b">{entry.professional.name}</span>
                    </div>
                  )}
                </td>
                <td className="mono xs">{entry.hours ? `${entry.hours}h` : '—'}</td>
                <td className="right b mono">{formatCurrency(Number(entry.amount))}</td>
                <td>
                  <button
                    className="icon-btn ghost"
                    onClick={() => window.confirm('Excluir lançamento?') && deleteMutation.mutate(entry.id)}
                    style={{ color: 'var(--danger)' }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--text-3)' }}>
                  Nenhum lançamento registrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
