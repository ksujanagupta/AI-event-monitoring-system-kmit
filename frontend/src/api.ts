import { io } from 'socket.io-client';

export const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// fetch against the backend with the login token attached
export async function apiFetch(path: string, init: RequestInit = {}) {
  const token = localStorage.getItem('token');
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(`${API}${path}`, { ...init, headers });
  if (res.status === 401 && token) {
    localStorage.clear();
    window.location.href = '/login';
  }
  return res;
}

export const connectSocket = () => io(API, { auth: { token: localStorage.getItem('token') } });
