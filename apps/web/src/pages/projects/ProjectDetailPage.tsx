import { Routes, Route, useParams, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '../../api/projects';
import { PageHead } from '../../components/ui/PageHead';
import { TabBar } from '../../components/ui/TabBar';
import { ProjectOverviewPage } from './ProjectOverviewPage';
import { StagesPage } from '../stages/StagesPage';
import { GanttPage } from '../stages/GanttPage';
import { MembersPage } from '../members/MembersPage';
import { CostsPage } from '../costs/CostsPage';
import { ReportsPage } from './ReportsPage';
import { StakeholdersPage } from '../stakeholders/StakeholdersPage';
import { ProfessionalsPage } from '../professionals/ProfessionalsPage';
import { Plus, MoreVertical } from 'lucide-react';

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();

  const { data: project, isLoading } = useQuery({
    queryKey: ['projects', projectId],
    queryFn: () => projectsApi.get(projectId!),
    enabled: !!projectId,
  });

  if (isLoading) return <div className="muted p-8">Carregando projeto...</div>;
  if (!project) return <div className="p-8">Projeto não encontrado.</div>;

  const tabs = [
    { to: '', label: 'Visão Geral', end: true },
    { to: 'stages', label: 'Tarefas' },
    { to: 'gantt', label: 'Gantt' },
    { to: 'team', label: 'Equipe' },
    { to: 'costs', label: 'Custos' },
    { to: 'stakeholders', label: 'Stakeholders' },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PageHead 
        title={project.name} 
        subtitle={project.description || 'Gestão estratégica do projeto'}
      >
        <button className="icon-btn ghost muted"><MoreVertical size={18} /></button>
        <button className="btn primary"><Plus size={14} /> Nova Tarefa</button>
      </PageHead>

      <TabBar tabs={tabs} />

      <div className="mt-2">
        <Routes>
          <Route index element={<ProjectOverviewPage project={project} />} />
          <Route path="stages/*" element={<StagesPage project={project} />} />
          <Route path="gantt" element={<GanttPage project={project} />} />
          <Route path="team" element={<MembersPage project={project} />} />
          <Route path="costs" element={<CostsPage project={project} />} />
          <Route path="reports" element={<ReportsPage project={project} />} />
          <Route path="stakeholders" element={<StakeholdersPage project={project} />} />
          <Route path="*" element={<Navigate to="" replace />} />
        </Routes>
      </div>
    </div>
  );
}
