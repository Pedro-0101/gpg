import { Routes, Route, useParams, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '../../api/projects';
import { PageHead } from '../../components/ui/PageHead';
import { TabBar } from '../../components/ui/TabBar';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { ProjectOverviewPage } from './ProjectOverviewPage';
import { StagesPage } from '../stages/StagesPage';
import { GanttPage } from '../stages/GanttPage';
import { CostsPage } from '../costs/CostsPage';
import { ReportsPage } from './ReportsPage';
import { StakeholdersPage } from '../stakeholders/StakeholdersPage';
import { ProfessionalsPage } from '../professionals/ProfessionalsPage';
import { TeamsPage } from '../teams/TeamsPage';
import { Plus } from 'lucide-react';

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();

  const { data: project, isLoading } = useQuery({
    queryKey: ['projects', projectId],
    queryFn: () => projectsApi.get(projectId!),
    enabled: !!projectId,
  });

  if (isLoading) return <div className="faint" style={{ padding: 32 }}>Carregando projeto...</div>;
  if (!project) return <div style={{ padding: 32 }}>Projeto não encontrado.</div>;

  const tabs = [
    { to: '', label: 'Visão Geral', end: true },
    { to: 'stages', label: 'Tarefas' },
    { to: 'gantt', label: 'Gantt' },
    { to: 'teams', label: 'Equipes' },
    { to: 'costs', label: 'Custos' },
    { to: 'stakeholders', label: 'Stakeholders' },
    { to: 'professionals', label: 'Profissionais' },
    { to: 'reports', label: 'Relatórios' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <PageHead
        title={project.name}
        subtitle={project.description || 'Gestão estratégica do projeto'}
      >
        <button className="btn ghost"><Plus size={14} /> Nova Tarefa</button>
      </PageHead>

      <TabBar tabs={tabs} />

      <ErrorBoundary>
        <Routes>
          <Route index element={<ProjectOverviewPage project={project} />} />
          <Route path="stages/*" element={<StagesPage project={project} />} />
          <Route path="gantt" element={<GanttPage project={project} />} />
          <Route path="teams" element={<TeamsPage project={project} />} />
          <Route path="costs" element={<CostsPage project={project} />} />
          <Route path="reports" element={<ReportsPage project={project} />} />
          <Route path="stakeholders" element={<StakeholdersPage project={project} />} />
          <Route path="professionals" element={<ProfessionalsPage project={project} />} />
          <Route path="*" element={<Navigate to="" replace />} />
        </Routes>
      </ErrorBoundary>
    </div>
  );
}
