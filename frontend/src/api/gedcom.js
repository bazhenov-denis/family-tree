import client from './client.js';

export async function exportGedcom(treeId, treeName) {
  const blob = await client.requestBlob(`/api/trees/${treeId}/gedcom`);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${treeName || 'family-tree'}.ged`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportJson(treeId, treeName) {
  const blob = await client.requestBlob(`/api/trees/${treeId}/export/json`);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${treeName || 'family-tree'}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function previewGedcom(treeId, file) {
  const form = new FormData();
  form.append('file', file);
  return client.request(`/api/trees/${treeId}/gedcom/preview`, { method: 'POST', body: form });
}

export async function importGedcom(treeId, file) {
  const form = new FormData();
  form.append('file', file);
  return client.request(`/api/trees/${treeId}/gedcom`, { method: 'POST', body: form });
}
