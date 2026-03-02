const API_BASE = import.meta.env.PROD
  ? window.location.origin
  : (import.meta.env.VITE_API_URL || 'http://localhost:8080');

function authHeaders(extra = {}) {
  const token = localStorage.getItem('token');
  return {
    ...(token && { Authorization: `Bearer ${token}` }),
    ...extra,
  };
}

async function request(endpoint, options = {}) {
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...authHeaders(options.headers),
  };

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

  if (res.status === 204) return null;

  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    return;
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    let message = `HTTP ${res.status}`;
    try { message = JSON.parse(errText).message || message; } catch { /* ignore */ }
    throw new Error(message);
  }

  const text = await res.text();
  if (!text) return null;
  return JSON.parse(text);
}

async function requestBlob(endpoint) {
  const headers = authHeaders();
  const res = await fetch(`${API_BASE}${endpoint}`, { headers });
  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    return;
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.blob();
}

export default { request, requestBlob };
