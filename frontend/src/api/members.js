import client from './client.js';

export const getMembers = (treeId) =>
  client.request(`/api/trees/${treeId}/members`);

export const addMember = (treeId, data) =>
  client.request(`/api/trees/${treeId}/members`, { method: 'POST', body: JSON.stringify(data) });

export const changeMemberRole = (treeId, userId, role) =>
  client.request(`/api/trees/${treeId}/members/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });

export const removeMember = (treeId, userId) =>
  client.request(`/api/trees/${treeId}/members/${userId}`, { method: 'DELETE' });

export const getBranches = (treeId, memberId) =>
  client.request(`/api/trees/${treeId}/members/${memberId}/branches`);

export const setBranches = (treeId, memberId, branches) =>
  client.request(`/api/trees/${treeId}/members/${memberId}/branches`, {
    method: 'PUT',
    body: JSON.stringify(branches),
  });
