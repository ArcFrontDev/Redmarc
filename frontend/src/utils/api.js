const API_BASE = ''; // Same origin

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include' // <--- Crucial for Native Redmine auth
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  // PUT/DELETE might not return a body
  if (response.status === 204 || response.headers.get('content-length') === '0' || !response.headers.get('content-type')?.includes('application/json')) {
    return null;
  }
  return response.json();
}

export const api = {
  getIssues: (params = {}) => {
    const query = new URLSearchParams();
    
    // Always fetch attachments
    if (!params.include) {
      params.include = 'attachments';
    } else if (!params.include.includes('attachments')) {
      params.include += ',attachments';
    }

    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    const queryString = query.toString();
    return request(`/issues.json${queryString ? `?${queryString}` : ''}`);
  },

  createIssue: (issueData) => {
    return request('/issues.json', {
      method: 'POST',
      body: JSON.stringify({ issue: issueData }),
    });
  },

  updateIssue: (id, issueData) => {
    return request(`/issues/${id}.json`, {
      method: 'PUT',
      body: JSON.stringify({ issue: issueData }),
    });
  },

  getProjects: () => {
    return request('/projects.json');
  },

  createProject: (projectData) => {
    return request('/projects.json', {
      method: 'POST',
      body: JSON.stringify({ project: projectData }),
    });
  },

  getStatuses: () => {
    return request('/issue_statuses.json');
  },

  deleteProject: (id) => {
    return request(`/projects/${id}.json`, { method: 'DELETE' });
  },

  getUsers: () => {
    // Note: requires admin or specific permissions in some Redmine instances
    return request('/users.json');
  },

  uploadAttachment: async (file) => {
    const url = `${API_BASE}/uploads.json`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      credentials: 'include',
      body: file
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    const resData = await response.json();
    return { token: resData.upload.token };
  }
};
