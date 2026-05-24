import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { stagesApi } from '../../api/stages';
import { milestonesApi, risksApi } from '../../api/risks-milestones';
import type { Risk } from '../../types';
import { formatDate } from '../../lib/utils';
import { differenceInDays, addMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PrioChip } from '../../components/ui/PrioChip';

interface GanttPageProps {
  project: any;
}

const COL_MONTHS = 6;
const DAY_W = 3.5; // px per day
const LABEL_W = 240;

function getX(date: string | Date, origin: Date) {
  return Math.max(0, differenceInDays(new Date(date), origin)) * DAY_W;
}
function getW(start: string | Date, end: string | Date) {
  return Math.max(4, differenceInDays(new Date(end), new Date(start)) * DAY_W);
}

export const GanttPage: React.FC<GanttPageProps> = ({ project }) => {
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

  const origin = project.startDate ? new Date(project.startDate) : new Date();
  const months = Array.from({ length: COL_MONTHS }, (_, i) => addMonths(origin, i));
  const totalDays = COL_MONTHS * 30;
  const totalW = totalDays * DAY_W;
  const todayX = getX(new Date(), origin);

  const activeRisks = (risks as Risk[]).filter((r) => r.status === 'active');

  // Bar color per stage index
  const STAGE_COLORS = ['var(--text)', 'var(--accent)', 'var(--success)', 'var(--purple)'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="page-head">
        <div>
          <div className="page-title">Linha do tempo · {project.name}</div>
          <div className="page-sub">Visualização por Etapa → Tópico · swimlanes</div>
        </div>
        <div className="seg">
          <button className="seg-btn active">Mês</button>
          <button className="seg-btn">Semana</button>
          <button className="seg-btn">Trimestre</button>
        </div>
      </div>

      {/* Gantt chart card */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="card-head">
          <div className="card-title">Cronograma</div>
          <div className="row xs faint" style={{ gap: 12 }}>
            <span><span style={{ display: 'inline-block', width: 12, height: 8, background: 'var(--text)', borderRadius: 2, marginRight: 4 }} />Etapa</span>
            <span><span style={{ display: 'inline-block', width: 12, height: 8, background: 'var(--accent)', borderRadius: 2, marginRight: 4 }} />Tópico</span>
            <span><span style={{ display: 'inline-block', width: 12, height: 8, background: 'var(--success)', borderRadius: 2, marginRight: 4 }} />Concluído</span>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <div className="gantt-wrap" style={{ minWidth: LABEL_W + totalW }}>
            {/* Single today marker spanning full chart height */}
            {todayX > 0 && todayX < totalW && (
              <div className="gantt-today" style={{ left: LABEL_W + todayX }} />
            )}
            {/* Header row */}
            <div className="gantt-head">
              <div className="cell">Etapas e tópicos</div>
              <div className="timeline-cols" style={{ gridTemplateColumns: `repeat(${COL_MONTHS}, ${totalW / COL_MONTHS}px)` }}>
                {months.map((m, i) => (
                  <span key={i}>{format(m, 'MMM yyyy', { locale: ptBR })}</span>
                ))}
              </div>
            </div>

            {/* Stage rows */}
            {(stages as any[]).map((stage, si) => {
              const stageColor = STAGE_COLORS[si % STAGE_COLORS.length];
              const hasBar = stage.startDate && stage.endDate;
              return (
                <React.Fragment key={stage.id}>
                  {/* Stage row */}
                  <div className="gantt-row stage-row">
                    <div className="label-cell">
                      <span
                        className="chip"
                        style={{
                          fontSize: 10, padding: '0 5px',
                          background: `color-mix(in srgb, ${stageColor} 12%, transparent)`,
                          color: stageColor,
                        }}
                      >
                        E{si + 1}
                      </span>
                      <span className="truncate">{stage.name}</span>
                      <span className="xs faint" style={{ marginLeft: 'auto', flexShrink: 0 }}>
                        {stage.topics?.reduce((n: number, t: any) => n + (t.subtopics?.length ?? 0), 0) || 0} tarefas
                      </span>
                    </div>
                    <div className="timeline-cell" style={{ position: 'relative' }}>
                      {hasBar && (
                        <div
                          className="gantt-bar stage-bar"
                          style={{
                            left: getX(stage.startDate, origin),
                            width: getW(stage.startDate, stage.endDate),
                          }}
                        >
                          {stage.name}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Topic rows */}
                  {(stage.topics ?? []).map((topic: any) => {
                    const topicHasBar = topic.startDate && topic.endDate;
                    return (
                      <div key={topic.id} className="gantt-row topic-row">
                        <div className="label-cell">
                          <span style={{ color: 'var(--text-3)', marginRight: 4 }}>#</span>
                          <span className="truncate">{topic.name}</span>
                          <span className="xs faint" style={{ marginLeft: 'auto', flexShrink: 0 }}>
                            {topic.subtopics?.length || 0}
                          </span>
                        </div>
                        <div className="timeline-cell" style={{ position: 'relative' }}>
                          {topicHasBar && (
                            <div
                              className="gantt-bar accent-bar"
                              style={{
                                left: getX(topic.startDate, origin),
                                width: getW(topic.startDate, topic.endDate),
                              }}
                            >
                              {topic.name}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </React.Fragment>
              );
            })}

            {stages.length === 0 && (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)' }}>
                Nenhuma etapa cadastrada.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: 12 }}>
        {/* Marcos críticos */}
        <div className="card">
          <div className="card-head">
            <div className="card-title">Marcos críticos</div>
            <span className="chip outline">{(milestones as any[]).length} marcos</span>
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
    </div>
  );
};
