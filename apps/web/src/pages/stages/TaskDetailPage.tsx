import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subtopicsApi } from '../../api/subtopics';
import { commentsApi } from '../../api/comments';
import { attachmentsApi } from '../../api/attachments';
import { teamsApi } from '../../api/teams';
import { StatusChip } from '../../components/ui/StatusChip';
import { PrioChip } from '../../components/ui/PrioChip';
import { Avatar, AvatarStack } from '../../components/ui/Avatar';
import { formatDate, formatCurrency } from '../../lib/utils';
import { calcSubtopicCost } from '../../lib/cost';
import type { SubtopicAttachment, SubtopicComment } from '../../types';

const inp: React.CSSProperties = {
  width: '100%', padding: '6px 10px', border: '1px solid var(--border)',
  borderRadius: 'var(--radius)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: 13,
};

const STATUS_OPTIONS = ['todo', 'inprog', 'review', 'done', 'blocked'] as const;
const PRIO_OPTIONS = ['high', 'med', 'low'] as const;
const TYPE_OPTIONS = ['task', 'milestone', 'deliverable'] as const;

export const TaskDetailPage: React.FC = () => {
  const { projectId, stageId, topicId, id: subtopicId } = useParams();
  const qc = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [attachForm, setAttachForm] = useState(false);
  const [attachName, setAttachName] = useState('');
  const [attachUrl, setAttachUrl] = useState('');

  // Edit form state
  const [eName, setEName] = useState('');
  const [eDesc, setEDesc] = useState('');
  const [eStatus, setEStatus] = useState<string>('todo');
  const [ePriority, setEPriority] = useState<string>('med');
  const [eType, setEType] = useState<string>('task');
  const [eDuration, setEDuration] = useState('');
  const [eSpent, setESpent] = useState('');
  const [eProgress, setEProgress] = useState('');
  const [eDeadline, setEDeadline] = useState('');
  const [eConcurrent, setEConcurrent] = useState(false);
  const [eTeamIds, setETeamIds] = useState<string[]>([]);

  const { data: task, isLoading } = useQuery({
    queryKey: ['subtopics', subtopicId],
    queryFn: () => subtopicsApi.get(projectId!, stageId!, topicId!, subtopicId!),
  });

  const { data: allTeams = [] } = useQuery({
    queryKey: ['teams', projectId],
    queryFn: () => teamsApi.list(projectId!),
    enabled: !!projectId,
  });

  const { data: comments = [] } = useQuery<SubtopicComment[]>({
    queryKey: ['comments', subtopicId],
    queryFn: () => commentsApi.list(projectId!, stageId!, topicId!, subtopicId!),
    enabled: !!subtopicId,
  });

  const { data: attachments = [] } = useQuery<SubtopicAttachment[]>({
    queryKey: ['attachments', subtopicId],
    queryFn: () => attachmentsApi.list(projectId!, stageId!, topicId!, subtopicId!),
    enabled: !!subtopicId,
  });

  // Populate form when task loads or edit opens
  useEffect(() => {
    if (task && editing) {
      setEName(task.name);
      setEDesc((task as any).description ?? '');
      setEStatus(task.status);
      setEPriority(task.priority ?? 'med');
      setEType((task as any).taskType ?? 'task');
      setEDuration(String(task.durationHours ?? ''));
      setESpent(String(task.spentHours ?? ''));
      setEProgress(String(task.progress ?? ''));
      setEDeadline(task.deadline ? new Date(task.deadline).toISOString().slice(0, 10) : '');
      setEConcurrent(!!(task as any).isConcurrent);
      setETeamIds((task.teams ?? []).map((t: any) => t.teamId ?? t.team?.id).filter(Boolean));
    }
  }, [task, editing]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => subtopicsApi.update(projectId!, stageId!, topicId!, subtopicId!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subtopics', subtopicId] });
      qc.invalidateQueries({ queryKey: ['stages', projectId] });
      setEditing(false);
    },
  });

  const commentMutation = useMutation({
    mutationFn: (content: string) =>
      commentsApi.create(projectId!, stageId!, topicId!, subtopicId!, { content, authorName: 'Usuário' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['comments', subtopicId] }); setCommentText(''); },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (id: string) => commentsApi.remove(projectId!, stageId!, topicId!, subtopicId!, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments', subtopicId] }),
  });

  const addAttachmentMutation = useMutation({
    mutationFn: (data: { name: string; url: string; isExternal: boolean }) =>
      attachmentsApi.create(projectId!, stageId!, topicId!, subtopicId!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attachments', subtopicId] });
      setAttachForm(false); setAttachName(''); setAttachUrl('');
    },
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: (id: string) => attachmentsApi.remove(projectId!, stageId!, topicId!, subtopicId!, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attachments', subtopicId] }),
  });

  function toggleTeam(id: string) {
    setETeamIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  function handleSave() {
    updateMutation.mutate({
      name: eName.trim(),
      description: eDesc.trim() || undefined,
      status: eStatus,
      priority: ePriority,
      taskType: eType,
      durationHours: parseInt(eDuration, 10) || 1,
      spentHours: parseFloat(eSpent) || 0,
      progress: parseInt(eProgress, 10) || 0,
      deadline: eDeadline || null,
      isConcurrent: eConcurrent,
      teamIds: eTeamIds,
    });
  }

  if (isLoading) return <div className="faint" style={{ padding: 32, textAlign: 'center' }}>Carregando...</div>;
  if (!task) return <div style={{ padding: 32, textAlign: 'center', color: 'var(--danger)' }}>Tarefa não encontrada.</div>;

  const professionals = (task.teams ?? []).flatMap((t: any) => t.team?.professionals ?? []);
  const taskCost = calcSubtopicCost(task);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Hero */}
      <div className="card" style={{ padding: 20 }}>
        <div className="bread" style={{ marginBottom: 14 }}>
          <Link to={`/projects/${projectId}`} className="crumb">Projeto</Link>
          <svg className="sep" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
          <Link to={`/projects/${projectId}/stages`} className="crumb">Tarefas</Link>
          <svg className="sep" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
          <span className="crumb curr">{task.name}</span>
        </div>

        <div className="row" style={{ gap: 8, marginBottom: 10 }}>
          <span className="chip accent xs">#{task.id.slice(-4).toUpperCase()}</span>
          <StatusChip status={task.status} />
          {task.priority && <PrioChip priority={task.priority} />}
          <button className="btn ghost sm" style={{ marginLeft: 'auto' }} onClick={() => setEditing(true)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Editar
          </button>
        </div>

        <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 14 }}>{task.name}</div>

        <div className="row" style={{ gap: 20, flexWrap: 'wrap', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <div className="col" style={{ gap: 2 }}>
            <span className="xs faint">PRAZO</span>
            <span className="small b">{task.deadline ? formatDate(task.deadline) : '—'}</span>
          </div>
          <div className="col" style={{ gap: 2 }}>
            <span className="xs faint">ESTIMADO</span>
            <span className="small b">{task.durationHours || 0}h</span>
          </div>
          <div className="col" style={{ gap: 2 }}>
            <span className="xs faint">GASTO</span>
            <span className="small b" style={{ color: 'var(--accent)' }}>{task.spentHours || 0}h</span>
          </div>
          <div className="col" style={{ gap: 2 }}>
            <span className="xs faint">CUSTO PREVISTO</span>
            <span className="small b" style={{ color: taskCost > 0 ? 'var(--accent)' : 'var(--text-3)' }}>
              {taskCost > 0 ? formatCurrency(taskCost) : '—'}
            </span>
          </div>
          <div className="col" style={{ gap: 2, marginLeft: 'auto' }}>
            <span className="xs faint">RESPONSÁVEIS</span>
            <AvatarStack>
              {professionals.length > 0
                ? professionals.map((tp: any) => <Avatar key={tp.professional.id} initials={tp.professional.initials} colorIndex={tp.professional.avatarColor} size="sm" />)
                : <Avatar initials="?" colorIndex={8} size="sm" />}
            </AvatarStack>
          </div>
        </div>

        {task.progress != null && (
          <div style={{ marginTop: 12 }}>
            <div className="row" style={{ marginBottom: 4 }}>
              <span className="xs faint">PROGRESSO</span>
              <span className="xs b" style={{ marginLeft: 'auto' }}>{task.progress}%</span>
            </div>
            <div className="bar thick">
              <span style={{ width: `${task.progress}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Body grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 12, alignItems: 'start' }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Description */}
          <div className="card">
            <div className="card-head"><div className="card-title">Descrição</div></div>
            <div className="card-body" style={{ color: 'var(--text-2)', fontSize: 14, lineHeight: 1.6 }}>
              {(task as any).description || <span style={{ color: 'var(--text-3)', fontStyle: 'italic' }}>Nenhuma descrição.</span>}
            </div>
          </div>

          {/* Comments */}
          <div className="card">
            <div className="card-head">
              <div className="card-title">Comentários <span className="card-sub">{comments.length}</span></div>
            </div>
            <div className="card-body flush">
              {(comments as SubtopicComment[]).map((c) => (
                <div key={c.id} className="list-item" style={{ alignItems: 'flex-start', gap: 10 }}>
                  <Avatar initials={c.authorName.charAt(0)} size="sm" colorIndex={1} />
                  <div className="fill">
                    <div className="row" style={{ gap: 8, marginBottom: 4 }}>
                      <span className="b small">{c.authorName}</span>
                      <span className="xs faint">{formatDate(c.createdAt)}</span>
                      <button className="btn ghost sm" style={{ marginLeft: 'auto', padding: '0 6px', color: 'var(--danger)' }} onClick={() => deleteCommentMutation.mutate(c.id)}>✕</button>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-2)', background: 'var(--surface-2)', padding: '8px 10px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                      {c.content}
                    </div>
                  </div>
                </div>
              ))}
              {comments.length === 0 && (
                <div style={{ padding: '12px 16px', color: 'var(--text-3)', fontSize: 13, fontStyle: 'italic' }}>Nenhum comentário ainda.</div>
              )}
            </div>
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
              <Avatar initials="U" size="sm" colorIndex={2} />
              <div className="fill" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <textarea
                  placeholder="Escreva um comentário... (Ctrl+Enter para enviar)"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  style={{ ...inp, minHeight: 60, resize: 'vertical' }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && commentText.trim()) {
                      commentMutation.mutate(commentText.trim());
                    }
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn primary sm" disabled={!commentText.trim() || commentMutation.isPending} onClick={() => commentMutation.mutate(commentText.trim())}>
                    {commentMutation.isPending ? '...' : 'Enviar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Properties */}
          <div className="card">
            <div className="card-head"><div className="card-title">Propriedades</div></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="col" style={{ gap: 4 }}>
                <span className="xs faint">STATUS</span>
                <StatusChip status={task.status} />
              </div>
              {task.priority && (
                <div className="col" style={{ gap: 4 }}>
                  <span className="xs faint">PRIORIDADE</span>
                  <PrioChip priority={task.priority} />
                </div>
              )}
              <div className="divider" />
              <div className="col" style={{ gap: 4 }}>
                <span className="xs faint">HORAS ESTIMADAS</span>
                <span className="small b">{task.durationHours || 0}h</span>
              </div>
              <div className="col" style={{ gap: 4 }}>
                <span className="xs faint">HORAS GASTAS</span>
                <span className="small b" style={{ color: 'var(--accent)' }}>{task.spentHours || 0}h</span>
              </div>
              <div className="divider" />
              <div className="col" style={{ gap: 4 }}>
                <span className="xs faint">CUSTO PREVISTO</span>
                <span className="small b" style={{ color: taskCost > 0 ? 'var(--accent)' : 'var(--text-3)' }}>
                  {taskCost > 0 ? formatCurrency(taskCost) : '—'}
                </span>
                {taskCost > 0 && (
                  <span className="xs faint">{task.durationHours}h × R${
                    ((task.teams ?? []).reduce((s: number, st: any) =>
                      s + (st.team?.professionals ?? []).reduce((s2: number, tp: any) =>
                        s2 + Number(tp.professional?.hourlyCost ?? 0), 0), 0)
                    ).toFixed(0)
                  }/h</span>
                )}
              </div>
              <div className="col" style={{ gap: 4 }}>
                <span className="xs faint">CRIADO EM</span>
                <span className="xs">{formatDate(task.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Teams */}
          <div className="card">
            <div className="card-head">
              <div className="card-title">Equipes</div>
              <button className="btn ghost sm" onClick={() => setEditing(true)}>+ Editar</button>
            </div>
            <div className="card-body flush">
              {(task.teams ?? []).length === 0 ? (
                <div style={{ padding: '12px 16px', color: 'var(--text-3)', fontSize: 13, fontStyle: 'italic' }}>Nenhuma equipe.</div>
              ) : (task.teams ?? []).map((t: any) => {
                const team = t.team;
                if (!team) return null;
                return (
                  <div key={team.id} className="list-item" style={{ gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--accent-soft)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    </div>
                    <div className="fill col" style={{ gap: 2 }}>
                      <span className="small b">{team.name}</span>
                      <span className="xs faint">{team.professionals?.length ?? 0} profissional(is)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Attachments */}
          <div className="card">
            <div className="card-head">
              <div className="card-title">Anexos <span className="card-sub">{attachments.length}</span></div>
              <button className="btn ghost sm" onClick={() => setAttachForm((v) => !v)}>+ Anexar</button>
            </div>
            <div className="card-body flush">
              {attachForm && (
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <input style={inp} placeholder="Nome do arquivo" value={attachName} onChange={(e) => setAttachName(e.target.value)} />
                  <input style={inp} placeholder="URL ou link externo" value={attachUrl} onChange={(e) => setAttachUrl(e.target.value)} />
                  <div className="row" style={{ gap: 6, justifyContent: 'flex-end' }}>
                    <button className="btn ghost sm" onClick={() => setAttachForm(false)}>Cancelar</button>
                    <button className="btn primary sm" disabled={!attachName.trim() || !attachUrl.trim() || addAttachmentMutation.isPending} onClick={() => addAttachmentMutation.mutate({ name: attachName.trim(), url: attachUrl.trim(), isExternal: true })}>
                      {addAttachmentMutation.isPending ? '...' : 'Salvar'}
                    </button>
                  </div>
                </div>
              )}
              {(attachments as SubtopicAttachment[]).map((a) => (
                <div key={a.id} className="list-item" style={{ gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--accent-soft)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                  </div>
                  <div className="fill col" style={{ gap: 2, overflow: 'hidden' }}>
                    <span className="small b truncate">{a.name}</span>
                    <span className="xs faint">{a.isExternal ? 'Link externo' : 'Arquivo'}</span>
                  </div>
                  <div className="row" style={{ gap: 4, flexShrink: 0 }}>
                    <a href={a.url} target="_blank" rel="noopener noreferrer" className="btn ghost sm" style={{ padding: '2px 6px', fontSize: 11 }}>↗</a>
                    <button className="btn ghost sm" style={{ padding: '2px 6px', fontSize: 11, color: 'var(--danger)' }} onClick={() => deleteAttachmentMutation.mutate(a.id)}>✕</button>
                  </div>
                </div>
              ))}
              {attachments.length === 0 && !attachForm && (
                <div style={{ padding: '12px 16px', color: 'var(--text-3)', fontSize: 13, fontStyle: 'italic' }}>Nenhum anexo.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={(e) => { if (e.target === e.currentTarget) setEditing(false); }}
        >
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', width: '100%', maxWidth: 620, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            {/* Modal header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <span style={{ fontWeight: 600, fontSize: 15 }}>Editar tarefa</span>
              <button className="icon-btn ghost" onClick={() => setEditing(false)}>✕</button>
            </div>

            {/* Modal body */}
            <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Name */}
              <div>
                <label className="xs faint" style={{ display: 'block', marginBottom: 4 }}>Nome *</label>
                <input style={inp} value={eName} onChange={(e) => setEName(e.target.value)} />
              </div>

              {/* Description */}
              <div>
                <label className="xs faint" style={{ display: 'block', marginBottom: 4 }}>Descrição</label>
                <textarea style={{ ...inp, minHeight: 72, resize: 'vertical' }} value={eDesc} onChange={(e) => setEDesc(e.target.value)} />
              </div>

              {/* Status / Priority / Type */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div>
                  <label className="xs faint" style={{ display: 'block', marginBottom: 4 }}>Status</label>
                  <select style={inp} value={eStatus} onChange={(e) => setEStatus(e.target.value)}>
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="xs faint" style={{ display: 'block', marginBottom: 4 }}>Prioridade</label>
                  <select style={inp} value={ePriority} onChange={(e) => setEPriority(e.target.value)}>
                    {PRIO_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="xs faint" style={{ display: 'block', marginBottom: 4 }}>Tipo</label>
                  <select style={inp} value={eType} onChange={(e) => setEType(e.target.value)}>
                    {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* Hours / Progress / Deadline */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
                <div>
                  <label className="xs faint" style={{ display: 'block', marginBottom: 4 }}>Horas estimadas</label>
                  <input type="number" min={1} style={inp} value={eDuration} onChange={(e) => setEDuration(e.target.value)} />
                </div>
                <div>
                  <label className="xs faint" style={{ display: 'block', marginBottom: 4 }}>Horas gastas</label>
                  <input type="number" min={0} step={0.5} style={inp} value={eSpent} onChange={(e) => setESpent(e.target.value)} />
                </div>
                <div>
                  <label className="xs faint" style={{ display: 'block', marginBottom: 4 }}>Progresso %</label>
                  <input type="number" min={0} max={100} style={inp} value={eProgress} onChange={(e) => setEProgress(e.target.value)} />
                </div>
                <div>
                  <label className="xs faint" style={{ display: 'block', marginBottom: 4 }}>Prazo</label>
                  <input type="date" style={inp} value={eDeadline} onChange={(e) => setEDeadline(e.target.value)} />
                </div>
              </div>

              {/* Concurrent */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                <input type="checkbox" checked={eConcurrent} onChange={(e) => setEConcurrent(e.target.checked)} style={{ width: 14, height: 14 }} />
                <span>Concomitante (executa em paralelo com tarefas anteriores)</span>
              </label>

              {/* Teams */}
              <div>
                <label className="xs faint" style={{ display: 'block', marginBottom: 8 }}>Equipes responsáveis</label>
                {(allTeams as any[]).length === 0 ? (
                  <div className="xs faint" style={{ fontStyle: 'italic' }}>Nenhuma equipe cadastrada no projeto.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '6px 4px' }}>
                    {(allTeams as any[]).map((team: any) => {
                      const checked = eTeamIds.includes(team.id);
                      const profCount = team.professionals?.length ?? 0;
                      return (
                        <label
                          key={team.id}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', borderRadius: 'var(--radius)', cursor: 'pointer', background: checked ? 'var(--accent-soft)' : 'transparent' }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleTeam(team.id)}
                            style={{ width: 14, height: 14, flexShrink: 0 }}
                          />
                          <span className="small b fill">{team.name}</span>
                          {profCount > 0 && (
                            <span className="xs faint">{profCount} profissional{profCount !== 1 ? 'is' : ''}</span>
                          )}
                          {team.totalCostPerHour > 0 && (
                            <span className="xs faint mono">R${Number(team.totalCostPerHour).toFixed(0)}/h</span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Modal footer */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 8, flexShrink: 0 }}>
              <button className="btn ghost" onClick={() => setEditing(false)}>Cancelar</button>
              <button className="btn primary" disabled={!eName.trim() || updateMutation.isPending} onClick={handleSave}>
                {updateMutation.isPending ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
