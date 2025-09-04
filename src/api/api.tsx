import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:5000', // your backend
  headers: { 'Content-Type': 'application/json' },
});

export const get = (url: string) => api.get(url).then(res => res.data);
export const post = (url: string, data: any) => api.post(url, data).then(res => res.data);
export const put = (url: string, data: any) => api.put(url, data).then(res => res.data);
export const remove = (url: string) => api.delete(url).then(res => res.data);
