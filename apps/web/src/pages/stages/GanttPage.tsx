import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { stagesApi } from '../../api/stages';
import { milestonesApi, risksApi } from '../../api/risks-milestones';
import type { Risk } from '../../types';
import { formatDate } from '../../lib/utils';
import { differenceInDays, addMonths, addDays, format, min, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PrioChip } from '../../components/ui/PrioChip';

interface GanttPageProps {
  project: any;
}

type ViewMode = 'day' | 'week' | 'month' | 'quarter';

const LABEL_W = 240;

const viewConfigs = {
  day: {
    dayW: 80, // Increased width to avoid overlap
    totalDays: 730,
    colCount: 730,
    getColumns: (origin: Date) => Array.from({ length: 730 }, (_, i) => addDays(origin, i)),
    formatHeader: (d: Date) => format(d, 'dd/MM/yyyy'),
  },
  week: {
    dayW: 12,
    totalDays: 1092,
    colCount: 156,
    getColumns: (origin: Date) => Array.from({ length: 156 }, (_, i) => addDays(origin, i * 7)),
    formatHeader: (d: Date, idx: number) => `S${idx + 1} (${format(d, 'dd/MM')})`,
  },
  month: {
    dayW: 4,
    totalDays: 1080,
    colCount: 36,
    getColumns: (origin: Date) => Array.from({ length: 36 }, (_, i) => addMonths(origin, i)),
    formatHeader: (d: Date) => format(d, 'MMM yyyy', { locale: ptBR }),
  },
  quarter: {
    dayW: 2,
    totalDays: 1440,
    colCount: 16,
    getColumns: (origin: Date) => Array.from({ length: 16 }, (_, i) => addMonths(origin, i * 3)),
    formatHeader: (d: Date) => {
      const q = Math.floor(d.getMonth() / 3) + 1;
      return `T${q}/${format(d, 'yyyy')}`;
    },
  },
};

export const GanttPage: React.FC<GanttPageProps> = ({ project }) => {
  const [viewMode, setViewMode] = React.useState<ViewMode>('month');
  const [cursorX, setCursorX] = React.useState<number | null>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const handleMouseMoveGantt = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    setCursorX(x);
  };

  const { data: stages = [] } = useQuery({
    queryKey: ['stages', project.id],
    queryFn: () => stagesApi.list(project.id),
  });
  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones', project.id],
    queryFn: () => milestonesApi.list(project.id),
  });
  const { data: risks = [] } = useQuery({
    queryKey: ['risks', project.id],
    queryFn: () => risksApi.list(project.id),
  });

  const config = viewConfigs[viewMode];
  
  // Origin based on the first task or project start
  const origin = React.useMemo(() => {
    const dates: Date[] = [];
    if (project.startDate) dates.push(new Date(project.startDate));
    
    stages.forEach((s: any) => {
      if (s.startDate) dates.push(new Date(s.startDate));
      (s.topics || []).forEach((t: any) => {
        if (t.startDate) dates.push(new Date(t.startDate));
      });
    });

    if (dates.length === 0) return startOfMonth(new Date());
    
    // Start at the beginning of the month of the earliest date
    return startOfMonth(min(dates));
  }, [project.startDate, stages]);

  const columns = React.useMemo(() => config.getColumns(origin), [config, origin]);
  const totalW = config.totalDays * config.dayW;
  const todayX = differenceInDays(new Date(), origin) * config.dayW;

  const weekendBars = React.useMemo(() => {
    if (viewMode !== 'day') return [];
    const dayW = config.dayW;
    return columns
      .map((c, i) => ({ day: c.getDay(), i }))
      .filter(({ day }) => day === 0 || day === 6)
      .map(({ i }) => ({
        left: i * dayW,
        width: dayW,
      }));
  }, [columns, config, viewMode]);

  const getX = (date: string | Date) => {
    return Math.max(0, differenceInDays(new Date(date), origin)) * config.dayW;
  };
  const getW = (start: string | Date, end: string | Date) => {
    return Math.max(10, differenceInDays(new Date(end), new Date(start)) * config.dayW);
  };

  React.useEffect(() => {
    if (scrollContainerRef.current) {
      const scrollTarget = todayX > 0 ? todayX - 200 : 0;
      scrollContainerRef.current.scrollLeft = scrollTarget;
    }
  }, [viewMode, todayX]);

  const activeRisks = (risks as Risk[]).filter((r) => r.status === 'active');
  const STAGE_COLORS = ['var(--text)', 'var(--accent)', 'var(--success)', 'var(--purple)'];

  const [tooltip, setTooltip] = React.useState<{
    x: number; y: number;
    title: string;
    description?: string | null;
    type?: string;
    startDate?: string | null;
    endDate?: string | null;
    priority?: string;
    status?: string;
    progress?: number;
    responsible?: string;
  } | null>(null);

  const handleTooltipEnter = (e: React.MouseEvent, data: { title: string; description?: string | null; type?: string; startDate?: string | null; endDate?: string | null; priority?: string; status?: string; progress?: number; responsible?: string }) => {
    setTooltip({ x: e.clientX, y: e.clientY, ...data });
  };
  const handleTooltipMove = (e: React.MouseEvent) => {
    setTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
  };
  const handleTooltipLeave = () => {
    setTooltip(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <style>{`
        .gantt-today::before {
          display: none !important;
        }
        .gantt-today::after {
          content: 'Hoje';
          position: absolute;
          top: 36px;
          left: 4px;
          background: var(--danger);
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
          box-shadow: var(--shadow-sm);
        }
        .gantt-bar-link {
          text-decoration: none;
          color: inherit;
          display: block;
          height: 100%;
          width: 100%;
        }
        .gantt-bar.high-prio {
          border: 1.5px solid var(--danger) !important;
          box-shadow: 0 0 4px var(--danger-soft);
          z-index: 10;
        }
        .subtopic-row.high-prio-row {
          /* background removed as requested */
        }
        .gantt-row:hover {
          background-color: var(--surface-3) !important;
        }
        .gantt-cursor-line {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 1px;
          background-color: var(--text-3);
          opacity: 0.3;
          pointer-events: none;
          z-index: 20;
        }
      `}</style>
      <div className="page-head">
        <div>
          <div className="page-title">Linha do tempo · {project.name}</div>
          <div className="page-sub">Visualização por Etapa → Tópico</div>
        </div>
        <div className="seg">
          {Object.keys(viewConfigs).map((m) => (
            <button
              key={m}
              className={`seg-btn ${viewMode === m ? 'active' : ''}`}
              onClick={() => setViewMode(m as ViewMode)}
            >
              {m === 'day' ? 'Dia' : m === 'week' ? 'Semana' : m === 'month' ? 'Mês' : 'Trimestre'}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="card-head">
          <div className="card-title">Cronograma</div>
          <div className="row xs faint" style={{ gap: 12 }}>
            <span><span style={{ display: 'inline-block', width: 12, height: 8, background: 'var(--text)', borderRadius: 2, marginRight: 4 }} />Etapa</span>
            <span><span style={{ display: 'inline-block', width: 12, height: 8, background: 'var(--accent)', borderRadius: 2, marginRight: 4 }} />Tópico</span>
            <span><span style={{ display: 'inline-block', width: 12, height: 8, background: 'var(--success)', borderRadius: 2, marginRight: 4 }} />Concluído</span>
          </div>
        </div>
        <div ref={scrollContainerRef} style={{ overflowX: 'auto' }}>
          <div 
            className="gantt-wrap" 
            style={{ minWidth: LABEL_W + totalW, position: 'relative' }}
            onMouseMove={handleMouseMoveGantt}
            onMouseLeave={() => setCursorX(null)}
          >
            {cursorX !== null && cursorX > LABEL_W && (
              <div className="gantt-cursor-line" style={{ left: cursorX }} />
            )}
            {todayX > 0 && todayX < totalW && (
              <div className="gantt-today" style={{ left: LABEL_W + todayX }} />
            )}
            {weekendBars.map((bar, i) => (
              <div key={i} style={{
                position: 'absolute',
                left: LABEL_W + bar.left,
                width: bar.width,
                top: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.035)',
                pointerEvents: 'none',
                zIndex: 0,
              }} />
            ))}
            <div className="gantt-head">
              <div className="cell">Etapas e tópicos</div>
              <div className="timeline-cols" style={{ gridTemplateColumns: `repeat(${config.colCount}, ${totalW / config.colCount}px)` }}>
                {columns.map((c, i) => (
                  <span key={i} style={{ 
                    fontSize: viewMode === 'day' ? '10px' : '11px',
                    textAlign: 'center'
                  }}>
                    {config.formatHeader(c, i)}
                  </span>
                ))}
              </div>
            </div>

            {(stages as any[]).map((stage, si) => {
              const stageColor = STAGE_COLORS[si % STAGE_COLORS.length];
              const hasBar = stage.startDate && stage.endDate;
              return (
                <React.Fragment key={stage.id}>
                  <div className="gantt-row stage-row">
                    <div className="label-cell">
                      <span className="chip accent xs" style={{ background: `color-mix(in srgb, ${stageColor} 12%, transparent)`, color: stageColor }}>E{si + 1}</span>
                      <span className="truncate b">{stage.name}</span>
                    </div>
                    <div className="timeline-cell" style={{ position: 'relative', backgroundImage: `repeating-linear-gradient(to right, var(--border) 0 1px, transparent 1px ${totalW / config.colCount}px)` }}>
                      {hasBar && (
                        <div
                          className="gantt-bar stage-bar"
                          style={{ left: getX(stage.startDate), width: getW(stage.startDate, stage.endDate) }}
                          onMouseEnter={(e) => handleTooltipEnter(e, { title: stage.name, startDate: stage.startDate, endDate: stage.endDate, type: 'Etapa' })}
                          onMouseMove={handleTooltipMove}
                          onMouseLeave={handleTooltipLeave}
                        >
                          {stage.name}
                        </div>
                      )}
                    </div>
                  </div>

                  {(stage.topics ?? []).map((topic: any) => {
                    const topicHasBar = topic.startDate && topic.endDate;
                    return (
                      <React.Fragment key={topic.id}>
                        <div className="gantt-row topic-row">
                          <div className="label-cell">
                            <span style={{ color: 'var(--text-3)', marginRight: 4, marginLeft: 16 }}>#</span>
                            <span className="truncate small b">{topic.name}</span>
                          </div>
                          <div className="timeline-cell" style={{ position: 'relative', backgroundImage: `repeating-linear-gradient(to right, var(--border) 0 1px, transparent 1px ${totalW / config.colCount}px)` }}>
                              {topicHasBar && (
                               <div
                                 className="gantt-bar accent-bar"
                                 style={{ left: getX(topic.startDate), width: getW(topic.startDate, topic.endDate), padding: 0 }}
                                 onMouseEnter={(e) => handleTooltipEnter(e, { title: topic.name, startDate: topic.startDate, endDate: topic.endDate, type: 'Tópico' })}
                                 onMouseMove={handleTooltipMove}
                                 onMouseLeave={handleTooltipLeave}
                               >
                                 <span style={{ padding: '0 8px' }}>{topic.name}</span>
                               </div>
                             )}
                          </div>
                        </div>

                        {(topic.subtopics ?? []).map((subtopic: any) => {
                          const subHasBar = subtopic.startDate && subtopic.endDate;
                          const isHighPrio = subtopic.priority === 'high';
                          return (
                            <div key={subtopic.id} className={`gantt-row subtopic-row ${isHighPrio ? 'high-prio-row' : ''}`} style={{ opacity: isHighPrio ? 1 : 0.8 }}>
                              <div className="label-cell">
                                <span style={{ color: isHighPrio ? 'var(--danger)' : 'var(--text-3)', marginRight: 4, marginLeft: 32 }}>{isHighPrio ? '!' : '-'}</span>
                                <span className={`truncate xs ${isHighPrio ? 'b' : ''}`}>{subtopic.name}</span>
                              </div>
                              <div className="timeline-cell" style={{ position: 'relative', backgroundImage: `repeating-linear-gradient(to right, var(--border) 0 1px, transparent 1px ${totalW / config.colCount}px)` }}>
                                {subHasBar && (
                                   <div
                                     className={`gantt-bar success-bar ${isHighPrio ? 'high-prio' : ''}`}
                                     style={{ left: getX(subtopic.startDate), width: getW(subtopic.startDate, subtopic.endDate), padding: 0 }}
                                     onMouseEnter={(e) => handleTooltipEnter(e, {
                                       title: subtopic.name,
                                       description: subtopic.description,
                                       startDate: subtopic.startDate,
                                       endDate: subtopic.endDate,
                                       type: subtopic.taskType === 'milestone' ? 'Marco' : subtopic.taskType === 'deliverable' ? 'Entrega' : 'Tarefa',
                                       priority: subtopic.priority === 'high' ? 'Alta' : subtopic.priority === 'med' ? 'Média' : 'Baixa',
                                       status: subtopic.status === 'done' ? 'Concluído' : subtopic.status === 'inprog' ? 'Em andamento' : subtopic.status === 'review' ? 'Revisão' : subtopic.status === 'blocked' ? 'Bloqueado' : 'A fazer',
                                       progress: subtopic.progress,
                                       responsible: subtopic.teams?.map((t: any) => t.team?.name).filter(Boolean).join(', '),
                                     })}
                                     onMouseMove={handleTooltipMove}
                                     onMouseLeave={handleTooltipLeave}
                                   >
                                     <Link 
                                       to={`/projects/${project.id}/stages/${stage.id}/topics/${topic.id}/subtopics/${subtopic.id}`}
                                       className="gantt-bar-link"
                                       style={{ padding: '0 8px', display: 'flex', alignItems: 'center', fontSize: 10 }}
                                     >
                                       {subtopic.name}
                                     </Link>
                                   </div>
                                 )}
                              </div>
                            </div>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: 12 }}>
        {/* Marcos críticos */}
        <div className="card">
          <div className="card-head">
            <div className="card-title">Marcos críticos</div>
            <span className="chip accent">{(milestones as any[]).length} marcos</span>
          </div>
          <div className="card-body flush">
            {(milestones as any[]).length > 0 ? (
              (milestones as any[]).map((m: any) => (
                <div key={m.id} className="list-item">
                  <span style={{ width: 8, height: 8, background: 'var(--warning)', transform: 'rotate(45deg)', flexShrink: 0 }} />
                  <span className="fill b small truncate">{m.name}</span>
                  <span className="xs faint">{formatDate(m.date)}</span>
                  <span className={`chip ${m.status === 'done' ? 'done' : m.status === 'missed' ? 'blocked' : 'review'} xs`}>
                    {m.status === 'done' ? 'concluído' : m.status === 'missed' ? 'atrasado' : 'pendente'}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                Nenhum marco cadastrado.
              </div>
            )}
          </div>
        </div>

        {/* Riscos & Dependências */}
        <div className="card">
          <div className="card-head">
            <div className="card-title">Riscos detectados</div>
            <span className="chip high">{activeRisks.length} ativos</span>
          </div>
          <div className="card-body flush">
            {activeRisks.length > 0 ? activeRisks.slice(0, 5).map((r) => (
              <div key={r.id} className="list-item" style={{ alignItems: 'flex-start' }}>
                <PrioChip priority={r.probability === 'high' ? 'high' : r.probability === 'med' ? 'med' : 'low'} />
                <div className="fill">
                  <div className="small b">{r.title}</div>
                  {r.description && (
                    <div className="xs faint">{r.description.slice(0, 80)}{r.description.length > 80 ? '…' : ''}</div>
                  )}
                </div>
              </div>
            )) : (
              <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                Nenhum risco ativo.
              </div>
            )}
          </div>
        </div>
      </div>

      {tooltip && (
        <div style={{
          position: 'fixed',
          left: tooltip.x + 12,
          top: tooltip.y + 12,
          zIndex: 99999,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '8px 12px',
          fontSize: 12,
          lineHeight: 1.5,
          boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          maxWidth: 320,
          pointerEvents: 'none',
        }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{tooltip.title}</div>
          {tooltip.description && (
            <div style={{ color: 'var(--text-2)', marginBottom: 6, lineHeight: 1.4, fontSize: 11 }}>{tooltip.description}</div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 11, color: 'var(--text-2)' }}>
            {tooltip.type && <span><span style={{ color: 'var(--text-3)' }}>Tipo:</span> {tooltip.type}</span>}
            {tooltip.status && <span><span style={{ color: 'var(--text-3)' }}>Status:</span> {tooltip.status}</span>}
            {tooltip.priority && <span><span style={{ color: 'var(--text-3)' }}>Prioridade:</span> {tooltip.priority}</span>}
            {tooltip.progress !== undefined && <span><span style={{ color: 'var(--text-3)' }}>Progresso:</span> {tooltip.progress}%</span>}
            {tooltip.startDate && <span><span style={{ color: 'var(--text-3)' }}>Início:</span> {formatDate(tooltip.startDate)}</span>}
            {tooltip.endDate && <span><span style={{ color: 'var(--text-3)' }}>Fim:</span> {formatDate(tooltip.endDate)}</span>}
            {tooltip.responsible && <span><span style={{ color: 'var(--text-3)' }}>Responsável:</span> {tooltip.responsible}</span>}
          </div>
        </div>
      )}
    </div>
  );
};
