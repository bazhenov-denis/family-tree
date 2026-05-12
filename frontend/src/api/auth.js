import client from './client.js';

export const login = (data) =>
  client.request('/api/auth/login', { method: 'POST', body: JSON.stringify(data) });

export const register = (data) =>
  client.request('/api/auth/register', { method: 'POST', body: JSON.stringify(data) });

export const verifyEmail = (token) =>
  client.request(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);

export const resendVerification = (data) =>
  client.request('/api/auth/resend-verification', { method: 'POST', body: JSON.stringify(data) });
