import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { stagesApi } from '../../api/stages';
import { milestonesApi, risksApi } from '../../api/risks-milestones';
import { formatDate } from '../../lib/utils';
import { differenceInDays, startOfMonth, addMonths, format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertTriangle } from 'lucide-react';

interface GanttPageProps {
  project: any;
}

export const GanttPage: React.FC<GanttPageProps> = ({ project }) => {
  const { data: stages = [] } = useQuery({
    queryKey: ['stages', project.id],
    queryFn: () => stagesApi.list(project.id)
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones', project.id],
    queryFn: () => milestonesApi.list(project.id)
  });

  // Configurações do gráfico
  const dayWidth = 4; // pixels por dia
  const rowHeight = 36;
  const headerHeight = 60;
  
  const startDate = startOfMonth(new Date(project.startDate));
  const endDate = addMonths(startDate, 6); // Visualização de 6 meses
  const totalDays = differenceInDays(endDate, startDate);
  const chartWidth = totalDays * dayWidth;

  const getX = (date: Date) => differenceInDays(new Date(date), startDate) * dayWidth;

  return (
    <div className="flex flex-col gap-6">
      <div className="row between">
         <div>
            <h2 className="text-xl font-bold">Gráfico de Gantt</h2>
            <p className="xs muted uppercase tracking-widest font-bold">Visualização por Swimlanes</p>
         </div>
         <div className="seg">
            <button className="seg-btn active">Semana</button>
            <button className="seg-btn">Mês</button>
            <button className="seg-btn">Trimestre</button>
         </div>
      </div>

      <Card className="overflow-hidden">
        <div className="flex overflow-x-auto bg-surface">
          {/* Listagem lateral fixa */}
          <div className="w-64 border-r border-border shrink-0 z-10 bg-surface">
             <div style={{ height: headerHeight }} className="border-bottom flex items-end p-3 font-bold xs muted uppercase">Etapas e Tópicos</div>
             {stages.map((stage: any) => (
                <React.Fragment key={stage.id}>
                   <div style={{ height: rowHeight }} className="flex items-center px-4 b small bg-surface-2">{stage.name}</div>
                   {stage.topics?.map((topic: any) => (
                      <div key={topic.id} className="flex items-center px-8 small truncate" style={{ height: rowHeight }}>
                         {topic.name}
                      </div>
                   ))}
                </React.Fragment>
             ))}
          </div>

          {/* Timeline SVG */}
          <div className="relative" style={{ width: chartWidth }}>
             {/* Header - Meses e Dias */}
             <svg width={chartWidth} height={headerHeight} className="border-bottom sticky top-0 bg-surface z-20">
                {Array.from({ length: 6 }).map((_, i) => {
                   const m = addMonths(startDate, i);
                   const x = getX(m);
                   return (
                      <g key={i}>
                         <text x={x + 10} y={20} className="xs b fill-text-2 uppercase">{format(m, 'MMMM yyyy', { locale: ptBR })}</text>
                         <line x1={x} y1={0} x2={x} y2={headerHeight} stroke="var(--border)" />
                      </g>
                   );
                })}
             </svg>

             <div className="relative">
                {/* Background Grid */}
                <svg width={chartWidth} height={rowHeight * 20} className="absolute inset-0 pointer-events-none">
                   {Array.from({ length: totalDays / 7 }).map((_, i) => (
                      <line key={i} x1={i * 7 * dayWidth} y1={0} x2={i * 7 * dayWidth} y2="100%" stroke="var(--surface-3)" strokeWidth="1" />
                   ))}
                   {/* Today Line */}
                   <line x1={getX(new Date())} y1={0} x2={getX(new Date())} y2="100%" stroke="var(--danger)" strokeWidth="1.5" strokeDasharray="4 2" />
                </svg>

                {/* Bars */}
                <div className="flex flex-col">
                   {stages.map((stage: any) => (
                      <React.Fragment key={stage.id}>
                         {/* Stage Bar */}
                         <div style={{ height: rowHeight }} className="relative bg-surface-2/30">
                            {stage.startDate && stage.endDate && (
                               <div 
                                 className="absolute top-2 h-4 rounded-full opacity-40"
                                 style={{ 
                                    left: getX(stage.startDate), 
                                    width: (differenceInDays(new Date(stage.endDate), new Date(stage.startDate)) + 1) * dayWidth,
                                    backgroundColor: project.color
                                 }}
                               />
                            )}
                         </div>
                         {/* Topic Bars */}
                         {stage.topics?.map((topic: any) => (
                            <div key={topic.id} style={{ height: rowHeight }} className="relative border-bottom border-border/10">
                               {topic.startDate && topic.endDate && (
                                  <div 
                                    className="absolute top-2 h-5 rounded-md flex items-center px-2 group cursor-pointer"
                                    style={{ 
                                       left: getX(topic.startDate), 
                                       width: (differenceInDays(new Date(topic.endDate), new Date(topic.startDate)) + 1) * dayWidth,
                                       backgroundColor: 'var(--accent)',
                                       color: 'white'
                                    }}
                                  >
                                     <div className="absolute left-full ml-2 opacity-0 group-hover:opacity-100 bg-surface shadow-lg border border-border p-2 rounded text-xs text-text z-50 pointer-events-none whitespace-nowrap">
                                        {topic.name} <br/>
                                        <span className="muted">{formatDate(topic.startDate)} - {formatDate(topic.endDate)}</span>
                                     </div>
                                  </div>
                               )}
                            </div>
                         ))}
                      </React.Fragment>
                   ))}
                </div>

                {/* Milestones (Losangos) */}
                <svg width={chartWidth} height="100%" className="absolute inset-0 pointer-events-none">
                   {milestones.map((m: any) => {
                      const x = getX(m.date);
                      return (
                         <g key={m.id}>
                            <rect 
                              x={x - 6} y={15} width={12} height={12} 
                              transform={`rotate(45, ${x}, 21)`} 
                              fill="var(--accent)" 
                              className="pointer-events-auto cursor-help"
                            />
                            <text x={x + 10} y={24} className="xs b fill-accent">{m.name}</text>
                         </g>
                      );
                   })}
                </svg>
             </div>
          </div>
        </div>
      </Card>

      {/* Risks / Legend */}
      <div className="grid grid-cols-3 gap-6">
         <Card className="col-span-2">
            <CardHeader title="Riscos Detectados no Cronograma" />
            <CardBody className="flex flex-col gap-3">
               <div className="row gap-3 p-2 rounded bg-danger-soft">
                  <AlertTriangle className="text-danger" size={18} />
                  <div className="fill">
                     <div className="small b text-danger">Atraso Crítico na Etapa 2</div>
                     <div className="xs text-danger/80">O tópico "Design de UI" está 4 dias atrasado em relação ao milestone de aprovação.</div>
                  </div>
                  <button className="btn sm">Ver Tarefas</button>
               </div>
            </CardBody>
         </Card>

         <Card>
            <CardHeader title="Legenda" />
            <CardBody className="flex flex-col gap-2">
               <div className="row gap-2 xs muted"><div className="w-3 h-3 rounded bg-accent" /> Tópico Planejado</div>
               <div className="row gap-2 xs muted"><div className="w-3 h-3 rounded-full opacity-40 bg-accent" /> Período da Etapa</div>
               <div className="row gap-2 xs muted"><div className="w-3 h-3 rotate-45 bg-accent" /> Milestone (Marco)</div>
               <div className="row gap-2 xs muted"><div className="w-3 h-3 bg-danger" /> Linha de Hoje</div>
            </CardBody>
         </Card>
      </div>
    </div>
  );
};
