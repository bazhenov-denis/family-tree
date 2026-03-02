import client from './client.js';

export const getTreeGraph = (treeId) =>
  client.request(`/api/trees/${treeId}/graph`);
