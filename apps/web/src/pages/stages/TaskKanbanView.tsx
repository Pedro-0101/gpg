import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { Avatar, AvatarStack } from '../../components/ui/Avatar';
import { PrioChip } from '../../components/ui/PrioChip';

interface TaskKanbanViewProps {
  project: any;
  stages: any[];
}

const COLS = [
  { id: 'todo',    label: 'A fazer',      dot: 'var(--text-3)' },
  { id: 'inprog',  label: 'Em progresso', dot: 'var(--accent)' },
  { id: 'review',  label: 'Em revisão',   dot: 'var(--warning)' },
  { id: 'done',    label: 'Concluída',    dot: 'var(--success)' },
  { id: 'blocked', label: 'Bloqueada',    dot: 'var(--danger)' },
];

export const TaskKanbanView: React.FC<TaskKanbanViewProps> = ({ project, stages }) => {
  const { projectId } = useParams();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {stages.map((stage) => {
        const allTasks = (stage.topics ?? []).flatMap((t: any) =>
          (t.subtopics ?? []).map((s: any) => ({ ...s, topicId: t.id, topicName: t.name })),
        );
        const totalTasks = allTasks.length;
        const donePct = totalTasks > 0 ? Math.round(allTasks.filter((t: any) => t.status === 'done').length / totalTasks * 100) : 0;

        return (
          <div key={stage.id} className="card">
            <div className="card-head" style={{ alignItems: 'center' }}>
              <div className="row">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
                <span className="chip accent xs">ETAPA</span>
                <span className="chip accent xs">{stage.name}</span>
                <span className="xs faint">{totalTasks} tarefas</span>
              </div>
              <div className="row" style={{ gap: 8 }}>
                <div className="bar" style={{ width: 100 }}>
                  <span style={{ width: `${donePct}%` }} />
                </div>
                <span className="xs b">{donePct}%</span>
              </div>
            </div>
            <div className="card-body" style={{ padding: 10 }}>
              <div className="kanban">
                {COLS.map((col) => {
                  const tasks = allTasks.filter((t: any) => t.status === col.id);
                  return (
                    <div key={col.id} className="kanban-col">
                      <div className="kanban-col-head">
                        <span className="dot" style={{ background: col.dot }} />
                        <span>{col.label}</span>
                        <span className="count">{tasks.length}</span>
                        <span className="fill" />
                        <button className="icon-btn ghost" style={{ width: 22, height: 22 }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                        </button>
                      </div>
                      <div className="kanban-col-body">
                        {tasks.map((task: any) => (
                          <Link
                            key={task.id}
                            to={`/projects/${projectId}/stages/${stage.id}/topics/${task.topicId}/subtopics/${task.id}`}
                            className="kanban-card"
                            style={{ textDecoration: 'none' }}
                          >
                            <div className="row" style={{ gap: 4, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                              <span className="chip accent xs truncate" title={task.topicName || 'Tópico'}>
                                {task.topicName || 'Tópico'}
                              </span>
                              <PrioChip priority={task.priority || 'med'} />
                            </div>
                            <div className="title">{task.name}</div>
                            {task.status === 'inprog' && task.progress != null && (
                              <div className="bar">
                                <span style={{ width: `${task.progress}%` }} />
                              </div>
                            )}
                            <div className="foot">
                              <span className="xs faint">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }}>
                                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                                </svg>
                                {task.durationHours || 0}h
                              </span>
                              <AvatarStack>
                                {(task.teams ?? []).flatMap((t: any) => t.team?.professionals ?? []).length > 0
                                  ? (task.teams ?? []).flatMap((t: any) => t.team?.professionals ?? []).map((tp: any) => (
                                    <Avatar
                                      key={tp.professional.id}
                                      initials={tp.professional.initials}
                                      colorIndex={tp.professional.avatarColor}
                                      size="sm"
                                    />
                                  ))
                                  : <Avatar initials="?" colorIndex={8} size="sm" />
                                }
                              </AvatarStack>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
