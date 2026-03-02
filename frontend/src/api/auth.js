import client from './client.js';

export const login = (data) =>
  client.request('/api/auth/login', { method: 'POST', body: JSON.stringify(data) });

export const register = (data) =>
  client.request('/api/auth/register', { method: 'POST', body: JSON.stringify(data) });
