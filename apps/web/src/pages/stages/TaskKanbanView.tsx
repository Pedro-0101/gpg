import React from 'react';
import { Avatar } from '../../components/ui/Avatar';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { cn } from '../../lib/utils';
import { Clock } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

interface TaskKanbanViewProps {
  project: any;
  stages: any[];
}

const KANBAN_COLUMNS = [
  { id: 'todo', label: 'A fazer' },
  { id: 'inprog', label: 'Em progresso' },
  { id: 'review', label: 'Em revisão' },
  { id: 'done', label: 'Concluído' }
];

export const TaskKanbanView: React.FC<TaskKanbanViewProps> = ({ project, stages }) => {
  return (
    <div className="flex flex-col gap-12">
      {stages.map((stage) => (
        <div key={stage.id} className="flex flex-col gap-4">
          <div className="row gap-2">
             <div 
               className="w-2 h-6 rounded-full" 
               style={{ background: project.color }} 
             />
             <h3 className="text-lg font-bold">{stage.name}</h3>
             <span className="count muted text-sm ml-2">
                {stage.topics?.reduce((acc: number, t: any) => acc + (t.subtopics?.length || 0), 0)} tarefas
             </span>
          </div>

          <div className="kanban">
            {KANBAN_COLUMNS.map((col) => {
              // Filtrar tarefas desta etapa que pertencem a este status
              const stageTasks = stage.topics?.flatMap((t: any) => 
                t.subtopics?.filter((sub: any) => sub.status === col.id) || []
              ) || [];

              return (
                <div key={col.id} className="kanban-col">
                  <div className="kanban-col-head">
                    {col.label}
                    <span className="count">{stageTasks.length}</span>
                  </div>
                  
                  <div className="flex flex-col gap-3 min-h-[100px]">
                    {stageTasks.map((task: any) => (
                      <KanbanCard key={task.id} task={task} stageId={stage.id} topicId={task.topicId} />
                    ))}
                    {stageTasks.length === 0 && (
                      <div className="border border-dashed border-border/50 rounded-lg p-4 text-center text-xs muted italic">
                        Sem tarefas
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

const KanbanCard: React.FC<{ task: any, stageId: string, topicId: string }> = ({ task, stageId, topicId }) => {
  const { projectId } = useParams();
  
  return (
    <div className="kanban-card">
      <div className="row between mb-1">
         <span className="chip outline xs">{task.topicName || 'Tarefa'}</span>
         <span className={cn(
            'chip xs outline',
            task.priority === 'high' && 'blocked',
            task.priority === 'med' && 'review'
         )}>
           {task.priority?.toUpperCase() || 'MED'}
         </span>
      </div>
      
      <Link to={`/projects/${projectId}/stages/${stageId}/topics/${topicId}/subtopics/${task.id}`} className="title hover:text-accent font-semibold block mb-1">
        {task.name}
      </Link>
      
      {task.status === 'inprog' && (
        <div className="col gap-1 mt-1">
           <div className="row between xs muted mono">
              <span>Progresso</span>
              <span>{task.progress}%</span>
           </div>
           <ProgressBar progress={task.progress} />
        </div>
      )}

      <div className="foot mt-2">
        <div className="row gap-1 muted xs">
           <Clock size={12} />
           <span>{task.durationHours}h</span>
        </div>
        
        <div className="av-stack">
           {task.assignments?.map((a: any) => (
              <Avatar 
                key={a.member.id} 
                initials={a.member.initials} 
                colorIndex={a.member.avatarColor} 
                size="sm" 
              />
           ))}
           {(!task.assignments || task.assignments.length === 0) && (
              <Avatar initials="?" colorIndex={8} size="sm" />
           )}
        </div>
      </div>
    </div>
  );
};
