import React, { useState, useEffect } from 'react';
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

const STATUS_COLOR: Record<string, string> = {
  todo: 'var(--text-3)',
  inprog: 'var(--accent)',
  review: 'var(--warning)',
  done: 'var(--success)',
  blocked: 'var(--danger)',
};

// ── Mini-Gantt ────────────────────────────────────────────────────────────────
function MiniGantt({ stage }: { stage: any }) {
  const stageStart = stage.startDate ? new Date(stage.startDate) : null;
  const stageEnd   = stage.endDate   ? new Date(stage.endDate)   : null;

  if (!stageStart || !stageEnd) return null;

  const totalMs = stageEnd.getTime() - stageStart.getTime();
  if (totalMs <= 0) return null;

  const today = new Date();
  const todayPct = (today.getTime() - stageStart.getTime()) / totalMs * 100;
  const showToday = todayPct >= 0 && todayPct <= 100;

  const fmtDate = (d: Date) =>
    d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

  const topics: any[] = stage.topics ?? [];

  return (
    <div style={{
      padding: '8px 16px 10px',
      background: 'var(--surface-2)',
      borderBottom: '1px solid var(--border)',
    }}>
      {/* Timeline labels */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        marginBottom: 5, fontSize: 10, color: 'var(--text-3)',
      }}>
        <span>{fmtDate(stageStart)}</span>
        <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>Cronograma da etapa</span>
        <span>{fmtDate(stageEnd)}</span>
      </div>

      {/* Rows */}
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 3 }}>

        {/* "Today" vertical line */}
        {showToday && (
          <div style={{
            position: 'absolute',
            left: `${todayPct}%`,
            top: 0, bottom: 0,
            width: 1.5,
            background: 'var(--danger)',
            zIndex: 3,
            pointerEvents: 'none',
          }} />
        )}

        {topics.map((topic: any) => {
          const tStart = topic.startDate ? new Date(topic.startDate) : null;
          const tEnd   = topic.endDate   ? new Date(topic.endDate)   : null;

          const subs: any[] = topic.subtopics ?? [];
          const doneCount    = subs.filter((s) => s.status === 'done').length;
          const inprogCount  = subs.filter((s) => s.status === 'inprog').length;
          const blockedCount = subs.filter((s) => s.status === 'blocked').length;

          const barColor =
            blockedCount > 0 ? 'var(--danger)'
            : inprogCount > 0 ? 'var(--accent)'
            : subs.length > 0 && doneCount === subs.length ? 'var(--success)'
            : 'var(--text-3)';

          const donePct = subs.length > 0 ? (doneCount / subs.length) * 100 : 0;

          // Position the topic bar within the stage timeline
          const leftPct  = tStart ? Math.max(0, (tStart.getTime() - stageStart.getTime()) / totalMs * 100) : 0;
          const rightPct = tEnd   ? Math.max(0, (stageEnd.getTime()  - tEnd.getTime())   / totalMs * 100) : 0;
          const hasDates = tStart && tEnd;

          return (
            <div
              key={topic.id}
              style={{
                position: 'relative',
                height: 16,
                background: 'var(--border)',
                borderRadius: 4,
                overflow: 'hidden',
              }}
              title={`${topic.name} · ${doneCount}/${subs.length} concluídas`}
            >
              {hasDates ? (
                /* Positioned bar */
                <div style={{
                  position: 'absolute',
                  left: `${leftPct}%`,
                  right: `${rightPct}%`,
                  top: 0, bottom: 0,
                  background: `color-mix(in srgb, ${barColor} 20%, transparent)`,
                  borderRadius: 4,
                  overflow: 'hidden',
                }}>
                  {/* Progress fill */}
                  <div style={{
                    position: 'absolute',
                    left: 0, top: 0, bottom: 0,
                    width: `${donePct}%`,
                    background: barColor,
                    transition: 'width .3s',
                  }} />
                  {/* Label */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center',
                    padding: '0 5px', fontSize: 9,
                    color: 'var(--text)', fontWeight: 500,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {topic.name}
                  </div>
                </div>
              ) : (
                /* No dates — full-width muted bar */
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'var(--surface-3)',
                  display: 'flex', alignItems: 'center', padding: '0 5px',
                  fontSize: 9, color: 'var(--text-3)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {topic.name}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Today label below */}
      {showToday && (
        <div style={{
          position: 'relative', height: 12, marginTop: 2,
        }}>
          <div style={{
            position: 'absolute',
            left: `${todayPct}%`,
            transform: 'translateX(-50%)',
            fontSize: 9, fontWeight: 600,
            color: 'var(--danger)',
            whiteSpace: 'nowrap',
          }}>
            hoje
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export const TaskKanbanView: React.FC<TaskKanbanViewProps> = ({ project, stages: initialStages }) => {
  const { projectId } = useParams();
  const qc = useQueryClient();

  const [localStages, setLocalStages] = useState(initialStages);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  useEffect(() => { setLocalStages(initialStages); }, [initialStages]);

  function toggleCollapse(stageId: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(stageId) ? next.delete(stageId) : next.add(stageId);
      return next;
    });
  }

  const updateMutation = useMutation({
    mutationFn: ({ sid, tid, id, data }: { sid: string; tid: string; id: string; data: any }) =>
      subtopicsApi.update(projectId!, sid, tid, id, data),
    onMutate: async (newUpdate) => {
      const previousStages = localStages;
      setLocalStages((old) =>
        old.map((stage) => {
          if (stage.id !== newUpdate.sid) return stage;
          return {
            ...stage,
            topics: (stage.topics || []).map((topic: any) => {
              if (topic.id !== newUpdate.tid) return topic;
              return {
                ...topic,
                subtopics: (topic.subtopics || []).map((st: any) =>
                  st.id !== newUpdate.id ? st : { ...st, status: newUpdate.data.status },
                ),
              };
            }),
          };
        }),
      );
      return { previousStages };
    },
    onError: (_err, _v, context) => {
      if (context?.previousStages) setLocalStages(context.previousStages);
    },
    onSettled: () => { qc.invalidateQueries({ queryKey: ['stages', projectId] }); },
  });

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const [taskId, topicId, stageId] = draggableId.split(':');
    const [destStageId, newStatus]   = destination.droppableId.split(':');
    if (stageId !== destStageId) return;

    updateMutation.mutate({ sid: stageId, tid: topicId, id: taskId, data: { status: newStatus } });
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {localStages.map((stage) => {
          const allTasks = (stage.topics ?? []).flatMap((t: any) =>
            (t.subtopics ?? []).map((s: any) => ({ ...s, topicId: t.id, topicName: t.name, stageId: stage.id })),
          );
          const totalTasks = allTasks.length;
          const doneTasks  = allTasks.filter((t: any) => t.status === 'done').length;
          const donePct    = totalTasks > 0 ? Math.round(doneTasks / totalTasks * 100) : 0;
          const isCollapsed = collapsed.has(stage.id);

          // Status dot for stage header
          const hasBlocked = allTasks.some((t: any) => t.status === 'blocked');
          const hasInprog  = allTasks.some((t: any) => t.status === 'inprog');
          const stageColor =
            hasBlocked ? STATUS_COLOR.blocked
            : hasInprog ? STATUS_COLOR.inprog
            : donePct === 100 ? STATUS_COLOR.done
            : STATUS_COLOR.todo;

          return (
            <div key={stage.id} className="card" style={{ overflow: 'hidden' }}>
              {/* Stage header — clickable to collapse */}
              <div
                className="card-head"
                style={{ alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
                onClick={() => toggleCollapse(stage.id)}
              >
                <div className="row" style={{ gap: 8, flex: 1 }}>
                  {/* Chevron */}
                  <svg
                    width="13" height="13" viewBox="0 0 24 24" fill="none"
                    stroke="var(--text-3)" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round"
                    style={{
                      flexShrink: 0,
                      transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                      transition: 'transform .2s',
                    }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>

                  {/* Stage dot */}
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: stageColor, flexShrink: 0,
                  }} />

                  <span className="b" style={{ fontSize: 14 }}>{stage.name}</span>
                  <span className="xs faint">{doneTasks}/{totalTasks} tarefas</span>

                  {hasBlocked && (
                    <span className="chip blocked xs">Bloqueada</span>
                  )}
                </div>

                {/* Right side: progress summary */}
                <div className="row" style={{ gap: 8, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                  <span className="xs b" style={{ color: stageColor }}>{donePct}%</span>
                  {stage.startDate && stage.endDate && (
                    <span className="xs faint">
                      {new Date(stage.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                      {' → '}
                      {new Date(stage.endDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    </span>
                  )}
                </div>
              </div>

              {/* Collapsible body */}
              {!isCollapsed && (
                <>
                  {/* Mini-Gantt */}
                  <MiniGantt stage={stage} />

                  {/* Kanban columns */}
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
                            </div>
                            <Droppable droppableId={`${stage.id}:${col.id}`}>
                              {(provided, snapshot) => (
                                <div
                                  className="kanban-col-body"
                                  ref={provided.innerRef}
                                  {...provided.droppableProps}
                                  style={{
                                    background: snapshot.isDraggingOver ? 'var(--surface-3)' : 'transparent',
                                    transition: 'background .2s',
                                    minHeight: 80,
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
                                            opacity: snapshot.isDragging ? 0.85 : 1,
                                          }}
                                        >
                                          <Link
                                            to={`/projects/${projectId}/stages/${stage.id}/topics/${task.topicId}/subtopics/${task.id}`}
                                            className="kanban-card"
                                            style={{ textDecoration: 'none' }}
                                          >
                                            <div className="row" style={{ gap: 4, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                                              <span className="chip accent xs truncate" title={task.topicName || 'Tópico'}>
                                                {task.topicName}
                                              </span>
                                              <PrioChip priority={task.priority || 'med'} />
                                              {task.isConcurrent && (
                                                <span className="chip xs" style={{ fontSize: 9, opacity: 0.7 }}>CONC</span>
                                              )}
                                            </div>

                                            <div className="title">{task.name}</div>

                                            {/* Mini gantt bar for the card (only when task has dates) */}
                                            {task.startDate && task.endDate && stage.startDate && stage.endDate && (() => {
                                              const sStart = new Date(stage.startDate).getTime();
                                              const sEnd   = new Date(stage.endDate).getTime();
                                              const tStart = new Date(task.startDate).getTime();
                                              const tEnd   = new Date(task.endDate).getTime();
                                              const span   = sEnd - sStart;
                                              if (span <= 0) return null;
                                              const left  = Math.max(0, (tStart - sStart) / span * 100);
                                              const width = Math.max(2, Math.min(100 - left, (tEnd - tStart) / span * 100));
                                              const color = STATUS_COLOR[task.status] ?? STATUS_COLOR.todo;
                                              return (
                                                <div style={{
                                                  position: 'relative', height: 4,
                                                  background: 'var(--border)', borderRadius: 99,
                                                  marginTop: 4, overflow: 'hidden',
                                                }}>
                                                  <div style={{
                                                    position: 'absolute',
                                                    left: `${left}%`, width: `${width}%`,
                                                    top: 0, bottom: 0,
                                                    background: color, borderRadius: 99,
                                                  }} />
                                                </div>
                                              );
                                            })()}

                                            {task.status === 'inprog' && task.progress != null && (
                                              <div className="bar" style={{ marginTop: 2 }}>
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
                </>
              )}
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
};
