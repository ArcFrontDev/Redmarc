// src/utils/api.js
const API_BASE = ''; // Same origin – Redmine plugin runs at /redmarc on the same host

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
   */
  getIssues: (params = {}) => {
    const query = new URLSearchParams();
    if (!params.include) {
      params.include = 'attachments,relations,children';
    } else {
      if (!params.include.includes('attachments')) params.include += ',attachments';
      if (!params.include.includes('relations')) params.include += ',relations';
      if (!params.include.includes('children')) params.include += ',children';
    }
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

  /**
   * Fetch full issue details including journals and attachments.
   */
  getIssueDetails: (id) => request(`/issues/${id}.json?include=journals,attachments,watchers,children`),

  /**
   * Add a comment (note) to an issue.
   * In the Redmine API, notes are added via PUT with the notes field.
   */
  addComment: (id, notes) =>
    request(`/issues/${id}.json`, {
      method: 'PUT',
      body: JSON.stringify({ issue: { notes } }),
    }),

  getProjects: () => request('/projects.json'),

  createProject: (projectData) =>
    request('/projects.json', { method: 'POST', body: JSON.stringify({ project: projectData }) }),

  deleteProject: (id) => request(`/projects/${id}.json`, { method: 'DELETE' }),

  getStatuses: () => request('/issue_statuses.json'),

  /**
   * Fetch all users. Requires Redmine admin rights.
   * For non-admin users this will throw – callers should catch gracefully.
   */
  getUsers: () => request('/users.json'),

  /**
   * Fetch current user info without admin rights.
   */
  getCurrentUser: () => request('/users/current.json'),

  /**
   * Fetch issue categories for a project.
   */
  getProjectCategories: (projectId) =>
    request(`/projects/${projectId}/issue_categories.json`),

  /**
   * Fetch versions (milestones) for a project.
   */
  getProjectVersions: (projectId) =>
    request(`/projects/${projectId}/versions.json`),

  /**
   * Add current user as a watcher on an issue.
   * Requires the user's own ID – pass currentUserId.
   */
  watchIssue: (issueId, userId) =>
    request(`/issues/${issueId}/watchers.json`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    }),

  /**
   * Remove current user from watchers.
   */
  unwatchIssue: (issueId, userId) =>
    request(`/issues/${issueId}/watchers/${userId}.json`, { method: 'DELETE' }),

  /**
   * Upload a file attachment. Returns { token } on success.
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
    return { token: data.upload?.token || data.token };
  },
};
