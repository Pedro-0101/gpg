import { api } from '@/lib/api';
import { Team } from '@/types';
import { CreateTeamDto, UpdateTeamDto } from '@gpg/shared';

const base = (pid: string) => `/projects/${pid}/teams`;

export const teamsApi = {
  list: (pid: string) => api.get<Team[]>(base(pid)).then((r) => r.data),
  get: (pid: string, id: string) => api.get<Team>(`${base(pid)}/${id}`).then((r) => r.data),
  create: (pid: string, data: CreateTeamDto) => api.post<Team>(base(pid), data).then((r) => r.data),
  update: (pid: string, id: string, data: UpdateTeamDto) =>
    api.patch<Team>(`${base(pid)}/${id}`, data).then((r) => r.data),
  remove: (pid: string, id: string) => api.delete(`${base(pid)}/${id}`),
};
