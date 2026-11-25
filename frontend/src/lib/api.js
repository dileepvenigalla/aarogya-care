const API_BASE = import.meta.env.VITE_API_URL || '';

export function getStoredToken() {
  return sessionStorage.getItem('ac_token') || localStorage.getItem('ac_token') || null;
}

export async function apiFetch(path, options = {}) {
  const token = options.token ?? getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(payload.error || 'Request failed');
    err.status = response.status;
    throw err;
  }

  return payload;
}
