import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1',
});

export const risksApi = {
  list: (projectId: string) => api.get(`/projects/${projectId}/risks`).then(r => r.data),
  create: (projectId: string, data: any) => api.post(`/projects/${projectId}/risks`, data).then(r => r.data),
  update: (projectId: string, id: string, data: any) => api.put(`/projects/${projectId}/risks/${id}`, data).then(r => r.data),
  remove: (projectId: string, id: string) => api.delete(`/projects/${projectId}/risks/${id}`).then(r => r.data),
};

export const milestonesApi = {
  list: (projectId: string) => api.get(`/projects/${projectId}/milestones`).then(r => r.data),
  create: (projectId: string, data: any) => api.post(`/projects/${projectId}/milestones`, data).then(r => r.data),
  update: (projectId: string, id: string, data: any) => api.put(`/projects/${projectId}/milestones/${id}`, data).then(r => r.data),
  remove: (projectId: string, id: string) => api.delete(`/projects/${projectId}/milestones/${id}`).then(r => r.data),
};
