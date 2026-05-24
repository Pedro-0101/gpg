import { api } from '@/lib/api';
import type { Decision } from '@/types';

const base = (projectId: string) => `/projects/${projectId}/decisions`;

export const decisionsApi = {
  list: (projectId: string) =>
    api.get<Decision[]>(base(projectId)).then((r) => r.data),

  create: (projectId: string, data: Partial<Decision>) =>
    api.post<Decision>(base(projectId), data).then((r) => r.data),

  update: (projectId: string, id: string, data: Partial<Decision>) =>
    api.patch<Decision>(`${base(projectId)}/${id}`, data).then((r) => r.data),

  remove: (projectId: string, id: string) =>
    api.delete(`${base(projectId)}/${id}`),
};
