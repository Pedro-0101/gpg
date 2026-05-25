import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { Users } from 'lucide-react';
import { createTeamSchema, CreateTeamDto } from '@gpg/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { teamsApi } from '@/api/teams';
import { professionalsApi } from '@/api/professionals';
import { Project, Team } from '@/types';
import { Avatar, AvatarStack } from '../../components/ui/Avatar';
import { formatCurrency } from '@/lib/utils';

interface Props { project: Project; }

const inp: React.CSSProperties = {
  width: '100%', padding: '6px 10px',
  border: '1px solid var(--border)', borderRadius: 'var(--radius)',
  background: 'var(--surface-2)', color: 'var(--text)', fontSize: 13, outline: 'none',
};

export function TeamsPage({ project }: Props) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Team | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const { data: teams = [], isLoading } = useQuery({
    queryKey: ['teams', project.id],
    queryFn: () => teamsApi.list(project.id),
  });

  const { data: professionals = [] } = useQuery({
    queryKey: ['professionals', project.id],
    queryFn: () => professionalsApi.list(project.id),
  });

  const form = useForm<CreateTeamDto>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: { name: '', professionals: [] },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'professionals' });
  const watchedFields = form.watch('professionals');

  const saveMutation = useMutation({
    mutationFn: (data: CreateTeamDto) =>
      editing ? teamsApi.update(project.id, editing.id, data) : teamsApi.create(project.id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['teams', project.id] }); handleClose(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => teamsApi.remove(project.id, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teams', project.id] }),
  });

  function handleOpen(team?: Team) {
    if (team) {
      setEditing(team);
      form.reset({ name: team.name, professionals: team.professionals.map((tp) => ({ professionalId: tp.professionalId })) });
    } else {
      setEditing(null);
      form.reset({ name: '', professionals: [] });
    }
    setOpen(true);
  }

  function handleClose() { setOpen(false); setEditing(null); form.reset(); }

  // IDs já selecionados — para excluir do dropdown dos outros campos
  const selectedIds = watchedFields.map((f) => f.professionalId).filter(Boolean);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="page-head">
        <div>
          <div className="page-title">Equipes · {project.name}</div>
          <div className="page-sub">Grupos de profissionais. O custo/hora é a soma dos membros.</div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <div className="seg">
            <button className={`seg-btn${viewMode === 'cards' ? ' active' : ''}`} onClick={() => setViewMode('cards')}>Cards</button>
            <button className={`seg-btn${viewMode === 'table' ? ' active' : ''}`} onClick={() => setViewMode('table')}>Tabela</button>
          </div>
          <button className="btn primary" onClick={() => handleOpen()}>+ Nova Equipe</button>
        </div>
      </div>

      {professionals.length === 0 && (
        <div style={{ padding: 12, border: '1px solid var(--warning)', background: 'color-mix(in srgb, var(--warning) 10%, transparent)', borderRadius: 'var(--radius)', fontSize: 13, color: 'var(--warning)' }}>
          Cadastre profissionais primeiro em <strong>Profissionais</strong> para montar equipes.
        </div>
      )}

      {isLoading && <div className="faint" style={{ padding: 32, textAlign: 'center' }}>Carregando equipes...</div>}

      {/* ── Cards ────────────────────────────────────────── */}
      {!isLoading && viewMode === 'cards' && teams.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
          {teams.map((team) => {
            const totalCostPerHour = team.professionals.reduce((s, tp) => s + Number(tp.professional.hourlyCost), 0);
            const uniqueSkills = Array.from(new Set(team.professionals.flatMap((tp) => tp.professional.skills ?? [])));
            return (
              <div key={team.id} className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Header */}
                <div className="row between" style={{ alignItems: 'flex-start' }}>
                  <div>
                    <div className="b" style={{ fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Users size={15} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                      {team.name}
                    </div>
                    <div className="xs faint" style={{ marginTop: 2 }}>
                      {team.professionals.length} {team.professionals.length === 1 ? 'membro' : 'membros'}
                    </div>
                  </div>
                  <div className="row" style={{ gap: 4 }}>
                    <button className="icon-btn ghost" onClick={() => handleOpen(team)} title="Editar">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button className="icon-btn ghost" style={{ color: 'var(--danger)' }} title="Remover"
                      onClick={() => { if (confirm('Excluir equipe?')) deleteMutation.mutate(team.id); }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6 M14 11v6 M9 6V4h6v2" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="divider" style={{ margin: 0 }} />

                {/* Membros */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                  <span className="xs faint b">Membros</span>
                  {team.professionals.length > 0 ? team.professionals.map((tp) => (
                    <div key={tp.professionalId} className="row" style={{ gap: 8 }}>
                      <Avatar initials={tp.professional.initials} colorIndex={tp.professional.avatarColor ?? 0} size="sm" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="small b" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tp.professional.name}</div>
                        <div className="xs faint" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tp.professional.role}</div>
                      </div>
                      <span className="xs" style={{ fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{formatCurrency(Number(tp.professional.hourlyCost))}/h</span>
                    </div>
                  )) : (
                    <span className="xs faint" style={{ fontStyle: 'italic' }}>Sem membros.</span>
                  )}
                </div>

                {uniqueSkills.length > 0 && (
                  <>
                    <div className="divider" style={{ margin: 0 }} />
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {uniqueSkills.slice(0, 6).map((s) => <span key={s} className="chip purple xs">{s}</span>)}
                      {uniqueSkills.length > 6 && <span className="chip purple xs faint">+{uniqueSkills.length - 6}</span>}
                    </div>
                  </>
                )}

                <div className="divider" style={{ margin: 0 }} />
                <div className="row between" style={{ background: 'var(--surface-2)', padding: '7px 10px', borderRadius: 'var(--radius)' }}>
                  <span className="xs faint">Custo total/hora</span>
                  <span className="b" style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{formatCurrency(totalCostPerHour)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Tabela ───────────────────────────────────────── */}
      {!isLoading && viewMode === 'table' && teams.length > 0 && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Equipe</th>
                <th style={{ textAlign: 'center' }}>Membros</th>
                <th>Integrantes</th>
                <th>Skills</th>
                <th style={{ textAlign: 'right' }}>Custo/hora</th>
                <th style={{ width: 90 }} />
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => {
                const totalCostPerHour = team.professionals.reduce((s, tp) => s + Number(tp.professional.hourlyCost), 0);
                const uniqueSkills = Array.from(new Set(team.professionals.flatMap((tp) => tp.professional.skills ?? [])));
                return (
                  <tr key={team.id}>
                    <td>
                      <div className="row" style={{ gap: 6 }}>
                        <Users size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                        <span className="b">{team.name}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }} className="b">{team.professionals.length}</td>
                    <td>
                      {team.professionals.length > 0 ? (
                        <AvatarStack>
                          {team.professionals.map((tp) => (
                            <Avatar key={tp.professionalId} initials={tp.professional.initials}
                              colorIndex={tp.professional.avatarColor ?? 0} size="sm"
                              title={`${tp.professional.name} — ${tp.professional.role}`} />
                          ))}
                        </AvatarStack>
                      ) : <span className="xs faint">—</span>}
                    </td>
                    <td>
                      <div className="row" style={{ gap: 4, flexWrap: 'wrap' }}>
                        {uniqueSkills.slice(0, 4).map((s) => <span key={s} className="chip purple xs">{s}</span>)}
                        {uniqueSkills.length > 4 && <span className="chip purple xs faint">+{uniqueSkills.length - 4}</span>}
                        {uniqueSkills.length === 0 && <span className="xs faint">—</span>}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 13 }} className="b">{formatCurrency(totalCostPerHour)}</td>
                    <td>
                      <div className="row" style={{ gap: 4, justifyContent: 'flex-end' }}>
                        <button className="btn ghost sm" onClick={() => handleOpen(team)}>Editar</button>
                        <button className="btn ghost sm" style={{ color: 'var(--danger)' }}
                          onClick={() => { if (confirm('Excluir equipe?')) deleteMutation.mutate(team.id); }}>✕</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && teams.length === 0 && (
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-3)', border: '1px dashed var(--border)', borderRadius: 'var(--radius)' }}>
          <Users size={32} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
          <div>Nenhuma equipe criada.</div>
          <button className="btn primary" style={{ marginTop: 12 }} onClick={() => handleOpen()}>Criar primeira equipe</button>
        </div>
      )}

      {/* ── Modal ────────────────────────────────────────── */}
      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'grid', placeItems: 'center', zIndex: 100 }}
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}>
          <div className="card" style={{ width: 480, maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: 0 }}
            onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div className="card-head" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <div className="card-title">{editing ? 'Editar Equipe' : 'Nova Equipe'}</div>
              <button className="btn ghost sm" onClick={handleClose}>✕</button>
            </div>

            {/* Body */}
            <form onSubmit={form.handleSubmit((d) => saveMutation.mutate(d))}
              style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* Nome */}
                <div>
                  <label className="xs faint" style={{ display: 'block', marginBottom: 4 }}>Nome da equipe *</label>
                  <input style={inp} {...form.register('name')} placeholder="Ex: Equipe de Desenvolvimento" />
                  {form.formState.errors.name && (
                    <div style={{ color: 'var(--danger)', fontSize: 11, marginTop: 3 }}>{form.formState.errors.name.message}</div>
                  )}
                </div>

                {/* Membros */}
                <div>
                  <div className="row between" style={{ marginBottom: 8 }}>
                    <label className="xs faint b">Membros</label>
                    <button type="button" className="btn ghost sm"
                      onClick={() => append({ professionalId: '' })}
                      disabled={professionals.length === 0 || fields.length >= professionals.length}>
                      + Adicionar membro
                    </button>
                  </div>

                  {fields.length === 0 && (
                    <div style={{ padding: '12px 0', color: 'var(--text-3)', fontSize: 13, fontStyle: 'italic' }}>
                      Nenhum membro adicionado.
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {fields.map((field, idx) => {
                      const currentId = watchedFields[idx]?.professionalId ?? '';
                      const selectedProf = professionals.find((p) => p.id === currentId);
                      // Available: not selected in any other field
                      const available = professionals.filter(
                        (p) => p.id === currentId || !selectedIds.includes(p.id)
                      );
                      return (
                        <div key={field.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          {selectedProf && (
                            <Avatar initials={selectedProf.initials} colorIndex={selectedProf.avatarColor ?? 0} size="sm" />
                          )}
                          {!selectedProf && (
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--border)', flexShrink: 0 }} />
                          )}
                          <select style={{ ...inp, flex: 1 }}
                            value={currentId}
                            onChange={(e) => form.setValue(`professionals.${idx}.professionalId`, e.target.value)}>
                            <option value="">Selecionar profissional...</option>
                            {available.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} — {p.role} — {formatCurrency(Number(p.hourlyCost))}/h
                              </option>
                            ))}
                          </select>
                          <button type="button" className="icon-btn ghost" style={{ color: 'var(--danger)', flexShrink: 0 }}
                            onClick={() => remove(idx)}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                              <path d="M10 11v6 M14 11v6 M9 6V4h6v2" />
                            </svg>
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Custo estimado */}
                  {fields.length > 0 && (
                    <div className="row between" style={{ marginTop: 12, padding: '8px 10px', background: 'var(--surface-2)', borderRadius: 'var(--radius)' }}>
                      <span className="xs faint">Custo total/hora estimado</span>
                      <span className="b xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>
                        {formatCurrency(
                          watchedFields.reduce((s, f) => {
                            const p = professionals.find((p) => p.id === f.professionalId);
                            return s + (p ? Number(p.hourlyCost) : 0);
                          }, 0)
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="row" style={{ gap: 8, justifyContent: 'flex-end', padding: '14px 20px', borderTop: '1px solid var(--border)' }}>
                <button type="button" className="btn ghost" onClick={handleClose}>Cancelar</button>
                <button type="submit" className="btn primary" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Salvando...' : (editing ? 'Salvar alterações' : 'Criar equipe')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
