import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stagesApi } from '../../api/stages';
import { cn } from '../../lib/utils';
import { TaskListView } from './TaskListView';
import { TaskKanbanView } from './TaskKanbanView';
import { TaskDetailPage } from './TaskDetailPage';
import { CsvImportModal } from './CsvImportModal';
import { fetchAndGenerateCsv, downloadCsv } from '../../lib/csv-tasks';
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
  const [showImport, setShowImport] = useState(false);
  const [exporting, setExporting] = useState(false);

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="page-head">
            <div>
              <div className="page-title">Tarefas · {project.name}</div>
              <div className="page-sub">Agrupado por etapa</div>
            </div>
            <div className="row" style={{ gap: 8 }}>
              <div className="seg">
                <button className={cn('seg-btn', view === 'list' && 'active')} onClick={() => setView('list')}>Lista</button>
                <button className={cn('seg-btn', view === 'kanban' && 'active')} onClick={() => setView('kanban')}>Kanban</button>
              </div>
              <button className="btn ghost" onClick={() => setShowImport(true)}>↑ Importar CSV</button>
              <button
                className="btn ghost"
                disabled={exporting}
                onClick={async () => {
                  setExporting(true);
                  try {
                    const csv = await fetchAndGenerateCsv(project.id);
                    downloadCsv(`${project.name}-tarefas.csv`, csv);
                  } finally {
                    setExporting(false);
                  }
                }}
              >
                {exporting ? '...' : '↓ Exportar CSV'}
              </button>
              <button className="btn primary" onClick={() => setShowNewStage(true)}>
                + Nova Etapa
              </button>
            </div>
          </div>

          {showNewStage && (
            <div className="card" style={{ padding: 14 }}>
              <div className="xs faint" style={{ marginBottom: 8 }}>Nova etapa</div>
              <div className="row" style={{ gap: 8 }}>
                <input
                  style={{ flex: 1, padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: 13 }}
                  placeholder="Nome da etapa (ex: Discovery, Design, Desenvolvimento)"
                  value={stageName}
                  onChange={(e) => setStageName(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateStage();
                    if (e.key === 'Escape') { setShowNewStage(false); setStageName(''); }
                  }}
                />
                <button className="btn primary sm" disabled={!stageName.trim() || createStageMutation.isPending} onClick={handleCreateStage}>
                  {createStageMutation.isPending ? '...' : 'Criar'}
                </button>
                <button className="btn ghost sm" onClick={() => { setShowNewStage(false); setStageName(''); }}>✕</button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="faint" style={{ padding: 32, textAlign: 'center' }}>Carregando...</div>
          ) : stages.length === 0 ? (
            <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-3)' }}>
              <div style={{ marginBottom: 12 }}>Nenhuma etapa cadastrada.</div>
              <div className="row" style={{ gap: 8, justifyContent: 'center' }}>
                <button className="btn primary" onClick={() => setShowNewStage(true)}>+ Criar primeira etapa</button>
                <button className="btn ghost" onClick={() => setShowImport(true)}>↑ Importar CSV</button>
              </div>
            </div>
          ) : view === 'list' ? (
            <TaskListView project={project} stages={stages} />
          ) : (
            <TaskKanbanView project={project} stages={stages} />
          )}

          {showImport && (
            <CsvImportModal projectId={project.id} onClose={() => setShowImport(false)} />
          )}
        </div>
      } />
    </Routes>
  );
}
