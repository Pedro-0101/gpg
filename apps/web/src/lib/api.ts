import axios from 'axios';

export const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const message = err.response?.data?.message ?? 'Erro desconhecido';
    return Promise.reject(new Error(message));
  },
);
