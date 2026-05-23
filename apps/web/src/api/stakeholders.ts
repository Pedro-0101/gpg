import { api } from '@/lib/api';
import { Stakeholder } from '@/types';
import { CreateStakeholderDto, UpdateStakeholderDto } from '@gpg/shared';

const base = (pid: string) => `/projects/${pid}/stakeholders`;

export const stakeholdersApi = {
  list: (pid: string) => api.get<Stakeholder[]>(base(pid)).then((r) => r.data),
  create: (pid: string, data: CreateStakeholderDto) =>
    api.post<Stakeholder>(base(pid), data).then((r) => r.data),
  update: (pid: string, id: string, data: UpdateStakeholderDto) =>
    api.patch<Stakeholder>(`${base(pid)}/${id}`, data).then((r) => r.data),
  remove: (pid: string, id: string) => api.delete(`${base(pid)}/${id}`),
};
