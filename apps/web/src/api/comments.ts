import { api } from '@/lib/api';
import type { SubtopicComment } from '@/types';

const base = (pid: string, sid: string, tid: string, subtopicId: string) =>
  `/projects/${pid}/stages/${sid}/topics/${tid}/subtopics/${subtopicId}/comments`;

export const commentsApi = {
  list: (pid: string, sid: string, tid: string, subtopicId: string) =>
    api.get<SubtopicComment[]>(base(pid, sid, tid, subtopicId)).then((r) => r.data),

  create: (
    pid: string,
    sid: string,
    tid: string,
    subtopicId: string,
    data: { content: string; authorName: string },
  ) =>
    api.post<SubtopicComment>(base(pid, sid, tid, subtopicId), data).then((r) => r.data),

  remove: (pid: string, sid: string, tid: string, subtopicId: string, id: string) =>
    api.delete(`${base(pid, sid, tid, subtopicId)}/${id}`),
};
