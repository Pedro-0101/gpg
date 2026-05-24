import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createProfessionalSchema, CreateProfessionalDto } from '@gpg/shared';
import { professionalsApi } from '@/api/professionals';
import type { Project, Professional } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface Props { project: Project; }

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

const AVATAR_COLORS = ['#4f46e5','#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6'];

export function ProfessionalsPage({ project }: Props) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Professional | null>(null);

  const { data: professionals = [], isLoading } = useQuery({
    queryKey: ['professionals', project.id],
    queryFn: () => professionalsApi.list(project.id),
  });

  const form = useForm<CreateProfessionalDto>({
    resolver: zodResolver(createProfessionalSchema),
    defaultValues: { name: '', initials: '', role: '', hourlyCost: 0, skills: [], avatarColor: 0 },
  });

  const saveMutation = useMutation({
    mutationFn: (data: CreateProfessionalDto) =>
      editing
        ? professionalsApi.update(project.id, editing.id, data)
        : professionalsApi.create(project.id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['professionals', project.id] }); handleClose(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => professionalsApi.remove(project.id, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['professionals', project.id] }),
  });

  function handleOpen(p?: Professional) {
    if (p) {
      setEditing(p);
      form.reset({ name: p.name, initials: p.initials, role: p.role, hourlyCost: Number(p.hourlyCost), skills: p.skills, avatarColor: p.avatarColor });
    } else {
      setEditing(null);
      form.reset({ name: '', initials: '', role: '', hourlyCost: 0, skills: [], avatarColor: 0 });
    }
    setOpen(true);
  }

  function handleClose() { setOpen(false); setEditing(null); form.reset(); }

  const watchedColor = form.watch('avatarColor') ?? 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="page-head">
        <div>
          <div className="page-title">Profissionais · {project.name}</div>
          <div className="page-sub">Pessoas reais com função e custo por hora para composição de equipes</div>
        </div>
        <button className="btn primary" onClick={() => handleOpen()}>+ Novo Profissional</button>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {isLoading ? (
          <div className="faint" style={{ padding: 32, textAlign: 'center' }}>Carregando...</div>
        ) : professionals.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-3)' }}>
            <div style={{ marginBottom: 10 }}>Nenhum profissional cadastrado.</div>
            <button className="btn primary" onClick={() => handleOpen()}>Cadastrar profissional</button>
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Função / Cargo</th>
                <th style={{ textAlign: 'right' }}>Custo/hora</th>
                <th style={{ width: 100 }} />
              </tr>
            </thead>
            <tbody>
              {professionals.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%',
                        background: AVATAR_COLORS[p.avatarColor ?? 0],
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontWeight: 700, fontSize: 11, flexShrink: 0,
                      }}>{p.initials}</div>
                      <span className="b">{p.name}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-2)' }}>{p.role}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 13 }}>{formatCurrency(Number(p.hourlyCost))}</td>
                  <td>
                    <div className="row" style={{ gap: 4, justifyContent: 'flex-end' }}>
                      <button className="btn ghost sm" onClick={() => handleOpen(p)}>Editar</button>
                      <button className="btn ghost sm" style={{ color: 'var(--danger)' }} onClick={() => { if (confirm('Excluir este profissional?')) deleteMutation.mutate(p.id); }}>✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'grid', placeItems: 'center', zIndex: 100 }}
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}>
          <div className="card" style={{ width: 440, padding: 24 }} onClick={(e) => e.stopPropagation()}>
            <div className="card-head" style={{ marginBottom: 16 }}>
              <div className="card-title">{editing ? 'Editar Profissional' : 'Novo Profissional'}</div>
              <button className="btn ghost sm" onClick={handleClose}>✕</button>
            </div>
            <form onSubmit={form.handleSubmit((d) => saveMutation.mutate(d))}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
                  <div>
                    <label className="xs faint" style={{ display: 'block', marginBottom: 4 }}>Nome *</label>
                    <input style={inputStyle} {...form.register('name')} placeholder="Ex: João Silva" />
                    {form.formState.errors.name && <div style={{ color: 'var(--danger)', fontSize: 11, marginTop: 3 }}>{form.formState.errors.name.message}</div>}
                  </div>
                  <div>
                    <label className="xs faint" style={{ display: 'block', marginBottom: 4 }}>Sigla *</label>
                    <input style={{ ...inputStyle, width: 64, textTransform: 'uppercase' }} maxLength={4} {...form.register('initials')} placeholder="JS" />
                    {form.formState.errors.initials && <div style={{ color: 'var(--danger)', fontSize: 11, marginTop: 3 }}>{form.formState.errors.initials.message}</div>}
                  </div>
                </div>
                <div>
                  <label className="xs faint" style={{ display: 'block', marginBottom: 4 }}>Função / Cargo *</label>
                  <input style={inputStyle} {...form.register('role')} placeholder="Ex: Desenvolvedor Backend, Designer UX" />
                  {form.formState.errors.role && <div style={{ color: 'var(--danger)', fontSize: 11, marginTop: 3 }}>{form.formState.errors.role.message}</div>}
                </div>
                <div>
                  <label className="xs faint" style={{ display: 'block', marginBottom: 4 }}>Custo por hora (R$) *</label>
                  <input type="number" min={0} step={0.01} style={inputStyle} {...form.register('hourlyCost', { valueAsNumber: true })} />
                  {form.formState.errors.hourlyCost && <div style={{ color: 'var(--danger)', fontSize: 11, marginTop: 3 }}>{form.formState.errors.hourlyCost.message}</div>}
                </div>
                <div>
                  <label className="xs faint" style={{ display: 'block', marginBottom: 6 }}>Cor do avatar</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {AVATAR_COLORS.map((color, idx) => (
                      <button key={idx} type="button"
                        onClick={() => form.setValue('avatarColor', idx)}
                        style={{
                          width: 26, height: 26, borderRadius: '50%', background: color, border: 'none', cursor: 'pointer',
                          outline: watchedColor === idx ? '2px solid var(--text)' : 'none',
                          outlineOffset: 2,
                        }}
                      />
                    ))}
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
