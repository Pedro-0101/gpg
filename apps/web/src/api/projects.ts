import { api } from '@/lib/api';
import { Project, ProjectSummary } from '@/types';
import { CreateProjectDto, UpdateProjectDto } from '@gpg/shared';

const base = '/projects';

export const projectsApi = {
  list: () => api.get<Project[]>(base).then((r) => r.data),
  summaries: () => api.get<ProjectSummary[]>(`${base}/summaries`).then((r) => r.data),
  get: (id: string) => api.get<Project>(`${base}/${id}`).then((r) => r.data),
  create: (data: CreateProjectDto) => api.post<Project>(base, data).then((r) => r.data),
  update: (id: string, data: UpdateProjectDto) =>
    api.patch<Project>(`${base}/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`${base}/${id}`),
  recalculate: (id: string) => api.post(`${base}/${id}/recalculate`),
};
