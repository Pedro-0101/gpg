import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1',
});

export const commentsApi = {
  list: (projectId: string, stageId: string, topicId: string, subtopicId: string) => 
    api.get(`/projects/${projectId}/stages/${stageId}/topics/${topicId}/subtopics/${subtopicId}/comments`).then(r => r.data),
  
  create: (projectId: string, stageId: string, topicId: string, subtopicId: string, data: any) => 
    api.post(`/projects/${projectId}/stages/${stageId}/topics/${topicId}/subtopics/${subtopicId}/comments`, data).then(r => r.data),
  
  remove: (projectId: string, stageId: string, topicId: string, subtopicId: string, id: string) => 
    api.delete(`/projects/${projectId}/stages/${stageId}/topics/${topicId}/subtopics/${subtopicId}/comments/${id}`).then(r => r.data),
};
