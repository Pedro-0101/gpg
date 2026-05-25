import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createProfessionalSchema, CreateProfessionalDto } from '@gpg/shared';
import { professionalsApi } from '@/api/professionals';
import { membersApi } from '@/api/members';
import { KPI } from '../../components/ui/KPI';
import { Avatar } from '../../components/ui/Avatar';
import { formatCurrency } from '@/lib/utils';
import type { Project, Professional, MemberMetrics } from '@/types';

interface Props { project: Project; }

const inp: React.CSSProperties = {
  width: '100%', padding: '6px 10px',
  border: '1px solid var(--border)', borderRadius: 'var(--radius)',
  background: 'var(--surface-2)', color: 'var(--text)', fontSize: 13, outline: 'none',
};

const AVATAR_COLORS = ['#4f46e5','#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6'];

export function ProfessionalsPage({ project }: Props) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Professional | null>(null);
  const [view, setView] = useState<'cards' | 'table'>('cards');

  const { data: professionals = [], isLoading } = useQuery({
    queryKey: ['professionals', project.id],
    queryFn: () => professionalsApi.list(project.id),
  });

  const { data: metrics = [] } = useQuery<MemberMetrics[]>({
    queryKey: ['members', project.id, 'metrics'],
    queryFn: () => membersApi.metrics(project.id),
  });

  const form = useForm<CreateProfessionalDto>({
    resolver: zodResolver(createProfessionalSchema),
    defaultValues: { name: '', initials: '', role: '', hourlyCost: 0, skills: [], avatarColor: 0 },
  });

  const saveMutation = useMutation({
    mutationFn: (data: CreateProfessionalDto) =>
      editing ? professionalsApi.update(project.id, editing.id, data) : professionalsApi.create(project.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['professionals', project.id] });
      qc.invalidateQueries({ queryKey: ['members', project.id, 'metrics'] });
      handleClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => professionalsApi.remove(project.id, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['professionals', project.id] });
      qc.invalidateQueries({ queryKey: ['members', project.id, 'metrics'] });
    },
  });

  function handleOpen(p?: Professional) {
    if (p) {
      setEditing(p);
      form.reset({ name: p.name, initials: p.initials, role: p.role, hourlyCost: Number(p.hourlyCost), skills: p.skills ?? [], avatarColor: p.avatarColor ?? 0 });
    } else {
      setEditing(null);
      form.reset({ name: '', initials: '', role: '', hourlyCost: 0, skills: [], avatarColor: 0 });
    }
    setOpen(true);
  }

  function handleClose() { setOpen(false); setEditing(null); form.reset(); }

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const parts = e.target.value.trim().split(' ').filter(Boolean);
    form.setValue('initials', parts.slice(0, 2).map((p) => p[0]).join('').toUpperCase());
  }

  const metricsById = Object.fromEntries(metrics.map((m) => [m.memberId, m]));
  const avgLoad = metrics.length > 0 ? Math.round(metrics.reduce((a, m) => a + m.loadPercent, 0) / metrics.length) : 0;
  const avgPerf = metrics.length > 0 ? Math.round(metrics.reduce((a, m) => a + m.performance, 0) / metrics.length) : 0;
  const watchedColor = form.watch('avatarColor') ?? 0;
  const watchedName = form.watch('name') ?? '';
  const watchedInitials = form.watch('initials') ?? '';
  const watchedRole = form.watch('role') ?? '';
  const skillsRaw = form.watch('skills');
  const skillsValue = Array.isArray(skillsRaw) ? skillsRaw.join(', ') : (skillsRaw ?? '');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="page-head">
        <div>
          <div className="page-title">Profissionais · {project.name}</div>
          <div className="page-sub">Pessoas reais com função, custo/hora e carga de trabalho</div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <div className="seg">
            <button className={`seg-btn${view === 'cards' ? ' active' : ''}`} onClick={() => setView('cards')}>Cards</button>
            <button className={`seg-btn${view === 'table' ? ' active' : ''}`} onClick={() => setView('table')}>Tabela</button>
          </div>
          <button className="btn primary" onClick={() => handleOpen()}>+ Novo Profissional</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        <KPI label="Pessoas ativas" value={professionals.length} sub={`no projeto ${project.name}`} />
        <KPI label="Carga média" value={`${avgLoad}%`} sub="ocupação da equipe"
          delta={avgLoad > 85 ? { dir: 'down', text: 'Alta' } : { dir: 'flat', text: 'Normal' }} />
        <KPI label="Tarefas abertas" value={metrics.reduce((a, m) => a + m.activeTasks, 0)} sub="atribuídas" />
        <KPI label="Performance média" value={`${avgPerf}%`} sub="concluídas / total"
          delta={avgPerf >= 80 ? { dir: 'up', text: `${avgPerf}%` } : undefined} />
      </div>

      {isLoading && <div className="faint" style={{ padding: 32, textAlign: 'center' }}>Carregando...</div>}

      {/* Cards view */}
      {!isLoading && view === 'cards' && (
        professionals.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-3)' }}>
            <div style={{ marginBottom: 10 }}>Nenhum profissional cadastrado.</div>
            <button className="btn primary" onClick={() => handleOpen()}>Cadastrar profissional</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {professionals.map((p) => {
              const m = metricsById[p.id];
              const load = m?.loadPercent ?? 0;
              return (
                <div key={p.id} className="card" style={{ padding: 16 }}>
                  <div className="row" style={{ gap: 12 }}>
                    <Avatar initials={p.initials} colorIndex={p.avatarColor ?? 0} size="xl" />
                    <div className="fill" style={{ minWidth: 0 }}>
                      <div className="b" style={{ fontSize: 14 }}>{p.name}</div>
                      <div className="xs faint">{p.role}</div>
                      <div className="xs faint" style={{ fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                        {formatCurrency(Number(p.hourlyCost))}/h
                      </div>
                      <div className="row" style={{ gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                        {(p.skills ?? []).slice(0, 3).map((s) => (
                          <span key={s} className="chip purple xs">{s}</span>
                        ))}
                      </div>
                    </div>
                    <div className="row" style={{ gap: 4, alignSelf: 'flex-start' }}>
                      <button className="icon-btn ghost" onClick={() => handleOpen(p)} title="Editar">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button className="icon-btn ghost" style={{ color: 'var(--danger)' }} title="Remover"
                        onClick={() => window.confirm(`Remover ${p.name}?`) && deleteMutation.mutate(p.id)}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6 M14 11v6 M9 6V4h6v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="divider" />
                  <div>
                    <div className="row between" style={{ marginBottom: 4 }}>
                      <span className="xs faint">Carga de trabalho</span>
                      <span className="xs b" style={{ color: load > 100 ? 'var(--danger)' : load > 85 ? 'var(--warning)' : 'var(--text)' }}>
                        {load}%
                      </span>
                    </div>
                    <div className="bar thick">
                      <span style={{ width: `${Math.min(load, 100)}%`, background: load > 100 ? 'var(--danger)' : load > 85 ? 'var(--warning)' : 'var(--accent)' }} />
                    </div>
                    <div className="row between" style={{ marginTop: 4 }}>
                      <span className="xs faint mono">{m?.activeHours ?? 0}h esta semana</span>
                      <span className="xs faint mono">cap. {m?.capacityHours ?? 0}h/sem</span>
                    </div>
                  </div>
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
                      <div className="xs faint">Performance</div>
                      <div className="b" style={{ color: 'var(--success)' }}>{m?.performance ?? 0}%</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Table view */}
      {!isLoading && view === 'table' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          {professionals.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-3)' }}>
              <div style={{ marginBottom: 10 }}>Nenhum profissional cadastrado.</div>
              <button className="btn primary" onClick={() => handleOpen()}>Cadastrar profissional</button>
            </div>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Função</th>
                  <th style={{ textAlign: 'right' }}>Custo/h</th>
                  <th style={{ textAlign: 'right' }}>Carga</th>
                  <th style={{ textAlign: 'right' }}>Tarefas</th>
                  <th style={{ textAlign: 'right' }}>Performance</th>
                  <th style={{ width: 90 }} />
                </tr>
              </thead>
              <tbody>
                {professionals.map((p) => {
                  const m = metricsById[p.id];
                  const load = m?.loadPercent ?? 0;
                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Avatar initials={p.initials} colorIndex={p.avatarColor ?? 0} size="sm" />
                          <span className="b">{p.name}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-2)' }}>{p.role}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 13 }}>{formatCurrency(Number(p.hourlyCost))}</td>
                      <td style={{ textAlign: 'right' }}>
                        <span style={{ color: load > 100 ? 'var(--danger)' : load > 85 ? 'var(--warning)' : 'var(--text)', fontWeight: 600 }}>{load}%</span>
                        <div className="xs faint mono">{m?.activeHours ?? 0}h / {m?.capacityHours ?? 0}h esta semana</div>
                      </td>
                      <td style={{ textAlign: 'right' }}>{m?.activeTasks ?? 0}</td>
                      <td style={{ textAlign: 'right', color: 'var(--success)', fontWeight: 600 }}>{m?.performance ?? 0}%</td>
                      <td>
                        <div className="row" style={{ gap: 4, justifyContent: 'flex-end' }}>
                          <button className="btn ghost sm" onClick={() => handleOpen(p)}>Editar</button>
                          <button className="btn ghost sm" style={{ color: 'var(--danger)' }}
                            onClick={() => { if (confirm('Excluir este profissional?')) deleteMutation.mutate(p.id); }}>✕</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modal */}
      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'grid', placeItems: 'center', zIndex: 100 }}
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}>
          <div className="card" style={{ width: 460, padding: 24 }} onClick={(e) => e.stopPropagation()}>
            <div className="card-head" style={{ marginBottom: 16 }}>
              <div className="card-title">{editing ? 'Editar Profissional' : 'Novo Profissional'}</div>
              <button className="btn ghost sm" onClick={handleClose}>✕</button>
            </div>
            <form onSubmit={form.handleSubmit((d) => {
              // convert skills string back to array if needed
              saveMutation.mutate(d);
            })}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
                  <div>
                    <label className="xs faint" style={{ display: 'block', marginBottom: 4 }}>Nome *</label>
                    <input style={inp} {...form.register('name', { onChange: handleNameChange })} placeholder="Ex: João Silva" />
                    {form.formState.errors.name && <div style={{ color: 'var(--danger)', fontSize: 11, marginTop: 3 }}>{form.formState.errors.name.message}</div>}
                  </div>
                  <div>
                    <label className="xs faint" style={{ display: 'block', marginBottom: 4 }}>Sigla *</label>
                    <input style={{ ...inp, width: 64, textTransform: 'uppercase' }} maxLength={4} {...form.register('initials')} placeholder="JS" />
                  </div>
                </div>
                <div>
                  <label className="xs faint" style={{ display: 'block', marginBottom: 4 }}>Função / Cargo *</label>
                  <input style={inp} {...form.register('role')} placeholder="Ex: Desenvolvedor Backend" />
                  {form.formState.errors.role && <div style={{ color: 'var(--danger)', fontSize: 11, marginTop: 3 }}>{form.formState.errors.role.message}</div>}
                </div>
                <div>
                  <label className="xs faint" style={{ display: 'block', marginBottom: 4 }}>Custo por hora (R$) *</label>
                  <input type="number" min={0} step={0.01} style={inp} {...form.register('hourlyCost', { valueAsNumber: true })} />
                </div>
                <div>
                  <label className="xs faint" style={{ display: 'block', marginBottom: 4 }}>Skills (separadas por vírgula)</label>
                  <input style={inp} placeholder="Ex: React, Node.js, UX"
                    value={skillsValue}
                    onChange={(e) => form.setValue('skills', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                  />
                </div>
                <div>
                  <label className="xs faint" style={{ display: 'block', marginBottom: 6 }}>Cor do avatar</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {AVATAR_COLORS.map((color, idx) => (
                      <button key={idx} type="button" onClick={() => form.setValue('avatarColor', idx)}
                        style={{ width: 26, height: 26, borderRadius: '50%', background: color, border: 'none', cursor: 'pointer',
                          outline: watchedColor === idx ? '2px solid var(--text)' : 'none', outlineOffset: 2 }} />
                    ))}
                  </div>
                </div>
                {/* Preview */}
                <div className="row" style={{ gap: 10, padding: 10, background: 'var(--surface-2)', borderRadius: 'var(--radius)' }}>
                  <Avatar initials={watchedInitials || '??'} colorIndex={watchedColor} size="lg" />
                  <div>
                    <div className="b small">{watchedName || 'Nome'}</div>
                    <div className="xs faint">{watchedRole || 'Cargo'}</div>
                  </div>
                </div>
              </div>
              <div className="row" style={{ gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn ghost" onClick={handleClose}>Cancelar</button>
                <button type="submit" className="btn primary" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
