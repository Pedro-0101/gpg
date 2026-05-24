import { api } from '@/lib/api';
import type { Risk, Milestone } from '@/types';

export const risksApi = {
  list: (projectId: string) =>
    api.get<Risk[]>(`/projects/${projectId}/risks`).then((r) => r.data),
  create: (projectId: string, data: any) =>
    api.post<Risk>(`/projects/${projectId}/risks`, data).then((r) => r.data),
  update: (projectId: string, id: string, data: any) =>
    api.patch<Risk>(`/projects/${projectId}/risks/${id}`, data).then((r) => r.data),
  remove: (projectId: string, id: string) =>
    api.delete(`/projects/${projectId}/risks/${id}`),
};

export const milestonesApi = {
  list: (projectId: string) =>
    api.get<Milestone[]>(`/projects/${projectId}/milestones`).then((r) => r.data),
  create: (projectId: string, data: any) =>
    api.post<Milestone>(`/projects/${projectId}/milestones`, data).then((r) => r.data),
  update: (projectId: string, id: string, data: any) =>
    api.patch<Milestone>(`/projects/${projectId}/milestones/${id}`, data).then((r) => r.data),
  remove: (projectId: string, id: string) =>
    api.delete(`/projects/${projectId}/milestones/${id}`),
};
