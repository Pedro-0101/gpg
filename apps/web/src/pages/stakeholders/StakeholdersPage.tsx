import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createStakeholderSchema, CreateStakeholderDto } from '@gpg/shared';
import { stakeholdersApi } from '@/api/stakeholders';
import type { Project, Stakeholder } from '@/types';

interface Props { project: Project; }

const engagementLabel: Record<string, string> = {
  unaware: 'Desinformado',
  resistant: 'Resistente',
  neutral: 'Neutro',
  supportive: 'Apoiador',
  leading: 'Líder',
};

const engagementClass: Record<string, string> = {
  unaware: 'chip outline xs',
  resistant: 'chip high xs',
  neutral: 'chip outline xs',
  supportive: 'chip done xs',
  leading: 'chip accent xs',
};

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

export function StakeholdersPage({ project }: Props) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Stakeholder | null>(null);

  const { data: stakeholders = [], isLoading } = useQuery({
    queryKey: ['stakeholders', project.id],
    queryFn: () => stakeholdersApi.list(project.id),
  });

  const form = useForm<CreateStakeholderDto>({
    resolver: zodResolver(createStakeholderSchema),
    defaultValues: { type: 'external', influence: 3, interest: 3, engagementLevel: 'neutral' },
  });

  const saveMutation = useMutation({
    mutationFn: (data: CreateStakeholderDto) =>
      editing
        ? stakeholdersApi.update(project.id, editing.id, data)
        : stakeholdersApi.create(project.id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['stakeholders', project.id] }); handleClose(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => stakeholdersApi.remove(project.id, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stakeholders', project.id] }),
  });

  function handleOpen(s?: Stakeholder) {
    if (s) {
      setEditing(s);
      form.reset({
        name: s.name,
        role: s.role ?? undefined,
        organization: s.organization ?? undefined,
        type: s.type as 'internal' | 'external',
        influence: s.influence,
        interest: s.interest,
        engagementLevel: s.engagementLevel as CreateStakeholderDto['engagementLevel'],
        contactInfo: s.contactInfo ?? undefined,
      });
    } else {
      setEditing(null);
      form.reset({ type: 'external', influence: 3, interest: 3, engagementLevel: 'neutral' });
    }
    setOpen(true);
  }

  function handleClose() { setOpen(false); setEditing(null); form.reset(); }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="page-head">
        <div>
          <div className="page-title">Stakeholders · {project.name}</div>
          <div className="page-sub">Partes interessadas com influência e interesse no projeto</div>
        </div>
        <button className="btn primary" onClick={() => handleOpen()}>+ Novo Stakeholder</button>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {isLoading ? (
          <div className="faint" style={{ padding: 32, textAlign: 'center' }}>Carregando...</div>
        ) : (stakeholders as Stakeholder[]).length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-3)' }}>
            <div style={{ marginBottom: 10 }}>Nenhum stakeholder cadastrado.</div>
            <button className="btn primary" onClick={() => handleOpen()}>Adicionar stakeholder</button>
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Função / Organização</th>
                <th>Tipo</th>
                <th>Influência</th>
                <th>Interesse</th>
                <th>Engajamento</th>
                <th style={{ width: 80 }} />
              </tr>
            </thead>
            <tbody>
              {(stakeholders as Stakeholder[]).map((s) => (
                <tr key={s.id}>
                  <td className="b">{s.name}</td>
                  <td className="faint xs">{[s.role, s.organization].filter(Boolean).join(' / ') || '—'}</td>
                  <td>
                    <span className={`chip xs ${s.type === 'internal' ? 'accent' : 'outline'}`}>
                      {s.type === 'internal' ? 'Interno' : 'Externo'}
                    </span>
                  </td>
                  <td><DotsBar value={s.influence} /></td>
                  <td><DotsBar value={s.interest} /></td>
                  <td>
                    <span className={engagementClass[s.engagementLevel] ?? 'chip xs outline'}>
                      {engagementLabel[s.engagementLevel] ?? s.engagementLevel}
                    </span>
                  </td>
                  <td>
                    <div className="row" style={{ gap: 4, justifyContent: 'flex-end' }}>
                      <button className="btn ghost sm" onClick={() => handleOpen(s)}>Editar</button>
                      <button className="btn ghost sm" style={{ color: 'var(--danger)' }} onClick={() => { if (confirm('Excluir stakeholder?')) deleteMutation.mutate(s.id); }}>✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'grid', placeItems: 'center', zIndex: 100 }}
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}>
          <div className="card" style={{ width: 480, padding: 24 }} onClick={(e) => e.stopPropagation()}>
            <div className="card-head" style={{ marginBottom: 16 }}>
              <div className="card-title">{editing ? 'Editar Stakeholder' : 'Novo Stakeholder'}</div>
              <button className="btn ghost sm" onClick={handleClose}>✕</button>
            </div>
            <form onSubmit={form.handleSubmit((d) => saveMutation.mutate(d))}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="xs faint" style={{ display: 'block', marginBottom: 4 }}>Nome *</label>
                  <input style={inputStyle} {...form.register('name')} placeholder="Nome completo" />
                  {form.formState.errors.name && <div style={{ color: 'var(--danger)', fontSize: 11, marginTop: 3 }}>{form.formState.errors.name.message}</div>}
                </div>
                <div>
                  <label className="xs faint" style={{ display: 'block', marginBottom: 4 }}>Função / Cargo</label>
                  <input style={inputStyle} {...form.register('role')} placeholder="Ex: Diretor de TI" />
                </div>
                <div>
                  <label className="xs faint" style={{ display: 'block', marginBottom: 4 }}>Organização</label>
                  <input style={inputStyle} {...form.register('organization')} placeholder="Ex: Empresa XYZ" />
                </div>
                <div>
                  <label className="xs faint" style={{ display: 'block', marginBottom: 4 }}>Contato</label>
                  <input style={inputStyle} {...form.register('contactInfo')} placeholder="Email ou telefone" />
                </div>
                <div>
                  <label className="xs faint" style={{ display: 'block', marginBottom: 4 }}>Tipo</label>
                  <select style={inputStyle} {...form.register('type')}>
                    <option value="internal">Interno</option>
                    <option value="external">Externo</option>
                  </select>
                </div>
                <div>
                  <label className="xs faint" style={{ display: 'block', marginBottom: 4 }}>Engajamento</label>
                  <select style={inputStyle} {...form.register('engagementLevel')}>
                    {Object.entries(engagementLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="xs faint" style={{ display: 'block', marginBottom: 4 }}>Influência (1–5)</label>
                  <input type="number" min={1} max={5} style={inputStyle} {...form.register('influence', { valueAsNumber: true })} />
                </div>
                <div>
                  <label className="xs faint" style={{ display: 'block', marginBottom: 4 }}>Interesse (1–5)</label>
                  <input type="number" min={1} max={5} style={inputStyle} {...form.register('interest', { valueAsNumber: true })} />
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

function DotsBar({ value }: { value: number }) {
  return (
    <div className="row" style={{ gap: 3 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i < value ? 'var(--accent)' : 'var(--border-strong)' }} />
      ))}
    </div>
  );
}
