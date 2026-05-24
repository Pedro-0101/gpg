import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subtopicsApi } from '../../api/subtopics';
import { commentsApi } from '../../api/comments';
import { attachmentsApi } from '../../api/attachments';
import { StatusChip } from '../../components/ui/StatusChip';
import { PrioChip } from '../../components/ui/PrioChip';
import { Avatar, AvatarStack } from '../../components/ui/Avatar';
import { formatDate } from '../../lib/utils';
import type { SubtopicAttachment, SubtopicComment } from '../../types';

export const TaskDetailPage: React.FC = () => {
  const { projectId, stageId, topicId, id: subtopicId } = useParams();
  const qc = useQueryClient();
  const [commentText, setCommentText] = useState('');
  const [attachForm, setAttachForm] = useState(false);
  const [attachName, setAttachName] = useState('');
  const [attachUrl, setAttachUrl] = useState('');

  const { data: task, isLoading } = useQuery({
    queryKey: ['subtopics', subtopicId],
    queryFn: () => subtopicsApi.get(projectId!, stageId!, topicId!, subtopicId!),
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

  const inputStyle = { width: '100%', padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: 13 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Hero */}
      <div className="card" style={{ padding: 20 }}>
        {/* Breadcrumb */}
        <div className="bread" style={{ marginBottom: 14 }}>
          <Link to={`/projects/${projectId}`} className="crumb">Projeto</Link>
          <svg className="sep" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
          <Link to={`/projects/${projectId}/stages`} className="crumb">Tarefas</Link>
          <svg className="sep" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
          <span className="crumb curr">{task.name}</span>
        </div>

        {/* Title row */}
        <div className="row" style={{ gap: 8, marginBottom: 10 }}>
          <span className="chip accent xs">#{task.id.slice(-4).toUpperCase()}</span>
          <StatusChip status={task.status} />
          {task.priority && <PrioChip priority={task.priority} />}
        </div>
        <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 14 }}>{task.name}</div>

        {/* Meta strip */}
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
          <div className="col" style={{ gap: 2, marginLeft: 'auto' }}>
            <span className="xs faint">RESPONSÁVEIS</span>
            <AvatarStack>
              {(task.teams ?? []).flatMap((t: any) => t.team?.professionals ?? []).length > 0
                ? (task.teams ?? []).flatMap((t: any) => t.team?.professionals ?? []).map((tp: any) => <Avatar key={tp.professional.id} initials={tp.professional.initials} colorIndex={tp.professional.avatarColor} size="sm" />)
                : <Avatar initials="?" colorIndex={8} size="sm" />}
            </AvatarStack>
          </div>
        </div>

        {/* Progress */}
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
              {task.description || <span style={{ color: 'var(--text-3)', fontStyle: 'italic' }}>Nenhuma descrição.</span>}
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
                      <button
                        className="btn ghost sm"
                        style={{ marginLeft: 'auto', padding: '0 6px', color: 'var(--danger)' }}
                        onClick={() => deleteCommentMutation.mutate(c.id)}
                      >✕</button>
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

            {/* Compose */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
              <Avatar initials="U" size="sm" colorIndex={2} />
              <div className="fill" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <textarea
                  placeholder="Escreva um comentário... (Ctrl+Enter para enviar)"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && commentText.trim()) {
                      commentMutation.mutate(commentText.trim());
                    }
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    className="btn primary sm"
                    disabled={!commentText.trim() || commentMutation.isPending}
                    onClick={() => commentMutation.mutate(commentText.trim())}
                  >
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
              <div className="col" style={{ gap: 4 }}>
                <span className="xs faint">CRIADO EM</span>
                <span className="xs">{formatDate(task.createdAt)}</span>
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
                  <input style={inputStyle} placeholder="Nome do arquivo" value={attachName} onChange={(e) => setAttachName(e.target.value)} />
                  <input style={inputStyle} placeholder="URL ou link externo" value={attachUrl} onChange={(e) => setAttachUrl(e.target.value)} />
                  <div className="row" style={{ gap: 6, justifyContent: 'flex-end' }}>
                    <button className="btn ghost sm" onClick={() => setAttachForm(false)}>Cancelar</button>
                    <button
                      className="btn primary sm"
                      disabled={!attachName.trim() || !attachUrl.trim() || addAttachmentMutation.isPending}
                      onClick={() => addAttachmentMutation.mutate({ name: attachName.trim(), url: attachUrl.trim(), isExternal: true })}
                    >
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
