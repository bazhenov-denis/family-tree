import client from './client.js';

export const getMyTrees = () =>
  client.request('/api/trees');

export const getTree = (treeId) =>
  client.request(`/api/trees/${treeId}`);

export const createTree = (data) =>
  client.request('/api/trees', { method: 'POST', body: JSON.stringify(data) });

export const updateTree = (treeId, data) =>
  client.request(`/api/trees/${treeId}`, { method: 'PATCH', body: JSON.stringify(data) });

export const deleteTree = (treeId) =>
  client.request(`/api/trees/${treeId}`, { method: 'DELETE' });
