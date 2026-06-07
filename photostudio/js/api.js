/**
 * js/api.js — Shared fetch wrapper for all LensSpace API calls
 * Every page imports this file for consistent error handling & base URL.
 */

const API_BASE = '/api';

/**
 * Core fetch wrapper
 * @param {string} endpoint  - e.g. '/auth/login'
 * @param {object} options   - fetch options (method, body, etc.)
 * @returns {Promise<object>} parsed JSON response
 */
async function apiFetch(endpoint, options = {}) {
  const defaults = {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // send/receive session cookie
  };

  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (options.body instanceof FormData) {
    delete defaults.headers['Content-Type'];
  }

  const res = await fetch(`${API_BASE}${endpoint}`, { ...defaults, ...options });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Something went wrong');
  }
  return data;
}

// ── Auth ─────────────────────────────────────────────────────────
const Auth = {
  register: (body) => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login:    (body) => apiFetch('/auth/login',    { method: 'POST', body: JSON.stringify(body) }),
  logout:   ()     => apiFetch('/auth/logout',   { method: 'POST' }),
  me:       ()     => apiFetch('/auth/me'),
};

// ── Studios ───────────────────────────────────────────────────────
const Studios = {
  getAll:   (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/studios${qs ? '?' + qs : ''}`);
  },
  getOne:   (id)          => apiFetch(`/studios/${id}`),
  getMy:    ()            => apiFetch('/studios/my'),
  create:   (formData)    => apiFetch('/studios', { method: 'POST', body: formData }),
  update:   (id, formData)=> apiFetch(`/studios/${id}`, { method: 'PUT', body: formData }),
  delete:   (id)          => apiFetch(`/studios/${id}`, { method: 'DELETE' }),
};

// ── Bookings ──────────────────────────────────────────────────────
const Bookings = {
  create:         (body) => apiFetch('/bookings',       { method: 'POST', body: JSON.stringify(body) }),
  getMy:          ()     => apiFetch('/bookings/my'),
  getOwner:       ()     => apiFetch('/bookings/owner'),
  updateStatus:   (id, status) =>
    apiFetch(`/bookings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};

// ── Admin ─────────────────────────────────────────────────────────
const Admin = {
  getStats:     ()     => apiFetch('/admin/stats'),
  getUsers:     (p=1)  => apiFetch(`/admin/users?page=${p}`),
  deleteUser:   (id)   => apiFetch(`/admin/users/${id}`, { method: 'DELETE' }),
  getStudios:   (p=1)  => apiFetch(`/admin/studios?page=${p}`),
  getBookings:  (p=1)  => apiFetch(`/admin/bookings?page=${p}`),
  toggleStudio: (id)   => apiFetch(`/admin/studios/${id}/available`, { method: 'PATCH' }),
};

// ── Session helpers ───────────────────────────────────────────────

/**
 * Returns the current session user from the API (null if not logged in).
 * Caches the result in sessionStorage to avoid repeated calls.
 */
function normalizeSessionUser(user) {
  if (!user) return null;
  return {
    id: user._id || user.id,
    name: user.name || '',
    email: user.email || '',
    role: user.role,
  };
}

async function getSessionUser() {
  const cached = sessionStorage.getItem('lensspace_user');
  if (cached) {
    const parsed = JSON.parse(cached);
    if (parsed.name) return parsed;
  }
  try {
    const { user } = await Auth.me();
    const normalized = normalizeSessionUser(user);
    sessionStorage.setItem('lensspace_user', JSON.stringify(normalized));
    return normalized;
  } catch {
    return null;
  }
}

function clearSessionCache() {
  sessionStorage.removeItem('lensspace_user');
}

/**
 * Redirect to login if not authenticated.
 * @param {string[]} roles - If provided, also check role.
 */
async function requireAuth(...roles) {
  const user = await getSessionUser();
  if (!user) { window.location.href = '/login.html'; return null; }
  if (roles.length && !roles.includes(user.role)) {
    window.location.href = '/login.html'; return null;
  }
  return user;
}

/**
 * Redirect logged-in users away from the login/home page.
 */
async function redirectIfLoggedIn() {
  const user = await getSessionUser();
  if (!user) return;
  const map = { user: '/user.html', owner: '/owner.html', admin: '/admin.html' };
  window.location.href = map[user.role] || '/index.html';
}
