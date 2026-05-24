import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { KPI } from '../../components/ui/KPI';
import { Card, CardBody } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { membersApi } from '../../api/members';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import type { Project, TeamMember, MemberMetrics } from '../../types';

interface MembersPageProps {
  project: Project;
}

interface MemberForm {
  name: string;
  initials: string;
  role: string;
  skills: string;
  avatarColor: number;
}

const COLOR_LABELS = ['Roxo', 'Azul', 'Verde', 'Amarelo', 'Vermelho', 'Lilás'];

export const MembersPage: React.FC<MembersPageProps> = ({ project }) => {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TeamMember | null>(null);

  const { data: members = [], isLoading: loadingMembers } = useQuery<TeamMember[]>({
    queryKey: ['members', project.id],
    queryFn: () => membersApi.list(project.id),
  });

  const { data: metrics = [], isLoading: loadingMetrics } = useQuery<MemberMetrics[]>({
    queryKey: ['members', project.id, 'metrics'],
    queryFn: () => membersApi.metrics(project.id),
  });

  const { register, handleSubmit, reset, setValue, watch } = useForm<MemberForm>({
    defaultValues: { name: '', initials: '', role: '', skills: '', avatarColor: 0 },
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) =>
      editing
        ? membersApi.update(project.id, editing.id, data)
        : membersApi.create(project.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members', project.id] });
      closeDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => membersApi.remove(project.id, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members', project.id] }),
  });

  function openCreate() {
    setEditing(null);
    reset({ name: '', initials: '', role: '', skills: '', avatarColor: 0 });
    setDialogOpen(true);
  }

  function openEdit(m: TeamMember) {
    setEditing(m);
    reset({
      name: m.name,
      initials: m.initials,
      role: m.role,
      skills: m.skills.join(', '),
      avatarColor: m.avatarColor,
    });
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditing(null);
    reset();
  }

  function onSubmit(data: MemberForm) {
    saveMutation.mutate({
      name: data.name.trim(),
      initials: data.initials.trim().toUpperCase().slice(0, 4),
      role: data.role.trim(),
      skills: data.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      avatarColor: Number(data.avatarColor),
    });
  }

  // Auto-fill initials from name
  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const name = e.target.value;
    const parts = name.trim().split(' ').filter(Boolean);
    const initials = parts.slice(0, 2).map((p) => p[0]).join('').toUpperCase();
    setValue('initials', initials);
  }

  if (loadingMembers || loadingMetrics) {
    return <div className="muted p-8 text-center">Carregando equipe...</div>;
  }

  const avgLoad =
    metrics.length > 0
      ? Math.round(metrics.reduce((a, m) => a + m.loadPercent, 0) / metrics.length)
      : 0;
  const avgPerf =
    metrics.length > 0
      ? Math.round(metrics.reduce((a, m) => a + m.performance, 0) / metrics.length)
      : 0;
  const totalTasks = metrics.reduce((a, m) => a + m.activeTasks + m.completedTasks, 0);

  const metricsById = Object.fromEntries(metrics.map((m) => [m.memberId, m]));

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-4 gap-4">
        <KPI label="Pessoas Ativas" value={members.length} sub="No projeto atual" />
        <KPI
          label="Carga Média"
          value={`${avgLoad}%`}
          sub="Ocupação da equipe"
          delta={avgLoad > 85 ? { value: 'Alta', trend: 'down' } : { value: 'Normal', trend: 'flat' }}
        />
        <KPI label="Tarefas" value={totalTasks} sub="Atribuídas" />
        <KPI
          label="Performance Média"
          value={`${avgPerf}%`}
          sub="Concluídas / total"
          delta={avgPerf >= 80 ? { value: 'Boa', trend: 'up' } : undefined}
        />
      </div>

      <div className="row between">
        <h2 className="b">Membros da equipe</h2>
        <button className="btn primary sm" onClick={openCreate}>
          <Plus size={14} /> Adicionar Membro
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {members.map((member) => {
          const m = metricsById[member.id];
          return (
            <Card key={member.id} className="hover:border-accent/50 transition-colors group">
              <CardBody className="flex flex-col gap-4">
                <div className="row between">
                  <div className="row gap-3">
                    <Avatar initials={member.initials} colorIndex={member.avatarColor} size="md" />
                    <div className="col">
                      <div className="b small group-hover:text-accent transition-colors">{member.name}</div>
                      <div className="xs muted">{member.role}</div>
                    </div>
                  </div>
                  <div className="row gap-1">
                    <button className="icon-btn ghost" onClick={() => openEdit(member)}>
                      <Pencil size={13} />
                    </button>
                    <button
                      className="icon-btn ghost"
                      onClick={() => confirm(`Remover ${member.name}?`) && deleteMutation.mutate(member.id)}
                    >
                      <Trash2 size={13} className="text-danger" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {member.skills.map((skill) => (
                    <span key={skill} className="chip xs outline">{skill}</span>
                  ))}
                  {member.skills.length === 0 && <span className="xs italic muted">Sem skills</span>}
                </div>

                <div className="divider" />

                <div className="col gap-1.5">
                  <div className="row between xs font-bold uppercase tracking-wider muted">
                    <span>Carga de Trabalho</span>
                    <span style={{ color: (m?.loadPercent ?? 0) > 90 ? 'var(--danger)' : 'inherit' }}>
                      {m?.loadPercent ?? 0}%
                    </span>
                  </div>
                  <ProgressBar
                    progress={m?.loadPercent ?? 0}
                    variant="default"
                    style={(m?.loadPercent ?? 0) > 90 ? { '--bar-color': 'var(--danger)' } as React.CSSProperties : undefined}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="col">
                    <span className="xs muted uppercase">Tarefas ativas</span>
                    <span className="small b">{m?.activeTasks ?? 0}</span>
                  </div>
                  <div className="col">
                    <span className="xs muted uppercase">Concluídas</span>
                    <span className="small b">{m?.completedTasks ?? 0}</span>
                  </div>
                </div>
              </CardBody>
            </Card>
          );
        })}

        {members.length === 0 && (
          <div className="col-span-3 card p-12 text-center muted italic border-dashed">
            Nenhum membro cadastrado.{' '}
            <button className="text-accent underline" onClick={openCreate}>Adicionar o primeiro.</button>
          </div>
        )}
      </div>

      {/* Dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="card w-full max-w-md p-6 flex flex-col gap-4" style={{ background: 'var(--surface)' }}>
            <div className="row between">
              <h3 className="b">{editing ? 'Editar Membro' : 'Novo Membro'}</h3>
              <button className="icon-btn ghost" onClick={closeDialog}><X size={16} /></button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div className="col gap-1">
                <label className="xs muted font-bold uppercase">Nome completo *</label>
                <input
                  className="input"
                  placeholder="Ex: Lina Kerry"
                  {...register('name', { required: true, onChange: handleNameChange })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col gap-1">
                  <label className="xs muted font-bold uppercase">Iniciais</label>
                  <input
                    className="input"
                    placeholder="LK"
                    maxLength={4}
                    {...register('initials', { required: true })}
                  />
                </div>
                <div className="col gap-1">
                  <label className="xs muted font-bold uppercase">Cor do avatar</label>
                  <select className="input" {...register('avatarColor', { valueAsNumber: true })}>
                    {COLOR_LABELS.map((label, i) => (
                      <option key={i} value={i}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="col gap-1">
                <label className="xs muted font-bold uppercase">Cargo / Função *</label>
                <input
                  className="input"
                  placeholder="Ex: Sr. Designer, Frontend Lead"
                  {...register('role', { required: true })}
                />
              </div>

              <div className="col gap-1">
                <label className="xs muted font-bold uppercase">Skills (separadas por vírgula)</label>
                <input
                  className="input"
                  placeholder="Ex: UX, UI, React"
                  {...register('skills')}
                />
              </div>

              {/* Preview avatar */}
              <div className="row gap-3 p-3 bg-surface-2 rounded-lg">
                <Avatar initials={watch('initials') || '??'} colorIndex={watch('avatarColor') || 0} size="md" />
                <div className="col">
                  <div className="b small">{watch('name') || 'Nome do membro'}</div>
                  <div className="xs muted">{watch('role') || 'Cargo'}</div>
                </div>
              </div>

              <div className="row gap-2 justify-end pt-2 border-t border-border">
                <button type="button" className="btn ghost" onClick={closeDialog}>Cancelar</button>
                <button type="submit" disabled={saveMutation.isPending} className="btn primary">
                  <Check size={14} /> {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
