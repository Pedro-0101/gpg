import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { KPI } from '../../components/ui/KPI';
import { Avatar } from '../../components/ui/Avatar';
import { membersApi } from '../../api/members';
import { formatCurrency } from '@/lib/utils';
import type { Project, Professional, MemberMetrics } from '../../types';

interface MembersPageProps { project: Project; }
interface MemberForm { name: string; initials: string; role: string; skills: string; avatarColor: number; }

const COLOR_LABELS = ['Roxo/Indigo', 'Rosa/Red', 'Verde/Teal', 'Laranja/Amarelo', 'Azul/Teal', 'Lilás/Rosa', 'Verde/Lime', 'Laranja/Amarelo'];

function Sparkline({ points, color = 'var(--success)' }: { points: number[]; color?: string }) {
  const w = 70, h = 28;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = Math.max(max - min, 1);
  const pts = points.map((v, i) =>
    `${(i / (points.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`
  ).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" style={{ overflow: 'visible', display: 'block' }}>
      <polyline points={pts} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const MembersPage: React.FC<MembersPageProps> = ({ project }) => {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Professional | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [menuId, setMenuId] = useState<string | null>(null);

  const { data: members = [] } = useQuery<Professional[]>({
    queryKey: ['members', project.id],
    queryFn: () => membersApi.list(project.id),
  });
  const { data: metrics = [] } = useQuery<MemberMetrics[]>({
    queryKey: ['members', project.id, 'metrics'],
    queryFn: () => membersApi.metrics(project.id),
  });

  const { register, handleSubmit, reset, setValue, watch } = useForm<MemberForm>({
    defaultValues: { name: '', initials: '', role: '', skills: '', avatarColor: 0 },
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) =>
      editing ? membersApi.update(project.id, editing.id, data) : membersApi.create(project.id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['members', project.id] }); closeDialog(); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => membersApi.remove(project.id, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members', project.id] }),
  });

  function openCreate() { setEditing(null); reset({ name: '', initials: '', role: '', skills: '', avatarColor: 0 }); setDialogOpen(true); }
  function openEdit(m: Professional) {
    setEditing(m);
    reset({ name: m.name, initials: m.initials, role: m.role, skills: m.skills.join(', '), avatarColor: m.avatarColor });
    setDialogOpen(true);
    setMenuId(null);
  }
  function closeDialog() { setDialogOpen(false); setEditing(null); reset(); }
  function onSubmit(data: MemberForm) {
    saveMutation.mutate({
      name: data.name.trim(), initials: data.initials.trim().toUpperCase().slice(0, 4),
      role: data.role.trim(),
      skills: data.skills.split(',').map((s) => s.trim()).filter(Boolean),
      avatarColor: Number(data.avatarColor),
    });
  }
  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const parts = e.target.value.trim().split(' ').filter(Boolean);
    setValue('initials', parts.slice(0, 2).map((p) => p[0]).join('').toUpperCase());
  }
  function handleDelete(member: Professional) {
    setMenuId(null);
    if (window.confirm(`Remover ${member.name}?`)) deleteMutation.mutate(member.id);
  }

  const metricsById = Object.fromEntries(metrics.map((m) => [m.memberId, m]));
  const avgLoad = metrics.length > 0 ? Math.round(metrics.reduce((a, m) => a + m.loadPercent, 0) / metrics.length) : 0;
  const avgPerf = metrics.length > 0 ? Math.round(metrics.reduce((a, m) => a + m.performance, 0) / metrics.length) : 0;
  const totalHours = metrics.reduce((a, m) => a + (m.activeHours || 0), 0);
  const totalWeeklyCost = members.reduce((a, member) => {
    const m = metricsById[member.id];
    return a + (m ? m.activeHours * Number(member.hourlyCost) : 0);
  }, 0);

  const allSkills = Array.from(new Set(members.flatMap((m) => m.skills ?? [])));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} onClick={() => menuId && setMenuId(null)}>
      <div className="page-head">
        <div>
          <div className="page-title">Equipe</div>
          <div className="page-sub">Visão por pessoa · clique para ver perfil</div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <div className="seg">
            <button className={`seg-btn${viewMode === 'cards' ? ' active' : ''}`} onClick={() => setViewMode('cards')}>Cards</button>
            <button className={`seg-btn${viewMode === 'table' ? ' active' : ''}`} onClick={() => setViewMode('table')}>Tabela</button>
          </div>
          <button className="btn primary" onClick={openCreate}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Convidar
          </button>
        </div>
      </div>

      <div className="kpi-grid">
        <KPI label="Pessoas ativas" value={members.length} sub={`no projeto ${project.name}`} />
        <KPI label="Carga média" value={`${avgLoad}%`} sub="vs sprint passada"
          delta={avgLoad > 85 ? { dir: 'down', text: 'Alta' } : { dir: 'up', text: '+Normal' }} />
        <KPI label="Performance" value={`${avgPerf}%`} sub="meta 85%"
          delta={avgPerf >= 85 ? { dir: 'up', text: `+${avgPerf - 85}%` } : undefined} />
        <KPI label="Horas/semana" value={totalHours} sub={totalWeeklyCost > 0 ? `custo ${formatCurrency(totalWeeklyCost)}` : 'sem dados'} />
      </div>

      {/* ── Cards ───────────────────────────────────────── */}
      {viewMode === 'cards' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {members.map((member) => {
            const m = metricsById[member.id];
            const load = m?.loadPercent ?? 0;
            const perf = m?.performance ?? 0;
            const sparkPts = [perf - 10, perf - 8, perf - 5, perf - 6, perf - 3, perf - 2, perf, perf + 1].map((v) => Math.max(0, Math.min(100, v)));
            return (
              <div key={member.id} className="card" style={{ padding: 16 }}>
                {/* Header */}
                <div className="row" style={{ gap: 12 }}>
                  <Avatar initials={member.initials} colorIndex={member.avatarColor} size="xl" />
                  <div className="fill" style={{ minWidth: 0 }}>
                    <div className="b" style={{ fontSize: 14 }}>{member.name}</div>
                    <div className="xs faint">{member.role}</div>
                    <div className="row" style={{ gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                      {member.skills.slice(0, 3).map((s) => (
                        <span key={s} className="chip outline xs">{s}</span>
                      ))}
                    </div>
                  </div>
                  {/* More menu */}
                  <div style={{ position: 'relative', alignSelf: 'flex-start' }} onClick={(e) => e.stopPropagation()}>
                    <button
                      className="icon-btn ghost"
                      onClick={() => setMenuId(menuId === member.id ? null : member.id)}
                      title="Mais opções"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
                      </svg>
                    </button>
                    {menuId === member.id && (
                      <div style={{
                        position: 'absolute', right: 0, top: '100%', marginTop: 4, zIndex: 20,
                        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)', minWidth: 130, overflow: 'hidden',
                      }}>
                        <button
                          style={{ display: 'block', width: '100%', padding: '8px 14px', textAlign: 'left', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)' }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                          onClick={() => openEdit(member)}
                        >Editar</button>
                        <button
                          style={{ display: 'block', width: '100%', padding: '8px 14px', textAlign: 'left', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                          onClick={() => handleDelete(member)}
                        >Remover</button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="divider" />

                {/* Carga */}
                <div>
                  <div className="row between">
                    <span className="xs faint">Carga esta sprint</span>
                    <span className="xs b">{load}%</span>
                  </div>
                  <div className="bar thick" style={{ marginTop: 4 }}>
                    <span style={{ width: `${Math.min(load, 100)}%`, background: load > 85 ? 'var(--warning)' : 'var(--accent)' }} />
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid-3" style={{ marginTop: 12, gap: 4 }}>
                  <div>
                    <div className="xs faint">Tarefas</div>
                    <div className="b">{m?.activeTasks ?? 0}</div>
                  </div>
                  <div>
                    <div className="xs faint">Concluídas</div>
                    <div className="b">{m?.completedTasks ?? 0}</div>
                  </div>
                  <div>
                    <div className="xs faint">Custo/h</div>
                    <div className="b" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{formatCurrency(Number(member.hourlyCost))}</div>
                  </div>
                </div>

                <div className="divider" />

                {/* Performance + sparkline */}
                <div className="row between">
                  <div>
                    <div className="xs faint">Performance · 30d</div>
                    <div className="b" style={{ color: 'var(--success)' }}>{perf}%</div>
                  </div>
                  <Sparkline points={sparkPts} />
                </div>

                {/* Action buttons */}
                <div className="row" style={{ marginTop: 12, gap: 6 }}>
                  <button className="btn ghost sm" style={{ flex: 1 }} onClick={() => openEdit(member)}>Ver perfil</button>
                  <button className="btn ghost sm" style={{ flex: 1 }}>Atribuir</button>
                </div>
              </div>
            );
          })}

          {members.length === 0 && (
            <div style={{ gridColumn: 'span 3', padding: 32, textAlign: 'center', color: 'var(--text-3)' }}>
              Nenhum membro cadastrado.{' '}
              <button className="btn sm ghost" onClick={openCreate}>Adicionar o primeiro.</button>
            </div>
          )}
        </div>
      )}

      {/* ── Tabela ──────────────────────────────────────── */}
      {viewMode === 'table' && (
        <>
          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="card-head">
              <div className="card-title">Membros</div>
            </div>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Pessoa</th>
                  <th>Papel</th>
                  <th>Tarefas</th>
                  <th style={{ width: 200 }}>Carga atual</th>
                  <th>Custo/h</th>
                  <th>Concluídas</th>
                  <th style={{ width: 160 }}>Performance</th>
                  <th style={{ width: 80 }} />
                </tr>
              </thead>
              <tbody>
                {members.map((member) => {
                  const m = metricsById[member.id];
                  const load = m?.loadPercent ?? 0;
                  const perf = m?.performance ?? 0;
                  return (
                    <tr key={member.id}>
                      <td>
                        <div className="row" style={{ gap: 8 }}>
                          <Avatar initials={member.initials} colorIndex={member.avatarColor} size="sm" />
                          <div>
                            <div className="b">{member.name}</div>
                            <div className="xs faint">{member.skills.slice(0, 3).join(' · ')}</div>
                          </div>
                        </div>
                      </td>
                      <td>{member.role}</td>
                      <td><span className="b">{m?.activeTasks ?? 0}</span> <span className="xs faint">ativas</span></td>
                      <td>
                        <div className="row" style={{ gap: 8 }}>
                          <div className="bar" style={{ flex: 1 }}>
                            <span style={{ width: `${Math.min(load, 100)}%`, background: load > 85 ? 'var(--warning)' : 'var(--accent)' }} />
                          </div>
                          <span className="xs b" style={{ width: 32, textAlign: 'right', flexShrink: 0 }}>{load}%</span>
                        </div>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{formatCurrency(Number(member.hourlyCost))}</td>
                      <td>{m?.completedTasks ?? 0}</td>
                      <td>
                        <div className="row" style={{ gap: 8 }}>
                          <div className="bar" style={{ flex: 1 }}>
                            <span style={{ width: `${perf}%`, background: 'var(--success)' }} />
                          </div>
                          <span className="xs b" style={{ width: 32, textAlign: 'right', flexShrink: 0 }}>{perf}%</span>
                        </div>
                      </td>
                      <td>
                        <div className="row" style={{ gap: 4, justifyContent: 'flex-end' }}>
                          <button className="btn ghost sm" onClick={() => openEdit(member)}>Editar</button>
                          <button className="btn ghost sm" style={{ color: 'var(--danger)' }}
                            onClick={() => { if (window.confirm(`Remover ${member.name}?`)) deleteMutation.mutate(member.id); }}>✕</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {members.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--text-3)' }}>Nenhum membro cadastrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Skills panel */}
          {allSkills.length > 0 && (
            <div className="card">
              <div className="card-head">
                <div className="card-title">Skills no time</div>
                <span className="card-sub">{allSkills.length} {allSkills.length === 1 ? 'área coberta' : 'áreas cobertas'}</span>
              </div>
              <div className="card-body" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {allSkills.map((skill) => {
                  const count = members.filter((m) => m.skills.includes(skill)).length;
                  return (
                    <span key={skill} className="chip purple">
                      {skill} <span className="xs" style={{ opacity: 0.7 }}>· {count}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Modal ───────────────────────────────────────── */}
      {dialogOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)' }}>
          <div className="card" style={{ width: '100%', maxWidth: 420, padding: 24, background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="row between">
              <span className="b" style={{ fontSize: 15 }}>{editing ? 'Editar membro' : 'Novo membro'}</span>
              <button className="icon-btn ghost" onClick={closeDialog}>✕</button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="xs faint" style={{ display: 'block', marginBottom: 4 }}>Nome completo *</label>
                <input className="input" placeholder="Ex: Lina Kerry" style={{ width: '100%', padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: 13 }}
                  {...register('name', { required: true, onChange: handleNameChange })} />
              </div>
              <div className="grid-2" style={{ gap: 8 }}>
                <div>
                  <label className="xs faint" style={{ display: 'block', marginBottom: 4 }}>Iniciais</label>
                  <input className="input" placeholder="LK" maxLength={4} style={{ width: '100%', padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: 13 }}
                    {...register('initials', { required: true })} />
                </div>
                <div>
                  <label className="xs faint" style={{ display: 'block', marginBottom: 4 }}>Cor do avatar</label>
                  <select style={{ width: '100%', padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: 13 }}
                    {...register('avatarColor', { valueAsNumber: true })}>
                    {COLOR_LABELS.map((label, i) => <option key={i} value={i}>{label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="xs faint" style={{ display: 'block', marginBottom: 4 }}>Cargo / Função *</label>
                <input className="input" placeholder="Ex: Sr. Designer, Frontend Lead" style={{ width: '100%', padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: 13 }}
                  {...register('role', { required: true })} />
              </div>
              <div>
                <label className="xs faint" style={{ display: 'block', marginBottom: 4 }}>Skills (separadas por vírgula)</label>
                <input className="input" placeholder="Ex: UX, UI, React" style={{ width: '100%', padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: 13 }}
                  {...register('skills')} />
              </div>

              {/* Preview */}
              <div className="row" style={{ gap: 10, padding: 10, background: 'var(--surface-2)', borderRadius: 'var(--radius)' }}>
                <Avatar initials={watch('initials') || '??'} colorIndex={watch('avatarColor') || 0} size="lg" />
                <div>
                  <div className="b small">{watch('name') || 'Nome'}</div>
                  <div className="xs faint">{watch('role') || 'Cargo'}</div>
                </div>
              </div>

              <div className="row" style={{ gap: 8, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                <button type="button" className="btn ghost" onClick={closeDialog}>Cancelar</button>
                <button type="submit" disabled={saveMutation.isPending} className="btn primary">
                  {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
