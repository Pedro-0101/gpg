import { api } from '@/lib/api';
import type { CostEntry, CostSummary } from '@/types';

export const costsApi = {
  list: (projectId: string) =>
    api.get<CostEntry[]>(`/projects/${projectId}/costs`).then((r) => r.data),

  summary: (projectId: string) =>
    api.get<CostSummary>(`/projects/${projectId}/costs/summary`).then((r) => r.data),

  create: (projectId: string, data: any) =>
    api.post<CostEntry>(`/projects/${projectId}/costs`, data).then((r) => r.data),

  remove: (projectId: string, id: string) =>
    api.delete(`/projects/${projectId}/costs/${id}`),
};
