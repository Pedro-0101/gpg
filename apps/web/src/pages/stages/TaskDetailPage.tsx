import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ChevronRight, Clock, Calendar, MessageSquare, Paperclip, History, MoreVertical, Send, Trash2, ExternalLink } from 'lucide-react';
import { subtopicsApi } from '../../api/subtopics';
import { commentsApi } from '../../api/comments';
import { attachmentsApi } from '../../api/attachments';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { StatusChip } from '../../components/ui/StatusChip';
import { PrioChip } from '../../components/ui/PrioChip';
import { Avatar, AvatarStack } from '../../components/ui/Avatar';
import { ProgressBar } from '../../components/ui/ProgressBar';
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
      commentsApi.create(projectId!, stageId!, topicId!, subtopicId!, {
        content,
        authorName: 'Usuário',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', subtopicId] });
      setCommentText('');
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (id: string) =>
      commentsApi.remove(projectId!, stageId!, topicId!, subtopicId!, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments', subtopicId] }),
  });

  const addAttachmentMutation = useMutation({
    mutationFn: (data: { name: string; url: string; isExternal: boolean }) =>
      attachmentsApi.create(projectId!, stageId!, topicId!, subtopicId!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attachments', subtopicId] });
      setAttachForm(false);
      setAttachName('');
      setAttachUrl('');
    },
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: (id: string) =>
      attachmentsApi.remove(projectId!, stageId!, topicId!, subtopicId!, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attachments', subtopicId] }),
  });

  if (isLoading) return <div className="muted p-8 text-center">Carregando detalhes da tarefa...</div>;
  if (!task) return <div className="p-8 text-center text-danger">Tarefa não encontrada.</div>;

  return (
    <div className="flex flex-col gap-6">
      {/* Hero Header */}
      <section className="card p-6 bg-surface">
        <div className="flex flex-col gap-4">
          <div className="bread">
            <Link to={`/projects/${projectId}`} className="crumb">Projeto</Link>
            <ChevronRight size={14} className="sep" />
            <Link to={`/projects/${projectId}/stages`} className="crumb">Tarefas</Link>
            <ChevronRight size={14} className="sep" />
            <span className="crumb curr">{task.name}</span>
          </div>

          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-2">
              <div className="row gap-2">
                <span className="chip outline xs mono uppercase tracking-tighter">#{task.id.slice(-4)}</span>
                <StatusChip status={task.status} />
                {task.priority && <PrioChip priority={task.priority} />}
              </div>
              <h1 className="text-3xl font-bold tracking-tight">{task.name}</h1>
            </div>
            <div className="row gap-2">
              <button className="btn"><MoreVertical size={16} /></button>
              <button className="btn primary">Editar Tarefa</button>
            </div>
          </div>

          <div className="divider" />

          <div className="row gap-8">
            <div className="row gap-2">
              <span className="xs muted font-bold uppercase">Prazo</span>
              <div className="row gap-1 b small"><Calendar size={14} className="muted" /> {task.deadline ? formatDate(task.deadline) : 'Sem prazo'}</div>
            </div>
            <div className="row gap-2">
              <span className="xs muted font-bold uppercase">Estimado</span>
              <div className="row gap-1 b small"><Clock size={14} className="muted" /> {task.durationHours}h</div>
            </div>
            <div className="row gap-2">
              <span className="xs muted font-bold uppercase">Gasto</span>
              <div className="row gap-1 b small text-accent"><Clock size={14} /> {task.spentHours || 0}h</div>
            </div>
            <div className="row gap-2 ml-auto">
              <span className="xs muted font-bold uppercase">Responsáveis</span>
              <AvatarStack>
                {task.assignments?.map((a: any) => (
                  <Avatar key={a.member.id} initials={a.member.initials} colorIndex={a.member.avatarColor} size="sm" />
                ))}
                {(!task.assignments || task.assignments.length === 0) && (
                  <Avatar initials="?" colorIndex={8} size="sm" />
                )}
              </AvatarStack>
            </div>
          </div>

          <div className="col gap-2 mt-2">
            <div className="row between xs muted font-bold uppercase tracking-wider">
              <span>Progresso da Tarefa</span>
              <span>{task.progress}%</span>
            </div>
            <ProgressBar progress={task.progress} className="thick" />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-3 gap-8">
        {/* Main Content (2/3) */}
        <div className="col-span-2 flex flex-col gap-6">
          <Card>
            <CardHeader title="Descrição" />
            <CardBody className="prose prose-sm max-w-none text-muted text-md leading-relaxed">
              {task.description || 'Nenhuma descrição fornecida para esta tarefa.'}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Subtarefas" subtitle="Checklist de atividades">
              <button className="btn sm ghost"><Plus size={14} /> Adicionar</button>
            </CardHeader>
            <CardBody className="flex flex-col gap-2">
              <div className="muted italic text-center py-4 xs">Recurso em desenvolvimento.</div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Comentários" subtitle={`${comments.length} mensagem${comments.length !== 1 ? 's' : ''}`}>
              <MessageSquare size={14} className="muted" />
            </CardHeader>
            <CardBody className="flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                {comments.map((c: SubtopicComment) => (
                  <div key={c.id} className="row items-start gap-4 group">
                    <Avatar initials={c.authorName.charAt(0)} size="sm" colorIndex={1} />
                    <div className="col gap-1 fill">
                      <div className="row between">
                        <div className="row gap-2">
                          <span className="b small">{c.authorName}</span>
                          <span className="xs muted">{formatDate(c.createdAt)}</span>
                        </div>
                        <button
                          className="icon-btn ghost opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => deleteCommentMutation.mutate(c.id)}
                        >
                          <Trash2 size={12} className="text-danger" />
                        </button>
                      </div>
                      <div className="text-sm text-muted bg-surface-2 p-3 rounded-lg border border-border/50">
                        {c.content}
                      </div>
                    </div>
                  </div>
                ))}
                {comments.length === 0 && (
                  <div className="xs muted italic text-center py-4">Nenhum comentário ainda.</div>
                )}
              </div>

              <div className="row gap-3 items-end border-t border-border/50 pt-6">
                <Avatar initials="U" size="sm" colorIndex={2} />
                <div className="fill relative">
                  <textarea
                    placeholder="Escreva um comentário..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="w-full bg-surface-2 border border-border/50 rounded-lg p-3 text-sm focus:ring-1 focus:ring-accent outline-none min-h-[80px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && commentText.trim()) {
                        commentMutation.mutate(commentText.trim());
                      }
                    }}
                  />
                  <button
                    className="absolute bottom-2 right-2 btn sm primary"
                    disabled={!commentText.trim() || commentMutation.isPending}
                    onClick={() => commentMutation.mutate(commentText.trim())}
                  >
                    <Send size={12} /> {commentMutation.isPending ? '...' : 'Enviar'}
                  </button>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Sidebar (1/3) */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader title="Propriedades" />
            <CardBody className="flex flex-col gap-4">
              <div className="col gap-1">
                <span className="xs muted font-bold uppercase">Tipo de Tarefa</span>
                <span className="chip outline xs w-fit uppercase">{task.taskType || 'TASK'}</span>
              </div>
              {task.priority && (
                <div className="col gap-1">
                  <span className="xs muted font-bold uppercase">Prioridade</span>
                  <PrioChip priority={task.priority} />
                </div>
              )}
              <div className="divider" />
              <div className="col gap-1">
                <span className="xs muted font-bold uppercase">Horas estimadas</span>
                <span className="small b">{task.durationHours}h</span>
              </div>
              <div className="col gap-1">
                <span className="xs muted font-bold uppercase">Horas gastas</span>
                <span className="small b text-accent">{task.spentHours || 0}h</span>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Anexos" subtitle={`${attachments.length} arquivo${attachments.length !== 1 ? 's' : ''}`}>
              <button className="btn sm ghost" onClick={() => setAttachForm((v) => !v)}>
                <Paperclip size={13} /> Anexar
              </button>
            </CardHeader>
            <CardBody className="flex flex-col gap-2">
              {attachForm && (
                <div className="flex flex-col gap-2 p-3 bg-surface-2 rounded-lg border border-border/50 mb-2">
                  <input
                    className="input"
                    placeholder="Nome do arquivo"
                    value={attachName}
                    onChange={(e) => setAttachName(e.target.value)}
                  />
                  <input
                    className="input"
                    placeholder="URL ou link externo"
                    value={attachUrl}
                    onChange={(e) => setAttachUrl(e.target.value)}
                  />
                  <div className="row gap-2 justify-end">
                    <button className="btn sm ghost" onClick={() => setAttachForm(false)}>Cancelar</button>
                    <button
                      className="btn sm primary"
                      disabled={!attachName.trim() || !attachUrl.trim() || addAttachmentMutation.isPending}
                      onClick={() =>
                        addAttachmentMutation.mutate({
                          name: attachName.trim(),
                          url: attachUrl.trim(),
                          isExternal: true,
                        })
                      }
                    >
                      {addAttachmentMutation.isPending ? '...' : 'Salvar'}
                    </button>
                  </div>
                </div>
              )}

              {attachments.map((a: SubtopicAttachment) => (
                <div key={a.id} className="row gap-3 p-2 border border-border/50 rounded-lg hover:bg-surface-2 transition-colors group">
                  <div className="w-8 h-8 rounded bg-accent/10 flex items-center justify-center text-accent flex-shrink-0">
                    <Paperclip size={14} />
                  </div>
                  <div className="col overflow-hidden fill">
                    <span className="small b truncate">{a.name}</span>
                    <span className="xs muted">{a.mimeType || (a.isExternal ? 'Link externo' : 'Arquivo')}</span>
                  </div>
                  <div className="row gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a href={a.url} target="_blank" rel="noopener noreferrer" className="icon-btn ghost">
                      <ExternalLink size={12} />
                    </a>
                    <button
                      className="icon-btn ghost"
                      onClick={() => deleteAttachmentMutation.mutate(a.id)}
                    >
                      <Trash2 size={12} className="text-danger" />
                    </button>
                  </div>
                </div>
              ))}

              {attachments.length === 0 && !attachForm && (
                <div className="xs muted italic text-center py-4">Nenhum anexo ainda.</div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Atividade" />
            <CardBody className="flex flex-col gap-4">
              <div className="row gap-3">
                <History size={14} className="muted" />
                <div className="col">
                  <span className="xs text-muted">Criado em</span>
                  <span className="xs muted mt-1">{formatDate(task.createdAt)}</span>
                </div>
              </div>
              {task.updatedAt && task.updatedAt !== task.createdAt && (
                <div className="row gap-3">
                  <History size={14} className="muted" />
                  <div className="col">
                    <span className="xs text-muted">Última atualização</span>
                    <span className="xs muted mt-1">{formatDate(task.updatedAt)}</span>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};
