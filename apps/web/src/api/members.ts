import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1',
});

export const membersApi = {
  list: (projectId: string) => 
    api.get(`/projects/${projectId}/members`).then(r => r.data),
  
  metrics: (projectId: string) => 
    api.get(`/projects/${projectId}/members/metrics`).then(r => r.data),
  
  create: (projectId: string, data: any) => 
    api.post(`/projects/${projectId}/members`, data).then(r => r.data),
  
  update: (projectId: string, id: string, data: any) => 
    api.put(`/projects/${projectId}/members/${id}`, data).then(r => r.data),
  
  remove: (projectId: string, id: string) => 
    api.delete(`/projects/${projectId}/members/${id}`).then(r => r.data),
};
