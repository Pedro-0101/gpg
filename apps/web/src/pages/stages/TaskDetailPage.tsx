import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { subtopicsApi } from '../../api/subtopics';
import { commentsApi } from '../../api/comments';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { StatusChip } from '../../components/ui/StatusChip';
import { Avatar, AvatarStack } from '../../components/ui/Avatar';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { formatDate } from '../../lib/utils';
import { 
  ChevronRight, 
  Clock, 
  Calendar, 
  MessageSquare, 
  Paperclip, 
  History,
  MoreVertical,
  Send
} from 'lucide-react';

export const TaskDetailPage: React.FC = () => {
  const { projectId, stageId, topicId, id: subtopicId } = useParams();

  const { data: task, isLoading } = useQuery({
    queryKey: ['subtopics', subtopicId],
    queryFn: () => subtopicsApi.get(projectId!, stageId!, topicId!, subtopicId!)
  });

  const { data: comments = [] } = useQuery({
    queryKey: ['comments', subtopicId],
    queryFn: () => commentsApi.list(projectId!, stageId!, topicId!, subtopicId!),
    enabled: !!subtopicId
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
                     <span className="chip xs outline blocked uppercase font-bold">{task.priority} PRIORITY</span>
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
               <CardHeader title="Comentários" subtitle={`${comments.length} mensagens`} />
               <CardBody className="flex flex-col gap-6">
                  <div className="flex flex-col gap-4">
                     {comments.map((c: any) => (
                        <div key={c.id} className="row items-start gap-4">
                           <Avatar initials={c.authorName.charAt(0)} size="sm" colorIndex={1} />
                           <div className="col gap-1 fill">
                              <div className="row gap-2">
                                 <span className="b small">{c.authorName}</span>
                                 <span className="xs muted">{formatDate(c.createdAt)}</span>
                              </div>
                              <div className="text-sm text-muted bg-surface-2 p-3 rounded-lg border border-border/50">
                                 {c.content}
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>

                  <div className="row gap-3 items-end border-t border-border/50 pt-6">
                     <Avatar initials="JD" size="sm" colorIndex={2} />
                     <div className="fill relative">
                        <textarea 
                          placeholder="Escreva um comentário..." 
                          className="w-full bg-surface-2 border border-border/50 rounded-lg p-3 text-sm focus:ring-1 focus:ring-accent outline-none min-h-[80px] resize-none"
                        />
                        <button className="absolute bottom-2 right-2 btn sm primary"><Send size={12} /> Enviar</button>
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
                     <span className="xs muted font-bold uppercase">Projeto</span>
                     <span className="small b hover:text-accent cursor-pointer">Zeeker App</span>
                  </div>
                  <div className="col gap-1">
                     <span className="xs muted font-bold uppercase">Etapa</span>
                     <span className="small b">Discovery</span>
                  </div>
                  <div className="col gap-1">
                     <span className="xs muted font-bold uppercase">Tópico</span>
                     <span className="small b">Pesquisa</span>
                  </div>
                  <div className="divider" />
                  <div className="col gap-1">
                     <span className="xs muted font-bold uppercase">Tipo de Tarefa</span>
                     <span className="chip outline xs w-fit">TASK</span>
                  </div>
               </CardBody>
            </Card>

            <Card>
               <CardHeader title="Anexos" subtitle="Arquivos e Links" />
               <CardBody className="flex flex-col gap-2">
                  <div className="row gap-3 p-2 border border-border/50 rounded-lg hover:bg-surface-2 cursor-pointer transition-colors">
                     <div className="w-8 h-8 rounded bg-accent/10 flex items-center justify-center text-accent">
                        <Paperclip size={16} />
                     </div>
                     <div className="col overflow-hidden">
                        <span className="small b truncate">wireframes_v2.fig</span>
                        <span className="xs muted">Figma Link</span>
                     </div>
                  </div>
                  <button className="btn sm fill mt-2"><Plus size={14} /> Anexar</button>
               </CardBody>
            </Card>

            <Card>
               <CardHeader title="Atividade" />
               <CardBody className="flex flex-col gap-4">
                  <div className="row gap-3">
                     <History size={14} className="muted" />
                     <div className="col">
                        <span className="xs text-muted"><strong>John Doe</strong> alterou o status para</span>
                        <StatusChip status="inprog" className="mt-1" />
                        <span className="xs muted mt-1">há 2 dias</span>
                     </div>
                  </div>
               </CardBody>
            </Card>
         </div>
      </div>
    </div>
  );
};

// Helper fix imports
import { Plus } from 'lucide-react';
