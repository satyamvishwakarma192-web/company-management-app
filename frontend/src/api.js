const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

function getToken() {
  return localStorage.getItem('cma_token');
}

export function setToken(token) {
  if (token) localStorage.setItem('cma_token', token);
  else localStorage.removeItem('cma_token');
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  const text = await res.text();
  if (text) {
    try { data = JSON.parse(text); } catch { data = text; }
  }

  if (!res.ok) {
    const message = (data && data.error) || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

export const api = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password }, auth: false }),
  register: (payload) => request('/auth/register', { method: 'POST', body: payload, auth: false }),
  me: () => request('/auth/me'),

  employees: {
    list: (params = {}) => request(`/employees${qs(params)}`),
    create: (payload) => request('/employees', { method: 'POST', body: payload }),
    update: (id, payload) => request(`/employees/${id}`, { method: 'PATCH', body: payload }),
    remove: (id) => request(`/employees/${id}`, { method: 'DELETE' }),
    match: (payload) => request('/employees/match', { method: 'POST', body: payload }),
  },

  projects: {
    list: (params = {}) => request(`/projects${qs(params)}`),
    get: (id) => request(`/projects/${id}`),
    create: (payload) => request('/projects', { method: 'POST', body: payload }),
    update: (id, payload) => request(`/projects/${id}`, { method: 'PATCH', body: payload }),
    remove: (id) => request(`/projects/${id}`, { method: 'DELETE' }),
  },

  tasks: {
    list: (params = {}) => request(`/tasks${qs(params)}`),
    create: (payload) => request('/tasks', { method: 'POST', body: payload }),
    update: (id, payload) => request(`/tasks/${id}`, { method: 'PATCH', body: payload }),
    remove: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
  },

  attendance: {
    checkin: () => request('/attendance/checkin', { method: 'POST' }),
    checkout: () => request('/attendance/checkout', { method: 'POST' }),
    leave: (payload) => request('/attendance/leave', { method: 'POST', body: payload }),
    list: (params = {}) => request(`/attendance${qs(params)}`),
    summary: () => request('/attendance/summary'),
  },

  notifications: {
    list: () => request('/notifications'),
    markRead: (id) => request(`/notifications/${id}/read`, { method: 'POST' }),
    announce: (message) => request('/notifications/announce', { method: 'POST', body: { message } }),
  },

  reports: {
    dashboard: () => request('/reports/dashboard'),
  },

  company: {
    get: () => request('/company'),
    update: (payload) => request('/company', { method: 'PUT', body: payload }),
  },
};

function qs(params) {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (!entries.length) return '';
  return '?' + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
}
