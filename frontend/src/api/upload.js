const API_BASE = import.meta.env.PROD
  ? window.location.origin
  : (import.meta.env.VITE_API_URL || 'http://localhost:8080');

async function doUpload(endpoint, file) {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { ...(token && { Authorization: `Bearer ${token}` }) },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
    throw new Error(err.message || 'Upload failed');
  }

  return res.json();
}

export async function uploadImage(file) {
  const data = await doUpload('/api/upload/image', file);
  return data.url;
}

/** Upload any file (image or document). Returns { url, mimeType, fileName } */
export async function uploadFile(file) {
  return doUpload('/api/upload/file', file);
}
