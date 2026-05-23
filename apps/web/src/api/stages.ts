import { api } from '@/lib/api';
import { Stage } from '@/types';
import { CreateStageDto, UpdateStageDto } from '@gpg/shared';

const base = (pid: string) => `/projects/${pid}/stages`;

export const stagesApi = {
  list: (pid: string) => api.get<Stage[]>(base(pid)).then((r) => r.data),
  create: (pid: string, data: CreateStageDto) =>
    api.post<Stage>(base(pid), data).then((r) => r.data),
  update: (pid: string, id: string, data: UpdateStageDto) =>
    api.patch<Stage>(`${base(pid)}/${id}`, data).then((r) => r.data),
  remove: (pid: string, id: string) => api.delete(`${base(pid)}/${id}`),
};
