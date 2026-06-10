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

// Per-stage accent colors (cycles)
const STAGE_PALETTE = [
  '#4F46E5', '#0EA5E9', '#10B981', '#F59E0B',
  '#EF4444', '#7C3AED', '#EC4899', '#06B6D4',
];

const COLS: { id: string; label: string; color: string; bg: string }[] = [
  { id: 'todo',    label: 'A fazer',      color: '#6B7280', bg: '#6B728014' },
  { id: 'inprog',  label: 'Em progresso', color: '#4F46E5', bg: '#4F46E514' },
  { id: 'review',  label: 'Em revisão',   color: '#F59E0B', bg: '#F59E0B14' },
  { id: 'done',    label: 'Concluída',    color: '#818CF8', bg: '#818CF814' },
  { id: 'blocked', label: 'Bloqueada',    color: '#EF4444', bg: '#EF444414' },
];

const STATUS_COLOR: Record<string, string> = {
  todo: '#6B7280', inprog: '#4F46E5', review: '#F59E0B', done: '#818CF8', blocked: '#EF4444',
};

// ── Mini-Gantt ────────────────────────────────────────────────────────────────
function MiniGantt({ stage, accentColor }: { stage: any; accentColor: string }) {
  const stageStart = stage.startDate ? new Date(stage.startDate) : null;
  const stageEnd   = stage.endDate   ? new Date(stage.endDate)   : null;
  if (!stageStart || !stageEnd) return null;
  const totalMs = stageEnd.getTime() - stageStart.getTime();
  if (totalMs <= 0) return null;

  const today = new Date();
  const todayPct = (today.getTime() - stageStart.getTime()) / totalMs * 100;
  const showToday = todayPct >= 0 && todayPct <= 100;

  const fmtDate = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  const topics: any[] = stage.topics ?? [];

  return (
    <div style={{ padding: '8px 16px 10px', background: `${accentColor}08`, borderBottom: '1px solid var(--border)' }}>
      {/* Labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 10, color: 'var(--text-3)' }}>
        <span>{fmtDate(stageStart)}</span>
        <span style={{ color: accentColor, fontWeight: 600, opacity: 0.8 }}>Cronograma</span>
        <span>{fmtDate(stageEnd)}</span>
      </div>

      {/* Rows */}
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 3 }}>
        {showToday && (
          <div style={{
            position: 'absolute', left: `${todayPct}%`, top: 0, bottom: 0,
            width: 2, background: '#EF4444', zIndex: 3, pointerEvents: 'none',
            boxShadow: '0 0 4px #EF444488',
          }} />
        )}

        {topics.map((topic: any) => {
          const tStart = topic.startDate ? new Date(topic.startDate) : null;
          const tEnd   = topic.endDate   ? new Date(topic.endDate)   : null;
          const subs: any[] = topic.subtopics ?? [];
          const hasHighPrio = subs.some((s) => s.priority === 'high');
          const doneCount    = subs.filter((s) => s.status === 'done').length;
          const inprogCount  = subs.filter((s) => s.status === 'inprog').length;
          const blockedCount = subs.filter((s) => s.status === 'blocked').length;

          const barColor =
            blockedCount > 0 ? '#EF4444'
            : inprogCount > 0 ? '#4F46E5'
            : subs.length > 0 && doneCount === subs.length ? '#818CF8'
            : '#6B7280';

          const donePct  = subs.length > 0 ? (doneCount / subs.length) * 100 : 0;
          const leftPct  = tStart ? Math.max(0, (tStart.getTime() - stageStart.getTime()) / totalMs * 100) : 0;
          const rightPct = tEnd   ? Math.max(0, (stageEnd.getTime() - tEnd.getTime())   / totalMs * 100) : 0;
          const hasDates = !!(tStart && tEnd);

          return (
            <div
              key={topic.id}
              style={{ 
                position: 'relative', 
                height: 18, 
                background: hasHighPrio ? '#EF44442a' : '#00000010',
                borderRadius: 4,
                overflow: 'hidden',
              }}
              title={`${topic.name} · ${doneCount}/${subs.length} concluídas ${hasHighPrio ? '(Contém alta prioridade)' : ''}`}
            >
              {hasDates ? (
                <div style={{
                  position: 'absolute', left: `${leftPct}%`, right: `${rightPct}%`,
                  top: 0, bottom: 0,
                  background: `${barColor}30`,
                  border: `1px solid ${barColor}60`,
                  borderRadius: 4, overflow: 'hidden',
                }}>
                  <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0,
                    width: `${donePct}%`,
                    background: `${barColor}99`,
                    transition: 'width .3s',
                  }} />
                  <div style={{
                    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
                    padding: '0 5px', fontSize: 9, color: 'var(--text)', fontWeight: 600,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {topic.name}
                  </div>
                </div>
              ) : (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: `${accentColor}18`,
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

      {showToday && (
        <div style={{ position: 'relative', height: 12, marginTop: 2 }}>
          <div style={{
            position: 'absolute', left: `${todayPct}%`, transform: 'translateX(-50%)',
            fontSize: 9, fontWeight: 700, color: '#EF4444', whiteSpace: 'nowrap',
          }}>
            hoje
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {localStages.map((stage, stageIdx) => {
          const accentColor = STAGE_PALETTE[stageIdx % STAGE_PALETTE.length];

          const allTasks = (stage.topics ?? []).flatMap((t: any) =>
            (t.subtopics ?? []).map((s: any) => ({ ...s, topicId: t.id, topicName: t.name, stageId: stage.id })),
          );
          const totalTasks = allTasks.length;
          const doneTasks  = allTasks.filter((t: any) => t.status === 'done').length;
          const donePct    = totalTasks > 0 ? Math.round(doneTasks / totalTasks * 100) : 0;
          const isCollapsed = collapsed.has(stage.id);

          const hasBlocked = allTasks.some((t: any) => t.status === 'blocked');
          const hasInprog  = allTasks.some((t: any) => t.status === 'inprog');
          const statusColor =
            hasBlocked ? '#EF4444' : hasInprog ? '#4F46E5' : donePct === 100 ? '#818CF8' : '#6B7280';

          return (
            <div
              key={stage.id}
              className="card"
              style={{ overflow: 'hidden', borderLeft: `4px solid ${accentColor}` }}
            >
              {/* ── Stage header ─────────────────────────────────────── */}
              <div
                className="card-head"
                style={{
                  alignItems: 'center', cursor: 'pointer', userSelect: 'none',
                  background: `${accentColor}0a`,
                }}
                onClick={() => toggleCollapse(stage.id)}
              >
                <div className="row" style={{ gap: 8, flex: 1 }}>
                  <svg
                    width="13" height="13" viewBox="0 0 24 24" fill="none"
                    stroke={accentColor} strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round"
                    style={{ flexShrink: 0, transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform .2s' }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>

                  {/* Stage index badge */}
                  <span style={{
                    background: accentColor, color: '#fff',
                    fontSize: 10, fontWeight: 700, borderRadius: 4,
                    padding: '1px 6px', flexShrink: 0,
                  }}>
                    E{stageIdx + 1}
                  </span>

                  <span className="b" style={{ fontSize: 14, color: 'var(--text)' }}>{stage.name}</span>
                  <span className="xs faint">{doneTasks}/{totalTasks} tarefas</span>

                  {hasBlocked && (
                    <span style={{
                      fontSize: 10, fontWeight: 600, color: '#EF4444',
                      background: '#EF444418', borderRadius: 4, padding: '1px 6px',
                    }}>
                      Bloqueada
                    </span>
                  )}
                </div>

                {/* Right: progress pill + dates */}
                <div className="row" style={{ gap: 8, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: `${statusColor}18`, borderRadius: 20, padding: '3px 10px',
                  }}>
                    <div style={{ width: 54, height: 5, background: '#00000018', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ width: `${donePct}%`, height: '100%', background: statusColor, borderRadius: 99, transition: 'width .3s' }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: statusColor }}>{donePct}%</span>
                  </div>
                  {stage.startDate && stage.endDate && (
                    <span className="xs faint">
                      {new Date(stage.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                      {' → '}
                      {new Date(stage.endDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    </span>
                  )}
                </div>
              </div>

              {/* ── Collapsible body ─────────────────────────────────── */}
              {!isCollapsed && (
                <>
                  <MiniGantt stage={stage} accentColor={accentColor} />

                  <div className="card-body" style={{ padding: 10 }}>
                    <div className="kanban">
                      {COLS.map((col) => {
                        const tasks = allTasks.filter((t: any) => t.status === col.id);
                        return (
                          <div
                            key={col.id}
                            className="kanban-col"
                            style={{ borderTop: `2px solid ${col.color}` }}
                          >
                            {/* Column head */}
                            <div
                              className="kanban-col-head"
                              style={{ background: col.bg }}
                            >
                              <span style={{
                                width: 7, height: 7, borderRadius: '50%',
                                background: col.color, flexShrink: 0,
                              }} />
                              <span style={{ color: col.color, fontWeight: 600, fontSize: 12 }}>{col.label}</span>
                              <span style={{
                                marginLeft: 'auto', fontSize: 11, fontWeight: 600,
                                background: `${col.color}22`, color: col.color,
                                borderRadius: 10, padding: '1px 7px',
                              }}>
                                {tasks.length}
                              </span>
                            </div>

                            <Droppable droppableId={`${stage.id}:${col.id}`}>
                              {(provided, snapshot) => (
                                <div
                                  className="kanban-col-body"
                                  ref={provided.innerRef}
                                  {...provided.droppableProps}
                                  style={{
                                    background: snapshot.isDraggingOver ? `${col.color}12` : 'transparent',
                                    transition: 'background .15s',
                                    minHeight: 80,
                                  }}
                                >
                                  {tasks.map((task: any, index: number) => {
                                    const taskColor = STATUS_COLOR[task.status] ?? '#6B7280';
                                    return (
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
                                              opacity: snapshot.isDragging ? 0.9 : 1,
                                            }}
                                          >
                                            <Link
                                              to={`/projects/${projectId}/stages/${stage.id}/topics/${task.topicId}/subtopics/${task.id}`}
                                              className="kanban-card"
                                              style={{
                                                textDecoration: 'none',
                                                borderLeft: `3px solid ${taskColor}`,
                                                paddingLeft: 9,
                                                boxShadow: snapshot.isDragging ? `0 4px 16px ${taskColor}33` : undefined,
                                              }}
                                            >
                                              {/* Topic + priority chips */}
                                              <div className="row" style={{ gap: 4, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                                                <span
                                                  className="chip xs truncate"
                                                  title={task.topicName}
                                                  style={{
                                                    background: `${accentColor}18`,
                                                    color: accentColor,
                                                    fontWeight: 600, maxWidth: 120,
                                                  }}
                                                >
                                                  {task.topicName}
                                                </span>
                                                <PrioChip priority={task.priority || 'med'} />
                                                {task.isConcurrent && (
                                                  <span style={{
                                                    fontSize: 9, padding: '1px 4px',
                                                    borderRadius: 3, background: '#00000010',
                                                    color: 'var(--text-3)', fontWeight: 600,
                                                  }}>
                                                    CONC
                                                  </span>
                                                )}
                                              </div>

                                              <div className="title" style={{ marginTop: 5 }}>{task.name}</div>

                                              {/* Mini position bar */}
                                              {task.startDate && task.endDate && stage.startDate && stage.endDate && (() => {
                                                const sStart = new Date(stage.startDate).getTime();
                                                const sEnd   = new Date(stage.endDate).getTime();
                                                const tStart = new Date(task.startDate).getTime();
                                                const tEnd   = new Date(task.endDate).getTime();
                                                const span   = sEnd - sStart;
                                                if (span <= 0) return null;
                                                const left  = Math.max(0, (tStart - sStart) / span * 100);
                                                const width = Math.max(4, Math.min(100 - left, (tEnd - tStart) / span * 100));
                                                return (
                                                  <div style={{
                                                    position: 'relative', height: 4,
                                                    background: '#00000012', borderRadius: 99,
                                                    marginTop: 6, overflow: 'hidden',
                                                  }}>
                                                    <div style={{
                                                      position: 'absolute', left: `${left}%`, width: `${width}%`,
                                                      top: 0, bottom: 0, background: taskColor, borderRadius: 99,
                                                    }} />
                                                  </div>
                                                );
                                              })()}

                                              {/* In-progress bar */}
                                              {task.status === 'inprog' && task.progress != null && task.progress > 0 && (
                                                <div style={{ marginTop: 3 }}>
                                                  <div style={{
                                                    height: 3, background: '#00000010', borderRadius: 99, overflow: 'hidden',
                                                  }}>
                                                    <div style={{
                                                      width: `${task.progress}%`, height: '100%',
                                                      background: '#4F46E5', borderRadius: 99,
                                                    }} />
                                                  </div>
                                                  <div style={{ fontSize: 9, color: '#4F46E5', fontWeight: 600, marginTop: 1 }}>
                                                    {task.progress}% concluído
                                                  </div>
                                                </div>
                                              )}

                                              <div className="foot" style={{ marginTop: 8 }}>
                                                <span style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 3 }}>
                                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                                    );
                                  })}
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
