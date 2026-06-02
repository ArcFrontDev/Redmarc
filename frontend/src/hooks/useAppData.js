// src/hooks/useAppData.js
import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

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
      const [projectsData, statusesData, issuesData] = await Promise.all([
        api.getProjects(),
        api.getStatuses(),
        api.getIssues({ status_id: '*', limit: 100, offset: 0 })
      ]);
      setProjects(projectsData.projects || []);
      setStatuses(statusesData.issue_statuses || []);
      setIssues(issuesData.issues || []);
      // Users require admin rights - fetch separately and fail gracefully
      try {
        const usersData = await api.getUsers();
        setUsers(usersData.users || []);
      } catch {
        // Non-admin users cannot list all users - this is expected
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
    const updated = await api.getIssues({ status_id: '*', limit: 100, offset: 0 });
    setIssues(updated.issues || []);
  }, []);

  const createProject = useCallback(async (projectData) => {
    await api.createProject(projectData);
    const [pData, iData] = await Promise.all([
      api.getProjects(),
      api.getIssues({ status_id: '*', limit: 100, offset: 0 })
    ]);
    setProjects(pData.projects || []);
    setIssues(iData.issues || []);
  }, []);

  const deleteProject = useCallback(async (projectId, activeProject, setActiveProject) => {
    await api.deleteProject(projectId);
    if (activeProject === String(projectId)) setActiveProject('all');
    const [pData, iData] = await Promise.all([
      api.getProjects(),
      api.getIssues({ status_id: '*', limit: 100, offset: 0 })
    ]);
    setProjects(pData.projects || []);
    setIssues(iData.issues || []);
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
