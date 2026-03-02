import client from './client.js';

export const getAuditLog = (treeId, size = 50) =>
  client.request(`/api/trees/${treeId}/audit?size=${size}`);
