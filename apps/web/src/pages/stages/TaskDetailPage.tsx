import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
import { ChevronLeft, X } from 'lucide-react';
import type { SubtopicAttachment, SubtopicComment } from '../../types';

const inp: React.CSSProperties = {
  width: '100%', padding: '6px 10px', border: '1px solid var(--border)',
  borderRadius: 'var(--radius)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: 13, outline: 'none',
};

const STATUS_OPTIONS = [
  { value: 'todo', label: 'A fazer' },
  { value: 'inprog', label: 'Em progresso' },
  { value: 'review', label: 'Em revisão' },
  { value: 'done', label: 'Concluído' },
  { value: 'blocked', label: 'Bloqueado' },
];

const PRIO_OPTIONS = [
  { value: 'high', label: 'Alta' },
  { value: 'med', label: 'Média' },
  { value: 'low', label: 'Baixa' },
];

export const TaskDetailPage: React.FC = () => {
  const { projectId, stageId, topicId, id: subtopicId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [commentText, setCommentText] = useState('');
  const [attachForm, setAttachForm] = useState(false);
  const [attachName, setAttachName] = useState('');
  const [attachUrl, setAttachUrl] = useState('');

  // Inline edit state
  const [localName, setLocalName] = useState('');
  const [localDesc, setLocalDesc] = useState('');

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

  useEffect(() => {
    if (task) {
      setLocalName(task.name);
      setLocalDesc((task as any).description || '');
    }
  }, [task]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => subtopicsApi.update(projectId!, stageId!, topicId!, subtopicId!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subtopics', subtopicId] });
      qc.invalidateQueries({ queryKey: ['stages', projectId] });
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

  if (isLoading) return <div className="faint" style={{ padding: 32, textAlign: 'center' }}>Carregando...</div>;
  if (!task) return <div style={{ padding: 32, textAlign: 'center', color: 'var(--danger)' }}>Tarefa não encontrada.</div>;

  const professionals = (task.teams ?? []).flatMap((t: any) => t.team?.professionals ?? []);
  const taskCost = calcSubtopicCost(task);

  const handleUpdate = (field: string, value: any) => {
    if ((task as any)[field] === value) return;
    
    const updates: any = { [field]: value };
    
    // Auto-calculate progress if hours change
    if (field === 'durationHours' || field === 'spentHours') {
      const duration = field === 'durationHours' ? (parseInt(value) || 0) : task.durationHours;
      const spent = field === 'spentHours' ? (parseFloat(value) || 0) : task.spentHours;
      if (duration > 0) {
        updates.progress = Math.min(100, Math.round((spent / duration) * 100));
      } else {
        updates.progress = 0;
      }
    }
    
    updateMutation.mutate(updates);
  };

  const handleTeamToggle = (teamId: string) => {
    const currentIds = (task.teams ?? []).map((t: any) => t.teamId).filter(Boolean);
    const newIds = currentIds.includes(teamId)
      ? currentIds.filter((id: string) => id !== teamId)
      : [...currentIds, teamId];
    updateMutation.mutate({ teamIds: newIds });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Hero */}
      <div className="card" style={{ padding: 20 }}>
        <div className="row between" style={{ marginBottom: 14 }}>
          <div className="bread">
            <Link to={`/projects/${projectId}`} className="crumb">Projeto</Link>
            <svg className="sep" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            <Link to={`/projects/${projectId}/stages`} className="crumb">Tarefas</Link>
            <svg className="sep" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            <span className="crumb curr">{task.name}</span>
          </div>
          <button className="btn ghost sm" onClick={() => navigate(-1)}>
            <ChevronLeft size={14} /> Voltar
          </button>
        </div>

        <div className="row" style={{ gap: 8, marginBottom: 10 }}>
          <span className="chip accent xs">#{task.id.slice(-4).toUpperCase()}</span>
          
          <select 
            className="chip accent xs" 
            style={{ border: 'none', cursor: 'pointer', outline: 'none', fontWeight: 600 }}
            value={task.status}
            onChange={(e) => handleUpdate('status', e.target.value)}
          >
            {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>

          <select 
            className="chip accent xs" 
            style={{ border: 'none', cursor: 'pointer', outline: 'none', fontWeight: 600 }}
            value={task.priority}
            onChange={(e) => handleUpdate('priority', e.target.value)}
          >
            {PRIO_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>

        <input 
          style={{ 
            fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 14,
            width: '100%', border: 'none', background: 'transparent', outline: 'none',
            padding: 0, color: 'var(--text)'
          }}
          value={localName}
          onChange={(e) => setLocalName(e.target.value)}
          onBlur={() => handleUpdate('name', localName)}
          placeholder="Nome da tarefa"
        />

        <div className="row" style={{ gap: 20, flexWrap: 'wrap', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <div className="col" style={{ gap: 2 }}>
            <span className="xs faint">INÍCIO</span>
            <span className="small b">{task.startDate ? formatDate(task.startDate) : '—'}</span>
          </div>
          <div className="col" style={{ gap: 2 }}>
            <span className="xs faint">PRAZO CALCULADO</span>
            <span className="small b" style={{ color: task.endDate ? 'var(--text)' : 'var(--text-3)' }}>
              {task.endDate ? formatDate(task.endDate) : '—'}
            </span>
          </div>
          <div className="col" style={{ gap: 2 }}>
            <span className="xs faint">ESTIMADO</span>
            <div className="row" style={{ gap: 2 }}>
              <input 
                type="number"
                style={{ ...inp, border: 'none', padding: 0, background: 'transparent', fontWeight: 600, width: 40, textAlign: 'right' }}
                value={task.durationHours}
                onChange={(e) => handleUpdate('durationHours', e.target.value)}
              />
              <span className="small b">h</span>
            </div>
          </div>
          <div className="col" style={{ gap: 2 }}>
            <span className="xs faint">GASTO</span>
            <div className="row" style={{ gap: 2 }}>
              <input 
                type="number"
                style={{ ...inp, border: 'none', padding: 0, background: 'transparent', fontWeight: 600, width: 40, textAlign: 'right', color: 'var(--accent)' }}
                value={task.spentHours}
                onChange={(e) => handleUpdate('spentHours', e.target.value)}
              />
              <span className="small b" style={{ color: 'var(--accent)' }}>h</span>
            </div>
          </div>
          <div className="col" style={{ gap: 2 }}>
            <span className="xs faint">CUSTO PREVISTO</span>
            <span className="small b" style={{ color: taskCost > 0 ? 'var(--accent)' : 'var(--text-3)' }}>
              {taskCost > 0 ? formatCurrency(taskCost) : '—'}
            </span>
          </div>
          <div className="col" style={{ gap: 2, marginLeft: 'auto' }}>
            <span className="xs faint">RESPONSÁVEIS</span>
            <div className="row" style={{ gap: 6 }}>
              <AvatarStack>
                {professionals.length > 0
                  ? professionals.map((tp: any) => <Avatar key={tp.professional.id} initials={tp.professional.initials} colorIndex={tp.professional.avatarColor} size="sm" />)
                  : <Avatar initials="?" colorIndex={8} size="sm" />}
              </AvatarStack>
              
              <div style={{ position: 'relative' }}>
                <select 
                  className="chip purple"
                  style={{ border: 'none', cursor: 'pointer', outline: 'none', width: 30, padding: '2px 0', textAlign: 'center', fontSize: 13 }}
                  value=""
                  onChange={(e) => {
                    if (e.target.value) handleTeamToggle(e.target.value);
                    e.target.value = '';
                  }}
                >
                  <option value="">+</option>
                  {allTeams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {(task.teams || []).some((t: any) => t.teamId === team.id) ? '✓ ' : '+ '}
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {task.progress != null && (
          <div style={{ marginTop: 12 }}>
            <div className="row" style={{ marginBottom: 4 }}>
              <span className="xs faint">PROGRESSO (BASEADO EM HORAS)</span>
              <div className="row" style={{ marginLeft: 'auto', gap: 6 }}>
                <span className="xs b">{task.progress}%</span>
              </div>
            </div>
            <div className="bar thick">
              <span style={{ width: `${task.progress}%`, transition: 'width 0.3s ease' }} />
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
            <div className="card-body" style={{ padding: 0 }}>
              <textarea 
                style={{ 
                  width: '100%', minHeight: 160, border: 'none', background: 'transparent',
                  padding: 16, color: 'var(--text-2)', fontSize: 14, lineHeight: 1.6,
                  outline: 'none', resize: 'vertical'
                }}
                placeholder="Adicione uma descrição detalhada para esta tarefa..."
                value={localDesc}
                onChange={(e) => setLocalDesc(e.target.value)}
                onBlur={() => handleUpdate('description', localDesc)}
              />
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
                <select 
                  className="chip accent sm"
                  style={{ width: '100%', border: '1px solid var(--border)', cursor: 'pointer', justifyContent: 'flex-start' }}
                  value={task.status}
                  onChange={(e) => handleUpdate('status', e.target.value)}
                >
                  {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              <div className="col" style={{ gap: 4 }}>
                <span className="xs faint">PRIORIDADE</span>
                <select 
                  className="chip accent sm"
                  style={{ width: '100%', border: '1px solid var(--border)', cursor: 'pointer', justifyContent: 'flex-start' }}
                  value={task.priority}
                  onChange={(e) => handleUpdate('priority', e.target.value)}
                >
                  {PRIO_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              <div className="divider" />
              <div className="col" style={{ gap: 4 }}>
                <span className="xs faint">HORAS ESTIMADAS</span>
                <input 
                  type="number" min={1}
                  style={inp}
                  value={task.durationHours}
                  onChange={(e) => handleUpdate('durationHours', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="col" style={{ gap: 4 }}>
                <span className="xs faint">HORAS GASTAS</span>
                <input
                  type="number" min={0} step={0.5}
                  style={inp}
                  value={task.spentHours}
                  onChange={(e) => handleUpdate('spentHours', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="divider" />
              <div className="col" style={{ gap: 4 }}>
                <span className="xs faint">INÍCIO CALCULADO</span>
                <span className="small b">{task.startDate ? formatDate(task.startDate) : '—'}</span>
              </div>
              <div className="col" style={{ gap: 4 }}>
                <span className="xs faint">FIM CALCULADO</span>
                <span className="small b">{task.endDate ? formatDate(task.endDate) : '—'}</span>
              </div>
              <div className="col" style={{ gap: 4 }}>
                <span className="xs faint">CUSTO PREVISTO</span>
                <span className="small b" style={{ color: taskCost > 0 ? 'var(--accent)' : 'var(--text-3)' }}>
                  {taskCost > 0 ? formatCurrency(taskCost) : '—'}
                </span>
                {taskCost > 0 && (
                  <span className="xs faint">
                    {task.durationHours}h × R${
                      ((task.teams ?? []).reduce((s: number, st: any) =>
                        s + (st.team?.professionals ?? []).reduce((s2: number, tp: any) =>
                          s2 + Number(tp.professional?.hourlyCost ?? 0), 0), 0)
                      ).toFixed(0)
                    }/h
                  </span>
                )}
              </div>
              <div className="divider" />
              <div className="col" style={{ gap: 4 }}>
                <span className="xs faint">EQUIPES</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {(task.teams || []).map((t: any) => (
                    <span 
                      key={t.teamId} 
                      className="chip purple" 
                      style={{ cursor: 'pointer', paddingRight: 6 }}
                      onClick={() => handleTeamToggle(t.teamId)}
                      title="Clique para remover"
                    >
                      {t.team?.name || 'Equipe'} <X size={10} style={{ marginLeft: 4 }} />
                    </span>
                  ))}
                  <select 
                    className="chip accent"
                    style={{ border: '1px dashed var(--border)', cursor: 'pointer', width: 'auto' }}
                    value=""
                    onChange={(e) => {
                      if (e.target.value) handleTeamToggle(e.target.value);
                      e.target.value = '';
                    }}
                  >
                    <option value="">+ Add equipe</option>
                    {allTeams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {(task.teams || []).some((t: any) => t.teamId === team.id) ? '✓ ' : '+ '}
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
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
    </div>
  );
};
