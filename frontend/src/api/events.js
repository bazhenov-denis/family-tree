import client from './client.js';

export const listEvents = (treeId, personId) =>
  client.request(`/api/trees/${treeId}/persons/${personId}/events`);

export const createEvent = (treeId, personId, data) =>
  client.request(`/api/trees/${treeId}/persons/${personId}/events`, { method: 'POST', body: JSON.stringify(data) });

export const updateEvent = (treeId, eventId, data) =>
  client.request(`/api/trees/${treeId}/events/${eventId}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteEvent = (treeId, eventId) =>
  client.request(`/api/trees/${treeId}/events/${eventId}`, { method: 'DELETE' });

export const listTreeEvents = (treeId) =>
  client.request(`/api/trees/${treeId}/events`);
