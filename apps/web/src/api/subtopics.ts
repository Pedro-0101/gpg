import { api } from '@/lib/api';
import { Subtopic } from '@/types';
import { CreateSubtopicDto, UpdateSubtopicDto } from '@gpg/shared';

const base = (pid: string, sid: string, tid: string) =>
  `/projects/${pid}/stages/${sid}/topics/${tid}/subtopics`;

export const subtopicsApi = {
  list: (pid: string, sid: string, tid: string) =>
    api.get<Subtopic[]>(base(pid, sid, tid)).then((r) => r.data),
  get: (pid: string, sid: string, tid: string, id: string) =>
    api.get<Subtopic>(`${base(pid, sid, tid)}/${id}`).then((r) => r.data),
  create: (pid: string, sid: string, tid: string, data: CreateSubtopicDto) =>
    api.post<Subtopic>(base(pid, sid, tid), data).then((r) => r.data),
  update: (pid: string, sid: string, tid: string, id: string, data: UpdateSubtopicDto) =>
    api.patch<Subtopic>(`${base(pid, sid, tid)}/${id}`, data).then((r) => r.data),
  remove: (pid: string, sid: string, tid: string, id: string) =>
    api.delete(`${base(pid, sid, tid)}/${id}`),
  assignMember: (pid: string, sid: string, tid: string, id: string, memberId: string) =>
    api.post(`${base(pid, sid, tid)}/${id}/assignments`, { memberId }).then((r) => r.data),
  unassignMember: (pid: string, sid: string, tid: string, id: string, memberId: string) =>
    api.delete(`${base(pid, sid, tid)}/${id}/assignments/${memberId}`),
};
