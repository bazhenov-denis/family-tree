import client from './client.js';

export const listPersons = (treeId) =>
  client.request(`/api/trees/${treeId}/persons`);

export const createPerson = (treeId, data) =>
  client.request(`/api/trees/${treeId}/persons`, { method: 'POST', body: JSON.stringify(data) });

export const getPerson = (treeId, personId) =>
  client.request(`/api/trees/${treeId}/persons/${personId}`);

export const updatePerson = (treeId, personId, data) =>
  client.request(`/api/trees/${treeId}/persons/${personId}`, { method: 'PUT', body: JSON.stringify(data) });

export const deletePerson = (treeId, personId) =>
  client.request(`/api/trees/${treeId}/persons/${personId}`, { method: 'DELETE' });

export const getUpcomingBirthdays = (treeId, days = 30) =>
  client.request(`/api/trees/${treeId}/persons/birthdays?days=${days}`);
