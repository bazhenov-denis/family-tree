import client from './client';

export function listVersions(treeId) {
  return client.request(`/api/trees/${treeId}/versions`);
}

export function getVersion(treeId, versionId) {
  return client.request(`/api/trees/${treeId}/versions/${versionId}`);
}

export function deleteVersion(treeId, versionId) {
  return client.request(`/api/trees/${treeId}/versions/${versionId}`, { method: 'DELETE' });
}

export function createSnapshot(treeId, data) {
  return client.request(`/api/trees/${treeId}/versions/snapshot`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function createWorkingCopy(treeId, data) {
  return client.request(`/api/trees/${treeId}/versions/working-copy`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function discardWorkingCopy(treeId, versionId) {
  return client.request(`/api/trees/${treeId}/versions/${versionId}/discard`, { method: 'POST' });
}

export function initiateMerge(treeId, versionId) {
  return client.request(`/api/trees/${treeId}/versions/${versionId}/merge/initiate`, { method: 'POST' });
}

export function getMergeConflicts(treeId, versionId) {
  return client.request(`/api/trees/${treeId}/versions/${versionId}/merge/conflicts`);
}

export function resolveConflict(treeId, versionId, data) {
  return client.request(`/api/trees/${treeId}/versions/${versionId}/merge/resolve`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function completeMerge(treeId, versionId) {
  return client.request(`/api/trees/${treeId}/versions/${versionId}/merge/complete`, { method: 'POST' });
}
