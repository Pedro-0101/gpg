import { api } from '@/lib/api';
import { Professional } from '@/types';
import { CreateProfessionalDto, UpdateProfessionalDto } from '@gpg/shared';

const base = (pid: string) => `/projects/${pid}/professionals`;

export const professionalsApi = {
  list: (pid: string) => api.get<Professional[]>(base(pid)).then((r) => r.data),
  create: (pid: string, data: CreateProfessionalDto) =>
    api.post<Professional>(base(pid), data).then((r) => r.data),
  update: (pid: string, id: string, data: UpdateProfessionalDto) =>
    api.patch<Professional>(`${base(pid)}/${id}`, data).then((r) => r.data),
  remove: (pid: string, id: string) => api.delete(`${base(pid)}/${id}`),
};
