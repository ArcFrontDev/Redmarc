// src/hooks/useAppData.js
import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

/**
 * Fetches ALL issues from Redmine by paginating through the API.
 * Redmine returns at most `limit` issues per request; we loop until we have everything.
 */
async function fetchAllIssues(params = {}) {
  const BATCH = 100;
  const MAX_ISSUES = 1000; // Hard cap for performance
  let offset = 0;
  let all = [];
  let total = null;

  do {
    const data = await api.getIssues({ ...params, limit: BATCH, offset });
    const items = data.issues || [];
    all = all.concat(items);
    if (total === null) total = data.total_count ?? items.length;
    offset += BATCH;
    if (all.length >= MAX_ISSUES) break;
  } while (offset < total);

  return all;
}

export function useAppData() {
  const [issues, setIssues] = useState([]);
  const [projects, setProjects] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadIssues = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const allIssuesRaw = await fetchAllIssues({ status_id: '*', ...params });
      
      const allIssues = [...allIssuesRaw];
      const issuesMap = {};
      allIssues.forEach(issue => {
        issue.children = [];
        issuesMap[issue.id] = issue;
      });

      allIssues.forEach(issue => {
        const parentId = issue.parent?.id || issue.parent_id;
        if (parentId && issuesMap[parentId]) {
          issuesMap[parentId].children.push(issue);
        }
      });

      setIssues(allIssues);
    } catch (err) {
      console.error('Failed to load issues:', err);
      setError('Unable to fetch issues.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [projectsData, statusesData, prioritiesData, currentUserData] = await Promise.all([
        api.getProjects(),
        api.getStatuses(),
        api.getPriorities().catch(() => ({ issue_priorities: [] })),
        api.getCurrentUser().catch(() => ({ user: null }))
      ]);
      setProjects(projectsData.projects || []);
      setStatuses(statusesData.issue_statuses || []);
      setPriorities(prioritiesData.issue_priorities || []);
      if (currentUserData.user) {
        setCurrentUser(currentUserData.user);
      }
      
      await loadIssues();

      try {
        const usersData = await api.getUsers();
        setUsers(usersData.users || []);
      } catch {
        setUsers([]);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Unable to connect to Redmine. Make sure you are logged in and the plugin is installed correctly.');
      setLoading(false);
    }
  }, [loadIssues]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadData(); }, [loadData]);

  const updateIssueStatus = useCallback(async (issueId, newStatusId, statuses) => {
    const targetStatus = statuses.find(s => s.id === parseInt(newStatusId));
    if (!targetStatus) return;
    const prev = [...issues];
    setIssues(all => all.map(i => i.id === issueId ? { ...i, status: { id: targetStatus.id, name: targetStatus.name } } : i));
    try {
      await api.updateIssue(issueId, { status_id: newStatusId });
    } catch (err) {
      console.error('Failed to update status:', err);
      setIssues(prev);
      throw err;
    }
  }, [issues]);

  const assignUser = useCallback(async (issueId, newUserId, users) => {
    let assignee = null;
    if (newUserId && newUserId !== '') {
      const u = users.find(u => u.id === parseInt(newUserId));
      if (!u) return;
      assignee = { id: u.id, name: u.name || (u.firstname && u.lastname ? `${u.firstname} ${u.lastname}` : u.login) || 'User' };
    }
    const prev = [...issues];
    setIssues(all => all.map(i => i.id === issueId ? { ...i, assigned_to: assignee } : i));
    try {
      await api.updateIssue(issueId, { assigned_to_id: newUserId || '' });
    } catch (err) {
      console.error('Failed to assign user:', err);
      setIssues(prev);
      throw err;
    }
  }, [issues]);

  const bulkUpdateIssues = useCallback(async (issueIds, updates) => {
    try {
      setLoading(true);
      const promises = issueIds.map(id => api.updateIssue(id, updates));
      await Promise.all(promises);
      await loadIssues(); // refresh
    } catch (err) {
      console.error('Failed bulk update:', err);
      setError('Failed to update some issues.');
    } finally {
      setLoading(false);
    }
  }, [loadIssues]);

  const createIssue = useCallback(async (issueData) => {
    await api.createIssue(issueData);
    const allIssues = await fetchAllIssues({ status_id: '*' });
    
    const issuesMap = {};
    allIssues.forEach(issue => {
      issue.children = [];
      issuesMap[issue.id] = issue;
    });

    allIssues.forEach(issue => {
      const parentId = issue.parent?.id || issue.parent_id;
      if (parentId && issuesMap[parentId]) {
        issuesMap[parentId].children.push(issue);
      }
    });

    setIssues(allIssues);
  }, []);

  const createProject = useCallback(async (projectData) => {
    await api.createProject(projectData);
    const [pData, allIssuesRaw] = await Promise.all([
      api.getProjects(),
      fetchAllIssues({ status_id: '*' }),
    ]);
    
    const allIssues = [...allIssuesRaw];
    const issuesMap = {};
    allIssues.forEach(issue => {
      issue.children = [];
      issuesMap[issue.id] = issue;
    });

    allIssues.forEach(issue => {
      const parentId = issue.parent?.id || issue.parent_id;
      if (parentId && issuesMap[parentId]) {
        issuesMap[parentId].children.push(issue);
      }
    });

    setProjects(pData.projects || []);
    setIssues(allIssues);
  }, []);

  const deleteProject = useCallback(async (projectId, activeProject, setActiveProject) => {
    await api.deleteProject(projectId);
    if (activeProject === String(projectId)) setActiveProject('all');
    const [pData, allIssuesRaw] = await Promise.all([
      api.getProjects(),
      fetchAllIssues({ status_id: '*' }),
    ]);
    
    const allIssues = [...allIssuesRaw];
    const issuesMap = {};
    allIssues.forEach(issue => {
      issue.children = [];
      issuesMap[issue.id] = issue;
    });

    allIssues.forEach(issue => {
      const parentId = issue.parent?.id || issue.parent_id;
      if (parentId && issuesMap[parentId]) {
        issuesMap[parentId].children.push(issue);
      }
    });

    setProjects(pData.projects || []);
    setIssues(allIssues);
  }, []);

  const uploadAttachment = useCallback(async (file) => {
    return api.uploadAttachment(file);
  }, []);

  return {
    issues, setIssues,
    projects,
    statuses,
    priorities,
    users,
    currentUser,
    loading, setLoading,
    error,
    loadData,
    loadIssues,
    updateIssueStatus,
    assignUser,
    bulkUpdateIssues,
    createIssue,
    createProject,
    deleteProject,
    uploadAttachment,
  };
}
