import client from './client.js';

export const listComments = (treeId, personId) =>
  client.request(`/api/trees/${treeId}/persons/${personId}/comments`);

export const createComment = (treeId, personId, data) =>
  client.request(`/api/trees/${treeId}/persons/${personId}/comments`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const deleteComment = (treeId, commentId) =>
  client.request(`/api/trees/${treeId}/comments/${commentId}`, { method: 'DELETE' });
