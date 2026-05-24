import { api } from '@/lib/api';
import type { SubtopicAttachment } from '@/types';

const base = (pid: string, sid: string, tid: string, subtopicId: string) =>
  `/projects/${pid}/stages/${sid}/topics/${tid}/subtopics/${subtopicId}/attachments`;

export const attachmentsApi = {
  list: (pid: string, sid: string, tid: string, subtopicId: string) =>
    api.get<SubtopicAttachment[]>(base(pid, sid, tid, subtopicId)).then((r) => r.data),

  create: (
    pid: string,
    sid: string,
    tid: string,
    subtopicId: string,
    data: { name: string; url: string; mimeType?: string; size?: number; isExternal?: boolean },
  ) =>
    api
      .post<SubtopicAttachment>(base(pid, sid, tid, subtopicId), data)
      .then((r) => r.data),

  remove: (pid: string, sid: string, tid: string, subtopicId: string, id: string) =>
    api.delete(`${base(pid, sid, tid, subtopicId)}/${id}`),
};
