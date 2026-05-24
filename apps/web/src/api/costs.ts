import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1',
});

export const costsApi = {
  list: (projectId: string) => 
    api.get(`/projects/${projectId}/costs`).then(r => r.data),
  
  summary: (projectId: string) => 
    api.get(`/projects/${projectId}/costs/summary`).then(r => r.data),
  
  create: (projectId: string, data: any) => 
    api.post(`/projects/${projectId}/costs`, data).then(r => r.data),
  
  remove: (projectId: string, id: string) => 
    api.delete(`/projects/${projectId}/costs/${id}`).then(r => r.data),
};
