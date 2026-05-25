import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createProjectSchema, CreateProjectDto } from '@gpg/shared';
import { projectsApi } from '@/api/projects';
import { StatusChip } from '../../components/ui/StatusChip';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { Project } from '@/types';

const inputStyle = {
  width: '100%',
  padding: '7px 10px',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  background: 'var(--surface-2)',
  color: 'var(--text)',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box' as const,
};

export function ProjectsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      open_();
      setSearchParams({}, { replace: true });
    }
  }, []);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.list,
  });

  const form = useForm<CreateProjectDto>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: { dailyHours: 8, status: 'active' },
  });

  const saveMutation = useMutation({
    mutationFn: (data: CreateProjectDto) =>
      editing ? projectsApi.update(editing.id, data) : projectsApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['projects'] }); close(); },
  });

  const deleteMutation = useMutation({
    mutationFn: projectsApi.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });

  function open_(project?: Project) {
    if (project) {
      setEditing(project);
      form.reset({
        name: project.name,
        description: project.description ?? undefined,
        startDate: new Date(project.startDate),
        dailyHours: project.dailyHours,
        status: project.status as CreateProjectDto['status'],
      });
    } else {
      setEditing(null);
      form.reset({ dailyHours: 8, status: 'active' });
    }
    setOpen(true);
  }

  function close() { setOpen(false); setEditing(null); form.reset(); }

  function projectProgress(p: any) {
    const subs = (p.stages ?? []).flatMap((s: any) => (s.topics ?? []).flatMap((t: any) => t.subtopics ?? []));
    if (subs.length === 0) return 0;
    return Math.round((subs.filter((s: any) => s.status === 'done').length / subs.length) * 100);
  }

  const PROJECT_COLORS = ['#4F46E5', '#0EA5E9', '#10B981', '#EF4444', '#F59E0B', '#7C3AED', '#EC4899', '#06B6D4'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="page-head">
        <div>
          <div className="page-title">Projetos</div>
          <div className="page-sub">Todos os projetos do workspace</div>
        </div>
        <button className="btn primary" onClick={() => open_()}>+ Novo Projeto</button>
      </div>

      {isLoading && <div className="faint" style={{ padding: 32, textAlign: 'center' }}>Carregando...</div>}

      {/* Project cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
        {(projects as any[]).map((p, i) => {
          const pct = projectProgress(p);
          const color = p.color || PROJECT_COLORS[i % PROJECT_COLORS.length];
          return (
            <div
              key={p.id}
              className="card"
              style={{ cursor: 'pointer', transition: 'box-shadow .15s' }}
              onClick={() => navigate(`/projects/${p.id}`)}
            >
              <div style={{ padding: '16px 16px 12px' }}>
                <div className="row" style={{ gap: 12, marginBottom: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: `linear-gradient(135deg, ${color}, #7C3AED)`,
                    display: 'grid', placeItems: 'center',
                    color: 'white', fontSize: 18, fontWeight: 700,
                  }}>
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="fill" style={{ overflow: 'hidden' }}>
                    <div className="b truncate" style={{ fontSize: 15 }}>{p.name}</div>
                    {p.client && <div className="xs faint truncate">{p.client}</div>}
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <StatusChip status={p.status || 'todo'} />
                  </div>
                </div>

                {p.description && (
                  <div className="xs faint" style={{ marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {p.description}
                  </div>
                )}

                <div className="row" style={{ gap: 8, marginBottom: 8 }}>
                  <div className="bar fill">
                    <span style={{ width: `${pct}%`, background: color }} />
                  </div>
                  <span className="xs b" style={{ width: 32, textAlign: 'right' }}>{pct}%</span>
                </div>

                <div className="row" style={{ gap: 12 }}>
                  <span className="xs faint">{formatDate(p.startDate)}{p.endDate ? ` → ${formatDate(p.endDate)}` : ''}</span>
                  {p.totalBudget > 0 && (
                    <span className="xs faint" style={{ marginLeft: 'auto' }}>{formatCurrency(p.totalBudget)}</span>
                  )}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', padding: '8px 16px', display: 'flex', gap: 6, justifyContent: 'flex-end' }} onClick={(e) => e.stopPropagation()}>
                <button className="btn ghost sm" onClick={() => open_(p)}>Editar</button>
                <button
                  className="btn ghost sm"
                  style={{ color: 'var(--danger)' }}
                  onClick={() => { if (confirm('Excluir projeto e todos seus dados?')) deleteMutation.mutate(p.id); }}
                >
                  Excluir
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {!isLoading && projects.length === 0 && (
        <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-3)' }}>
          <div style={{ marginBottom: 12 }}>Nenhum projeto criado ainda.</div>
          <button className="btn primary" onClick={() => open_()}>+ Criar primeiro projeto</button>
        </div>
      )}

      {/* Modal */}
      {open && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'grid', placeItems: 'center', zIndex: 100 }}
          onClick={(e) => { if (e.target === e.currentTarget) close(); }}
        >
          <div className="card" style={{ width: 440, padding: 24 }} onClick={(e) => e.stopPropagation()}>
            <div className="card-head" style={{ marginBottom: 16 }}>
              <div className="card-title">{editing ? 'Editar Projeto' : 'Novo Projeto'}</div>
              <button className="btn ghost sm" onClick={close}>✕</button>
            </div>
            <form onSubmit={form.handleSubmit((d) => saveMutation.mutate(d))}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label className="xs faint" style={{ display: 'block', marginBottom: 4 }}>Nome *</label>
                  <input style={inputStyle} {...form.register('name')} placeholder="Nome do projeto" />
                  {form.formState.errors.name && (
                    <div style={{ color: 'var(--danger)', fontSize: 11, marginTop: 3 }}>{form.formState.errors.name.message}</div>
                  )}
                </div>
                <div>
                  <label className="xs faint" style={{ display: 'block', marginBottom: 4 }}>Descrição</label>
                  <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} {...form.register('description')} placeholder="Descrição opcional" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label className="xs faint" style={{ display: 'block', marginBottom: 4 }}>Data de início *</label>
                    <input type="date" style={inputStyle} {...form.register('startDate', { valueAsDate: true })} />
                  </div>
                  <div>
                    <label className="xs faint" style={{ display: 'block', marginBottom: 4 }}>Horas por dia</label>
                    <input type="number" min={1} max={24} style={inputStyle} {...form.register('dailyHours', { valueAsNumber: true })} />
                  </div>
                </div>
                <div>
                  <label className="xs faint" style={{ display: 'block', marginBottom: 4 }}>Status</label>
                  <select style={inputStyle} {...form.register('status')}>
                    <option value="active">Ativo</option>
                    <option value="paused">Pausado</option>
                    <option value="completed">Concluído</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
              </div>
              <div className="row" style={{ gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn ghost" onClick={close}>Cancelar</button>
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
