// src/utils/api.js
const API_BASE = ''; // Same origin — Redmine plugin runs at /redmarc on the same host

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Required: sends the _redmine_session cookie automatically
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  // PUT/DELETE may not return a body
  if (
    response.status === 204 ||
    response.headers.get('content-length') === '0' ||
    !response.headers.get('content-type')?.includes('application/json')
  ) {
    return null;
  }
  return response.json();
}

export const api = {
  /**
   * Fetch issues with optional filters. Supports pagination via limit/offset.
   * Default: fetch up to 100 issues with all statuses.
   */
  getIssues: (params = {}) => {
    const query = new URLSearchParams();
    // Always include attachments
    if (!params.include) {
      params.include = 'attachments';
    } else if (!params.include.includes('attachments')) {
      params.include += ',attachments';
    }
    // Default pagination
    if (!params.limit) params.limit = 100;
    if (params.offset === undefined) params.offset = 0;

    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    const qs = query.toString();
    return request(`/issues.json${qs ? `?${qs}` : ''}`);
  },

  createIssue: (issueData) =>
    request('/issues.json', { method: 'POST', body: JSON.stringify({ issue: issueData }) }),

  updateIssue: (id, issueData) =>
    request(`/issues/${id}.json`, { method: 'PUT', body: JSON.stringify({ issue: issueData }) }),

  getProjects: () => request('/projects.json'),

  createProject: (projectData) =>
    request('/projects.json', { method: 'POST', body: JSON.stringify({ project: projectData }) }),

  deleteProject: (id) => request(`/projects/${id}.json`, { method: 'DELETE' }),

  getStatuses: () => request('/issue_statuses.json'),

  /**
   * Fetch all users. Requires Redmine admin rights.
   * For non-admin users this will throw — callers should catch gracefully.
   */
  getUsers: () => request('/users.json'),

  /**
   * Fetch current user membership/info without admin rights.
   * Used as a fallback when getUsers() fails.
   */
  getCurrentUser: () => request('/users/current.json'),

  /**
   * Upload a file attachment. Returns { token } on success.
   * Redmine API response shape: { upload: { token: "..." } }
   */
  uploadAttachment: async (file) => {
    const response = await fetch(`${API_BASE}/uploads.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      credentials: 'include',
      body: file,
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${response.status}`);
    }
    const data = await response.json();
    // data.upload.token is the correct path per the Redmine API spec
    return { token: data.upload?.token || data.token };
  },
};
