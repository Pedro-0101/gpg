import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, LayoutGrid, List, X, Check } from 'lucide-react';
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
  const qc = useQueryClient();
  const [view, setView] = useState<ViewType>('list');
  const [showNewStage, setShowNewStage] = useState(false);
  const [stageName, setStageName] = useState('');

  const { data: stages = [], isLoading } = useQuery({
    queryKey: ['stages', project.id],
    queryFn: () => stagesApi.list(project.id),
  });

  const createStageMutation = useMutation({
    mutationFn: (name: string) =>
      stagesApi.create(project.id, { name, order: stages.length + 1 }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stages', project.id] });
      setShowNewStage(false);
      setStageName('');
    },
  });

  function handleCreateStage() {
    const trimmed = stageName.trim();
    if (!trimmed) return;
    createStageMutation.mutate(trimmed);
  }

  return (
    <Routes>
      <Route path=":stageId/topics/:topicId/subtopics/:id" element={<TaskDetailPage />} />
      <Route index element={
        <div className="flex flex-col gap-6">
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
              <button className="btn sm" disabled>Filtros</button>
              <button className="btn sm primary" onClick={() => setShowNewStage(true)}>
                <Plus size={14} /> Nova Etapa
              </button>
            </div>
          </div>

          {showNewStage && (
            <div className="card p-4 flex flex-col gap-3 border-accent/30">
              <div className="xs muted font-bold uppercase">Nova Etapa</div>
              <div className="row gap-2">
                <input
                  className="input fill"
                  placeholder="Nome da etapa (ex: Discovery, Design, Desenvolvimento)"
                  value={stageName}
                  onChange={(e) => setStageName(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateStage();
                    if (e.key === 'Escape') { setShowNewStage(false); setStageName(''); }
                  }}
                />
                <button
                  className="btn primary sm"
                  disabled={!stageName.trim() || createStageMutation.isPending}
                  onClick={handleCreateStage}
                >
                  <Check size={14} /> {createStageMutation.isPending ? '...' : 'Criar'}
                </button>
                <button
                  className="btn ghost sm"
                  onClick={() => { setShowNewStage(false); setStageName(''); }}
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="muted p-8 text-center">Carregando tarefas...</div>
          ) : stages.length === 0 ? (
            <div className="card p-12 text-center muted italic border-dashed flex flex-col gap-3 items-center">
              <div>Nenhuma etapa cadastrada.</div>
              <button className="btn primary sm" onClick={() => setShowNewStage(true)}>
                <Plus size={14} /> Criar primeira etapa
              </button>
            </div>
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
