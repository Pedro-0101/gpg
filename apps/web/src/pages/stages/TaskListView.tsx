import React, { useState } from 'react';
import { StatusChip } from '../../components/ui/StatusChip';
import { PrioChip } from '../../components/ui/PrioChip';
import { formatDate } from '../../lib/utils';
import { Link, useParams } from 'react-router-dom';

interface TaskListViewProps {
  project: any;
  stages: any[];
}

export const TaskListView: React.FC<TaskListViewProps> = ({ project, stages }) => {
  const { projectId } = useParams();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  function toggle(id: string) {
    setCollapsed((p) => ({ ...p, [id]: !p[id] }));
  }

  // Row styling to ensure pixel-perfect alignment across header and rows (excluding responsaveis)
  const rowStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'minmax(260px, 3.5fr) 95px 85px 85px 80px 160px 90px',
    gap: '12px',
    alignItems: 'center',
    padding: '8px 16px',
    width: '100%',
    borderBottom: '1px solid var(--border)',
  };

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <div style={{ minWidth: '920px' }}>
          {/* Header */}
          <div style={{ ...rowStyle, background: 'var(--surface-2)', borderBottom: '1px solid var(--border-strong)', padding: '10px 16px' }}>
            {['TAREFA', 'STATUS', 'INÍCIO', 'FIM / PRAZO', 'TEMPO', 'EQUIPES', 'PRIORIDADE'].map((h) => (
              <div
                key={h}
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  color: 'var(--text-3)',
                  whiteSpace: 'nowrap',
                }}
              >
                {h}
              </div>
            ))}
          </div>

          {stages.map((stage, si) => {
            const isCollapsed = collapsed[stage.id];
            const totalSubs = (stage.topics ?? []).reduce((n: number, t: any) => n + (t.subtopics?.length ?? 0), 0);
            const doneSubs = (stage.topics ?? []).reduce((n: number, t: any) => n + (t.subtopics?.filter((s: any) => s.status === 'done')?.length ?? 0), 0);

            // Aggregate hours for the stage
            const stageDuration = (stage.topics ?? []).reduce(
              (acc: number, t: any) => acc + (t.subtopics ?? []).reduce((acc2: number, s: any) => acc2 + (s.durationHours || 0), 0),
              0
            );

            // Aggregate unique teams for the stage
            const stageTeamsMap = new Map();
            (stage.topics ?? []).forEach((t: any) => {
              (t.subtopics ?? []).forEach((s: any) => {
                (s.teams ?? []).forEach((tr: any) => {
                  stageTeamsMap.set(tr.team.id, tr.team);
                });
              });
            });
            const stageTeams = Array.from(stageTeamsMap.values());

            return (
              <React.Fragment key={stage.id}>
                {/* Stage row */}
                <div
                  className={`outline-row stage ${isCollapsed ? '' : 'open'}`}
                  onClick={() => toggle(stage.id)}
                  style={{ cursor: 'pointer', ...rowStyle, borderBottom: '1px solid var(--border)' }}
                >
                  {/* Column 1: Task/Stage details */}
                  <div className="row" style={{ gap: 8, minWidth: 0 }}>
                    <span className="chev" style={{ transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </span>
                    <span className="chip accent xs">
                      E{si + 1}
                    </span>
                    <span className="b small truncate" style={{ flex: 1 }}>{stage.name}</span>
                    <span className="xs faint" style={{ flexShrink: 0 }}>{doneSubs}/{totalSubs} tarefas</span>
                  </div>

                  {/* Column 2: Status */}
                  <div />

                  {/* Column 3: Start Date */}
                  <div className="xs faint">{stage.startDate ? formatDate(stage.startDate) : '—'}</div>

                  {/* Column 4: End Date */}
                  <div className="xs faint">{stage.endDate ? formatDate(stage.endDate) : '—'}</div>

                  {/* Column 5: Duration */}
                  <div className="xs b">{stageDuration > 0 ? `${stageDuration}h` : '—'}</div>

                  {/* Column 6: Equipes */}
                  <div>
                    <div className="row gap-4" style={{ flexWrap: 'wrap' }}>
                      {stageTeams.length > 0 ? (
                        stageTeams.slice(0, 3).map((team: any) => (
                          <span key={team.id} className="chip purple xs">
                            {team.name}
                          </span>
                        ))
                      ) : (
                        <span style={{ color: 'var(--text-3)', fontSize: 11 }}>—</span>
                      )}
                      {stageTeams.length > 3 && (
                        <span style={{ fontSize: 9, color: 'var(--text-3)', fontWeight: 500 }}>
                          +{stageTeams.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Column 7: Priority */}
                  <div />
                </div>

                {!isCollapsed && (stage.topics ?? []).map((topic: any) => {
                  const topicCollapsed = collapsed[topic.id];

                  // Aggregate hours for the topic
                  const topicDuration = (topic.subtopics ?? []).reduce(
                    (acc: number, s: any) => acc + (s.durationHours || 0),
                    0
                  );

                  // Aggregate unique teams for the topic
                  const topicTeamsMap = new Map();
                  (topic.subtopics ?? []).forEach((s: any) => {
                    (s.teams ?? []).forEach((tr: any) => {
                      topicTeamsMap.set(tr.team.id, tr.team);
                    });
                  });
                  const topicTeams = Array.from(topicTeamsMap.values());

                  return (
                    <React.Fragment key={topic.id}>
                      {/* Topic row */}
                      <div
                        className="outline-row topic"
                        onClick={(e) => { e.stopPropagation(); toggle(topic.id); }}
                        style={{ cursor: 'pointer', ...rowStyle, borderBottom: '1px solid var(--border)' }}
                      >
                        {/* Column 1: Task/Topic details with padding indentation inside the column */}
                        <div className="row" style={{ gap: 6, minWidth: 0, paddingLeft: 18 }}>
                          <span style={{ color: 'var(--text-3)', marginLeft: 2, flexShrink: 0 }}>
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              style={{
                                transform: topicCollapsed ? 'rotate(0deg)' : 'rotate(90deg)',
                                transition: 'transform .15s',
                              }}
                            >
                              <polyline points="9 18 15 12 9 6" />
                            </svg>
                          </span>
                          <span style={{ color: 'var(--text-3)', fontSize: 12, flexShrink: 0 }}>#</span>
                          <span className="small b truncate" style={{ flex: 1 }}>{topic.name}</span>
                          <span className="xs faint" style={{ flexShrink: 0 }}>({topic.subtopics?.length || 0})</span>
                        </div>

                        {/* Column 2: Status */}
                        <div />

                        {/* Column 3: Start Date */}
                        <div className="xs faint">{topic.startDate ? formatDate(topic.startDate) : '—'}</div>

                        {/* Column 4: End Date */}
                        <div className="xs faint">{topic.endDate ? formatDate(topic.endDate) : '—'}</div>

                        {/* Column 5: Duration */}
                        <div className="xs b">{topicDuration > 0 ? `${topicDuration}h` : '—'}</div>

                        {/* Column 6: Equipes */}
                        <div>
                          <div className="row gap-4" style={{ flexWrap: 'wrap' }}>
                            {topicTeams.length > 0 ? (
                              topicTeams.slice(0, 3).map((team: any) => (
                                <span key={team.id} className="chip purple xs" style={{ fontSize: 9.5, padding: '2px 6px' }}>
                                  {team.name}
                                </span>
                              ))
                            ) : (
                              <span style={{ color: 'var(--text-3)', fontSize: 11 }}>—</span>
                            )}
                            {topicTeams.length > 3 && (
                              <span style={{ fontSize: 9, color: 'var(--text-3)', fontWeight: 500 }}>
                                +{topicTeams.length - 3}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Column 7: Priority */}
                        <div />
                      </div>

                      {/* Subtopic rows */}
                      {!topicCollapsed && (topic.subtopics ?? []).map((sub: any) => (
                        <div key={sub.id} className="outline-row task" style={{ ...rowStyle, borderBottom: '1px solid var(--border)' }}>
                          {/* Column 1: Task/Subtopic details with padding indentation inside the column */}
                          <div className="row" style={{ gap: 8, minWidth: 0, paddingLeft: 42 }}>
                            <span className={`check ${sub.status === 'done' ? 'done' : ''}`} style={{ flexShrink: 0 }} />
                            <Link
                              to={`/projects/${projectId}/stages/${stage.id}/topics/${topic.id}/subtopics/${sub.id}`}
                              className="small b truncate"
                              style={{ color: 'var(--text)', textDecoration: 'none', flex: 1 }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {sub.name}
                            </Link>
                          </div>

                          {/* Column 2: Status */}
                          <div>
                            <StatusChip status={sub.status} />
                          </div>

                          {/* Column 3: Start Date */}
                          <div className="xs faint">
                            {sub.startDate ? formatDate(sub.startDate) : '—'}
                          </div>

                          {/* Column 4: End Date / Deadline */}
                          <div className="xs faint">
                            {sub.endDate ? formatDate(sub.endDate) : sub.deadline ? formatDate(sub.deadline) : '—'}
                          </div>

                          {/* Column 5: Duration */}
                          <div className="xs b">
                            {sub.durationHours ? `${sub.durationHours}h` : '—'}
                          </div>

                          {/* Column 6: Equipes */}
                          <div>
                            <div className="row gap-4" style={{ flexWrap: 'wrap' }}>
                              {(sub.teams ?? []).length > 0 ? (
                                sub.teams.map((tr: any) => (
                                  <span key={tr.team.id} className="chip purple xs" style={{ fontSize: 9.5, padding: '2px 6px' }}>
                                    {tr.team.name}
                                  </span>
                                ))
                              ) : (
                                <span style={{ color: 'var(--text-3)', fontSize: 11 }}>—</span>
                              )}
                            </div>
                          </div>

                          {/* Column 7: Priority */}
                          <div>
                            {sub.priority && <PrioChip priority={sub.priority} />}
                          </div>
                        </div>
                      ))}
                    </React.Fragment>
                  );
                })}
              </React.Fragment>
            );
          })}

          {stages.length === 0 && (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)' }}>Nenhuma etapa.</div>
          )}
        </div>
      </div>
    </div>
  );
};
