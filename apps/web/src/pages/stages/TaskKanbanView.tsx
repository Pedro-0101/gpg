import React, { useState, useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Avatar, AvatarStack } from '../../components/ui/Avatar';
import { PrioChip } from '../../components/ui/PrioChip';
import { subtopicsApi } from '../../api/subtopics';

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

export const TaskKanbanView: React.FC<TaskKanbanViewProps> = ({ project, stages: initialStages }) => {
  const { projectId } = useParams();
  const qc = useQueryClient();

  // Local state to keep UI 100% fluid and independent of refetches
  const [localStages, setLocalStages] = useState(initialStages);

  // Sync with props when they change (but only when not dragging/mutating ideally)
  useEffect(() => {
    setLocalStages(initialStages);
  }, [initialStages]);

  const updateMutation = useMutation({
    mutationFn: ({ sid, tid, id, data }: { sid: string; tid: string; id: string; data: any }) =>
      subtopicsApi.update(projectId!, sid, tid, id, data),
    onMutate: async (newUpdate) => {
      // Snapshot the previous value
      const previousStages = localStages;

      // Optimistically update the LOCAL state immediately
      setLocalStages(old => {
        return old.map(stage => {
          if (stage.id !== newUpdate.sid) return stage;
          return {
            ...stage,
            topics: (stage.topics || []).map((topic: any) => {
              if (topic.id !== newUpdate.tid) return topic;
              return {
                ...topic,
                subtopics: (topic.subtopics || []).map((st: any) => {
                  if (st.id !== newUpdate.id) return st;
                  return { ...st, status: newUpdate.data.status };
                })
              };
            })
          };
        });
      });

      return { previousStages };
    },
    onError: (err, newUpdate, context) => {
      if (context?.previousStages) {
        setLocalStages(context.previousStages);
      }
    },
    onSettled: () => {
      // Invalidate but don't force a full re-render flash if possible
      qc.invalidateQueries({ queryKey: ['stages', projectId] });
    },
  });

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const [taskId, topicId, stageId] = draggableId.split(':');
    const [destStageId, newStatus] = destination.droppableId.split(':');

    if (stageId !== destStageId) return;

    updateMutation.mutate({
      sid: stageId,
      tid: topicId,
      id: taskId,
      data: { status: newStatus },
    });
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {localStages.map((stage) => {
          const allTasks = (stage.topics ?? []).flatMap((t: any) =>
            (t.subtopics ?? []).map((s: any) => ({ ...s, topicId: t.id, topicName: t.name, stageId: stage.id })),
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
                        <Droppable droppableId={`${stage.id}:${col.id}`}>
                          {(provided, snapshot) => (
                            <div
                              className="kanban-col-body"
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              style={{ 
                                background: snapshot.isDraggingOver ? 'var(--surface-3)' : 'transparent',
                                transition: 'background 0.2s ease',
                                minHeight: 100
                              }}
                            >
                              {tasks.map((task: any, index: number) => (
                                <Draggable 
                                  key={task.id} 
                                  draggableId={`${task.id}:${task.topicId}:${stage.id}`} 
                                  index={index}
                                >
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      style={{
                                        ...provided.draggableProps.style,
                                        opacity: snapshot.isDragging ? 0.8 : 1,
                                      }}
                                    >
                                      <Link
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
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
};
