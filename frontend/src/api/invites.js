import client from './client.js';

export const getMyInvites = () =>
  client.request('/api/my/invites');

export const createInvite = (treeId, data) =>
  client.request(`/api/trees/${treeId}/invites`, { method: 'POST', body: JSON.stringify(data) });

export const acceptInvite = (treeId, inviteId) =>
  client.request(`/api/trees/${treeId}/invites/${inviteId}/accept`, { method: 'POST' });

export const declineInvite = (treeId, inviteId) =>
  client.request(`/api/trees/${treeId}/invites/${inviteId}/decline`, { method: 'POST' });
