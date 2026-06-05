// src/hooks/useAppData.js
import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

/**
 * Fetches ALL issues from Redmine by paginating through the API.
 * Redmine returns at most `limit` issues per request; we loop until we have everything.
 */
async function fetchAllIssues(params = {}) {
  const BATCH = 100;
  let offset = 0;
  let all = [];
  let total = null;

  do {
    const data = await api.getIssues({ ...params, limit: BATCH, offset });
    const items = data.issues || [];
    all = all.concat(items);
    if (total === null) total = data.total_count ?? items.length;
    offset += BATCH;
  } while (offset < total);

  return all;
}

export function useAppData() {
  const [issues, setIssues] = useState([]);
  const [projects, setProjects] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [projectsData, statusesData, allIssues] = await Promise.all([
        api.getProjects(),
        api.getStatuses(),
        fetchAllIssues({ status_id: '*' }),
      ]);
      setProjects(projectsData.projects || []);
      setStatuses(statusesData.issue_statuses || []);
      setIssues(allIssues);
      try {
        const usersData = await api.getUsers();
        setUsers(usersData.users || []);
      } catch {
        // Non-admin users cannot list all users – expected
        setUsers([]);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Unable to connect to Redmine. Make sure you are logged in and the plugin is installed correctly.');
    } finally {
      setLoading(false);
    }
  }, []);

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

  const createIssue = useCallback(async (issueData) => {
    await api.createIssue(issueData);
    const allIssues = await fetchAllIssues({ status_id: '*' });
    setIssues(allIssues);
  }, []);

  const createProject = useCallback(async (projectData) => {
    await api.createProject(projectData);
    const [pData, allIssues] = await Promise.all([
      api.getProjects(),
      fetchAllIssues({ status_id: '*' }),
    ]);
    setProjects(pData.projects || []);
    setIssues(allIssues);
  }, []);

  const deleteProject = useCallback(async (projectId, activeProject, setActiveProject) => {
    await api.deleteProject(projectId);
    if (activeProject === String(projectId)) setActiveProject('all');
    const [pData, allIssues] = await Promise.all([
      api.getProjects(),
      fetchAllIssues({ status_id: '*' }),
    ]);
    setProjects(pData.projects || []);
    setIssues(allIssues);
  }, []);

  const uploadAttachment = useCallback(async (file) => {
    return api.uploadAttachment(file);
  }, []);

  return {
    issues, setIssues,
    projects, setProjects,
    statuses,
    users,
    loading, setLoading,
    error,
    loadData,
    updateIssueStatus,
    assignUser,
    createIssue,
    createProject,
    deleteProject,
    uploadAttachment,
  };
}
