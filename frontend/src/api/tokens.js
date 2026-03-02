import client from './client.js';

export const resolveToken = (token) =>
  client.request(`/api/invites/${token}`);

export const acceptByToken = (token) =>
  client.request(`/api/invites/${token}/accept`, { method: 'POST' });
