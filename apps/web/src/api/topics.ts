import { api } from '@/lib/api';
import { Topic } from '@/types';
import { CreateTopicDto, UpdateTopicDto } from '@gpg/shared';

const base = (pid: string, sid: string) => `/projects/${pid}/stages/${sid}/topics`;

export const topicsApi = {
  list: (pid: string, sid: string) => api.get<Topic[]>(base(pid, sid)).then((r) => r.data),
  create: (pid: string, sid: string, data: CreateTopicDto) =>
    api.post<Topic>(base(pid, sid), data).then((r) => r.data),
  update: (pid: string, sid: string, id: string, data: UpdateTopicDto) =>
    api.patch<Topic>(`${base(pid, sid)}/${id}`, data).then((r) => r.data),
  remove: (pid: string, sid: string, id: string) => api.delete(`${base(pid, sid)}/${id}`),
};
