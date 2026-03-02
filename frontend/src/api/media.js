import client from './client.js';

export const listMedia = (treeId, personId) =>
  client.request(`/api/trees/${treeId}/persons/${personId}/media`);

export const addMedia = (treeId, personId, data) =>
  client.request(`/api/trees/${treeId}/persons/${personId}/media`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const deleteMedia = (treeId, mediaId) =>
  client.request(`/api/trees/${treeId}/media/${mediaId}`, { method: 'DELETE' });

export const listEventMedia = (treeId, eventId) =>
  client.request(`/api/trees/${treeId}/events/${eventId}/media`);

export const addEventMedia = (treeId, eventId, data) =>
  client.request(`/api/trees/${treeId}/events/${eventId}/media`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
