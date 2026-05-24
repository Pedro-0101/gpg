import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, LayoutGrid, List } from 'lucide-react';
import { stagesApi } from '../../api/stages';
import { cn } from '../../lib/utils';
import { TaskListView } from './TaskListView';
import { TaskKanbanView } from './TaskKanbanView';
import { TaskDetailPage } from './TaskDetailPage';
import { Routes, Route } from 'react-router-dom';

interface StagesPageProps {
  project: any;
}

type ViewType = 'list' | 'kanban';

export function StagesPage({ project }: StagesPageProps) {
  const [view, setView] = useState<ViewType>('list');

  const { data: stages = [], isLoading } = useQuery({
    queryKey: ['stages', project.id],
    queryFn: () => stagesApi.list(project.id),
  });

  return (
    <Routes>
      <Route path=":stageId/topics/:topicId/subtopics/:id" element={<TaskDetailPage />} />
      <Route path="/" element={
        <div className="flex flex-col gap-6">
          {/* View Switcher and Actions */}
          <div className="row between">
            <div className="seg">
              <button 
                className={cn('seg-btn row gap-2', view === 'list' && 'active')}
                onClick={() => setView('list')}
              >
                <List size={14} />
                Lista
              </button>
              <button 
                className={cn('seg-btn row gap-2', view === 'kanban' && 'active')}
                onClick={() => setView('kanban')}
              >
                <LayoutGrid size={14} />
                Kanban
              </button>
            </div>

            <div className="row gap-2">
               <button className="btn sm">Filtros</button>
               <button className="btn sm primary"><Plus size={14} /> Nova Etapa</button>
            </div>
          </div>

          {isLoading ? (
            <div className="muted p-8 text-center">Carregando tarefas...</div>
          ) : (
            <div className="flex flex-col gap-8">
              {view === 'list' ? (
                <TaskListView project={project} stages={stages} />
              ) : (
                <TaskKanbanView project={project} stages={stages} />
              )}
            </div>
          )}
        </div>
      } />
    </Routes>
  );
}
