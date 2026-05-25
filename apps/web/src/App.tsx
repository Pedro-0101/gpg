import { Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ProjectsPage } from '@/pages/projects/ProjectsPage';
import { ProjectDetailPage } from '@/pages/projects/ProjectDetailPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { GlobalTeamPage } from '@/pages/global/GlobalTeamPage';
import { GlobalCostsPage } from '@/pages/global/GlobalCostsPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/:projectId/*" element={<ProjectDetailPage />} />
        <Route path="equipe" element={<GlobalTeamPage />} />
        <Route path="custos" element={<GlobalCostsPage />} />
      </Route>
    </Routes>
  );
}
