import { api } from '@/lib/api';
import type { TeamMember, MemberMetrics } from '@/types';

const base = (projectId: string) => `/projects/${projectId}/members`;

export const membersApi = {
  list: (projectId: string) =>
    api.get<TeamMember[]>(base(projectId)).then((r) => r.data),

  metrics: (projectId: string) =>
    api.get<MemberMetrics[]>(`${base(projectId)}/metrics`).then((r) => r.data),

  create: (projectId: string, data: Partial<TeamMember>) =>
    api.post<TeamMember>(base(projectId), data).then((r) => r.data),

  update: (projectId: string, id: string, data: Partial<TeamMember>) =>
    api.patch<TeamMember>(`${base(projectId)}/${id}`, data).then((r) => r.data),

  remove: (projectId: string, id: string) =>
    api.delete(`${base(projectId)}/${id}`),
};
