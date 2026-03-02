import client from './client.js';

export const createRelationship = (treeId, data) =>
  client.request(`/api/trees/${treeId}/relationships`, { method: 'POST', body: JSON.stringify(data) });

export const deleteRelationship = (treeId, relationshipId) =>
  client.request(`/api/trees/${treeId}/relationships/${relationshipId}`, { method: 'DELETE' });
