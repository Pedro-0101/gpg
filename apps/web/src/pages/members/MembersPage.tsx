import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { KPI } from '../../components/ui/KPI';
import { Avatar } from '../../components/ui/Avatar';
import { membersApi } from '../../api/members';
import type { Project, Professional, MemberMetrics } from '../../types';

interface MembersPageProps { project: Project; }
interface MemberForm { name: string; initials: string; role: string; skills: string; avatarColor: number; }

const COLOR_LABELS = ['Roxo/Indigo', 'Rosa/Red', 'Verde/Teal', 'Laranja/Amarelo', 'Azul/Teal', 'Lilás/Rosa', 'Verde/Lime', 'Laranja/Amarelo'];

export const MembersPage: React.FC<MembersPageProps> = ({ project }) => {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Professional | null>(null);

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

  const metricsById = Object.fromEntries(metrics.map((m) => [m.memberId, m]));
  const avgLoad = metrics.length > 0 ? Math.round(metrics.reduce((a, m) => a + m.loadPercent, 0) / metrics.length) : 0;
  const avgPerf = metrics.length > 0 ? Math.round(metrics.reduce((a, m) => a + m.performance, 0) / metrics.length) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="page-head">
        <div>
          <div className="page-title">Equipe</div>
          <div className="page-sub">Visão por pessoa · clique para ver perfil</div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <div className="seg">
            <button className="seg-btn active">Cards</button>
            <button className="seg-btn">Tabela</button>
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
        <KPI label="Carga média" value={`${avgLoad}%`} sub="ocupação da equipe"
          delta={avgLoad > 85 ? { dir: 'down', text: 'Alta' } : { dir: 'flat', text: 'Normal' }} />
        <KPI label="Tarefas abertas" value={metrics.reduce((a, m) => a + m.activeTasks, 0)} sub="atribuídas" />
        <KPI label="Performance média" value={`${avgPerf}%`} sub="concluídas / total"
          delta={avgPerf >= 80 ? { dir: 'up', text: `${avgPerf}%` } : undefined} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {members.map((member, idx) => {
          const m = metricsById[member.id];
          const load = m?.loadPercent ?? 0;
          return (
            <div key={member.id} className="card" style={{ padding: 16 }}>
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
                <div className="row" style={{ gap: 4, alignSelf: 'flex-start' }}>
                  <button className="icon-btn ghost" onClick={() => openEdit(member)} title="Editar">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    className="icon-btn ghost"
                    onClick={() => window.confirm(`Remover ${member.name}?`) && deleteMutation.mutate(member.id)}
                    title="Remover"
                    style={{ color: 'var(--danger)' }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6 M14 11v6 M9 6V4h6v2" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="divider" />
              <div>
                <div className="row between">
                  <span className="xs faint">Carga esta sprint</span>
                  <span className="xs b">{load}%</span>
                </div>
                <div className="bar thick" style={{ marginTop: 4 }}>
                  <span style={{ width: `${load}%`, background: load > 85 ? 'var(--warning)' : 'var(--accent)' }} />
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

        {members.length === 0 && (
          <div style={{ gridColumn: 'span 3', padding: 32, textAlign: 'center', color: 'var(--text-3)' }}>
            Nenhum membro cadastrado.{' '}
            <button className="btn sm ghost" onClick={openCreate}>Adicionar o primeiro.</button>
          </div>
        )}
      </div>

      {/* Modal */}
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
