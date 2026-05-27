import React, { useState, useEffect, useCallback, useRef } from 'react';

import { api } from './utils/api';
import CommandPalette from './components/CommandPalette';
import './App.css';
import logoUrl from './assets/logo.png';

// SVG Icons as React Components for absolute zero-dependency reliability
const PlusIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const SearchIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const CheckIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>;
const XIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const FolderIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>;
const UserIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const SparklesIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707-.707M12 5a7 7 0 1 0 0 14 7 7 0 0 0 0-14z"></path></svg>;
const KeyIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>;
const SunIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>;
const MoonIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>;

const renderDescription = (text, attachments = []) => {
  if (!text) return null;
  let html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  
  attachments.forEach(att => {
    // Escape filename for regex
    const safeFilename = att.filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const imgUrl = `/attachments/download/${att.id}/${att.filename}`;
    const imgTag = `<br/><img src="${imgUrl}" alt="${att.filename}" class="issue-attachment-img" /><br/>`;
    
    // Replace !filename! (Textile)
    const textileRegex = new RegExp(`!${safeFilename}!`, 'g');
    html = html.replace(textileRegex, imgTag);
    
    // Replace ![](filename) (Markdown)
    const mdRegex = new RegExp(`!\\[.*?\\]\\(${safeFilename}\\)`, 'g');
    html = html.replace(mdRegex, imgTag);
  });
  
  html = html.replace(/\n/g, '<br/>');
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
};

export default function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [issues, setIssues] = useState([]);
  const [projects, setProjects] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [users, setUsers] = useState([]);
  
  const [activeProject, setActiveProject] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.body.className = theme === 'light' ? 'light-theme' : 'dark-theme';
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  // Modals state
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [view, setView] = useState('kanban');
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, projectId: null, projectName: '' });
  
  // Global filters
  const [filterUser, setFilterUser] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);

  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, projectId: null, projectName: '' });
  
  // New task form state
  const [newTask, setNewTask] = useState({
    project_id: '',
    subject: '',
    description: '',
    status_id: '',
    assigned_to_id: '',
    priority_id: '2', // 2 is Normal in Redmine
    uploads: []
  });
  
  const searchInputRef = useRef(null);

  // Fetch initial data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [projectsData, statusesData, usersData, issuesData] = await Promise.all([
        api.getProjects(),
        api.getStatuses(),
        api.getUsers(),
        api.getIssues({ status_id: '*' })
      ]);
      
      setProjects(projectsData.projects || []);
      setStatuses(statusesData.issue_statuses || []);
      setUsers(usersData.users || []);
      // Set default assignee to first user if available
      if (usersData.users?.length > 0) {
        setNewTask(prev => ({ ...prev, assigned_to_id: usersData.users[0].id }));
      }
      setIssues(issuesData.issues || []);
      
      // Select first project as default for new task
      if (projectsData.projects?.length > 0) {
        setNewTask(prev => ({ ...prev, project_id: projectsData.projects[0].id }));
      }
      
      // Select first status as default for new task
      if (statusesData.issue_statuses?.length > 0) {
        setNewTask(prev => ({ ...prev, status_id: statusesData.issue_statuses[0].id }));
      }
      
    } catch (err) {
      console.error('Data loading error:', err);
      setError('Failed to connect to Redmarc BFF proxy. Make sure the backend server (port 3001) and Redmine container are running.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Delete a project by ID, then refresh
  const handleDeleteProject = useCallback(async (projectId) => {
    try {
      setLoading(true);
      await api.deleteProject(projectId);
      if (activeProject === String(projectId)) setActiveProject('all');
      const [pData, iData] = await Promise.all([api.getProjects(), api.getIssues({ status_id: '*' })]);
      setProjects(pData.projects || []);
      setIssues(iData.issues || []);
    } catch (err) {
      alert('Project deletion error: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [activeProject]);

  // Keyboard shortcuts - use e.code (physical key), works in any layout
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeElement = document.activeElement.tagName;
      const isInputActive = activeElement === 'INPUT' || activeElement === 'TEXTAREA' || activeElement === 'SELECT';

      // KeyC - create task (skip if any modifier pressed so Ctrl+C copy works)
      if (e.code === 'KeyC' && !isInputActive && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        setIsCreateModalOpen(true);
      }

      // KeyP - create project
      if (e.code === 'KeyP' && !isInputActive && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setIsCreateProjectModalOpen(true);
      }

      // KeyR - refresh data
      if (e.code === 'KeyR' && !isInputActive && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        loadData();
      }

      // Ctrl+KeyK - focus search
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyK') {
        e.preventDefault();
        setIsCommandOpen(prev => !prev);
      }

      // Delete key - delete the currently active project (only if no modals are open)
      if (e.code === 'Delete' && !isInputActive && !e.ctrlKey && !e.metaKey && activeProject !== 'all' && !isCreateModalOpen && !isCreateProjectModalOpen && !selectedIssue && !deleteConfirm.isOpen) {
        e.preventDefault();
        const proj = projects.find(p => String(p.id) === activeProject);
        if (proj) {
          setDeleteConfirm({ isOpen: true, projectId: proj.id, projectName: proj.name });
        }
      }

      // Esc - close all modals and context menu
      if (e.key === 'Escape') {
        setIsCreateModalOpen(false);
        setIsCreateProjectModalOpen(false);
        setIsCommandOpen(false);
        setSelectedIssue(null);
        setContextMenu({ visible: false, x: 0, y: 0, projectId: null, projectName: '' });
        setDeleteConfirm({ isOpen: false, projectId: null, projectName: '' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loadData, handleDeleteProject, activeProject, projects]);

  // Handle task status update (Optimistic Update)
  const handleUpdateStatus = async (issueId, newStatusId) => {
    const targetStatus = statuses.find(s => s.id === parseInt(newStatusId));
    if (!targetStatus) return;

    // Save previous state for rollback on error
    const previousIssues = [...issues];

    // Optimistically update issues state
    setIssues(prevIssues => prevIssues.map(issue => {
      if (issue.id === issueId) {
        return {
          ...issue,
          status: { id: targetStatus.id, name: targetStatus.name }
        };
      }
      return issue;
    }));
    
    // Also update selected issue details if it's currently open
    if (selectedIssue && selectedIssue.id === issueId) {
      setSelectedIssue(prev => ({
        ...prev,
        status: { id: targetStatus.id, name: targetStatus.name }
      }));
    }

    try {
      await api.updateIssue(issueId, { status_id: newStatusId });
    } catch (err) {
      console.error('Failed to update issue status:', err);
      // Rollback on error
      setIssues(previousIssues);
      alert('Failed to update status on Redmine. Reverting changes.');
    }
  };

  // Handle task assignment update
  const handleAssignUser = async (issueId, newUserId) => {
    let targetUser = null;
    let targetUserName = null;
    if (newUserId && newUserId !== "") {
      targetUser = users.find(u => u.id === parseInt(newUserId));
      if (!targetUser) return;
      targetUserName = targetUser.name || (targetUser.firstname && targetUser.lastname ? `${targetUser.firstname} ${targetUser.lastname}` : targetUser.login) || 'User';
    }

    const previousIssues = [...issues];

    setIssues(prevIssues => prevIssues.map(issue => {
      if (issue.id === issueId) {
        return {
          ...issue,
          assigned_to: targetUser ? { id: targetUser.id, name: targetUserName } : null
        };
      }
      return issue;
    }));
    
    if (selectedIssue && selectedIssue.id === issueId) {
      setSelectedIssue(prev => ({
        ...prev,
        assigned_to: targetUser ? { id: targetUser.id, name: targetUserName } : null
      }));
    }

    try {
      await api.updateIssue(issueId, { assigned_to_id: newUserId || "" });
    } catch (err) {
      console.error('Failed to update issue assignment:', err);
      setIssues(previousIssues);
      alert('Failed to update assignment on Redmine. Reverting changes.');
    }
  };

  // Handle paste image into description
  const handlePaste = async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (!file) continue;
        
        e.preventDefault(); // Stop default paste
        const target = e.target;

        const ext = file.name.split('.').pop() || 'png';
        const uniqueFilename = `image_${Date.now()}.${ext}`;

        // Generate placeholder
        const placeholder = `\n![Uploading ${uniqueFilename} ...]()\n`;
        const cursorPosition = target.selectionStart;
        const textBefore = newTask.description.substring(0, cursorPosition);
        const textAfter = newTask.description.substring(cursorPosition);
        
        setNewTask(prev => ({
          ...prev,
          description: textBefore + placeholder + textAfter
        }));

        setTimeout(() => {
          target.setSelectionRange(cursorPosition + placeholder.length, cursorPosition + placeholder.length);
        }, 0);

        try {
          const data = await api.uploadAttachment(file);
          const token = data.upload.token;

          const finalMarkdown = `\n!${uniqueFilename}!\n`;
          setNewTask(prev => {
            setTimeout(() => {
              const pIndex = prev.description.indexOf(placeholder);
              if (pIndex !== -1) {
                const newPos = pIndex + finalMarkdown.length;
                target.setSelectionRange(newPos, newPos);
              }
            }, 0);
            return {
              ...prev,
              description: prev.description.replace(placeholder, finalMarkdown),
              uploads: [...(prev.uploads || []), {
                token: token,
                filename: uniqueFilename,
                content_type: file.type
              }]
            };
          });

        } catch (error) {
          console.error('Image upload failed:', error);
          const errorMsg = `\n[Upload failed: ${uniqueFilename}]\n`;
          setNewTask(prev => {
            setTimeout(() => {
              const pIndex = prev.description.indexOf(placeholder);
              if (pIndex !== -1) {
                const newPos = pIndex + errorMsg.length;
                target.setSelectionRange(newPos, newPos);
              }
            }, 0);
            return {
              ...prev,
              description: prev.description.replace(placeholder, errorMsg)
            };
          });
        }
        break; // Only handle the first image
      }
    }
  };

  // Handle task creation
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.subject.trim()) return;

    try {
      setLoading(true);
      // Coerce IDs to integers - Redmine rejects string values
      const payload = {
        ...newTask,
        project_id: parseInt(newTask.project_id, 10),
        status_id: parseInt(newTask.status_id, 10),
        priority_id: parseInt(newTask.priority_id, 10),
        assigned_to_id: newTask.assigned_to_id ? parseInt(newTask.assigned_to_id, 10) : undefined,
      };
      await api.createIssue(payload);
      setIsCreateModalOpen(false);
      
      // Reset form subject/desc/uploads, keep project/status selection
      setNewTask(prev => ({
        ...prev,
        subject: '',
        description: '',
        uploads: []
      }));
      
      // Reload issues list
      const issuesData = await api.getIssues({ status_id: '*' });
      setIssues(issuesData.issues || []);
    } catch (err) {
      console.error('Failed to create task:', err);
      alert('Error creating task in Redmine: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter and search issues
  const filteredIssues = issues.filter(issue => {
    const matchesProject = activeProject === 'all' || issue.project.id === parseInt(activeProject);
    const matchesSearch = searchQuery.trim() === '' || 
      issue.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (issue.description && issue.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      `#${issue.id}`.includes(searchQuery);
    
    const matchesUserFilter = !filterUser || issue.assigned_to?.id === filterUser;
    const matchesStatusFilter = !filterStatus || issue.status?.id === filterStatus;

    return matchesProject && matchesSearch && matchesUserFilter && matchesStatusFilter;
  });

  const translateStatus = (name) => {
    if (!name) return name;
    const lowerName = name.toLowerCase();
    switch (lowerName) {
      case 'новая': return 'New';
      case 'в работе': return 'In Progress';
      case 'решена': return 'Resolved';
      case 'нужен отклик': return 'Feedback';
      case 'обратная связь': return 'Feedback';
      case 'закрыта': return 'Closed';
      case 'отклонена': return 'Rejected';
      default: return name;
    }
  };

  // Group issues by standard columns
  // If Redmine has arbitrary statuses, we dynamically map them. 
  // For standard columns: Todo, In Progress, Review/Testing, Done.
  const getIssuesForColumn = (columnType) => {
    return filteredIssues.filter(issue => {
      const statusName = translateStatus(issue.status.name).toLowerCase();
      if (columnType === 'todo') {
        return statusName.includes('new') || statusName.includes('created');
      }
      if (columnType === 'progress') {
        return statusName.includes('progress') || statusName.includes('working');
      }
      if (columnType === 'review') {
        return statusName.includes('feedback') || statusName.includes('review') || statusName.includes('resolved') || statusName.includes('test');
      }
      if (columnType === 'done') {
        return statusName.includes('closed') || statusName.includes('done') || statusName.includes('completed') || statusName.includes('reject');
      }
      return false;
    });
  };

  const getPriorityLabel = (priorityId) => {
    switch (parseInt(priorityId)) {
      case 1: return { name: 'Low', class: 'priority-low' };
      case 2: return { name: 'Normal', class: 'priority-normal' };
      case 3: return { name: 'High', class: 'priority-high' };
      case 4: return { name: 'Critical', class: 'priority-critical' };
      default: return { name: 'Normal', class: 'priority-normal' };
    }
  };

  return (
    <div className="app-container">
      {/* 1. Sidebar */}
      <aside className="app-sidebar">
        <div className="brand-header">
          <div className="brand-logo-circle">
            <img src={logoUrl} alt="Redmarc" className="brand-logo-img" />
          </div>
          <span className="brand-name">Redmarc</span>
          <span className="brand-tag">BETA</span>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-header">
            <span className="sidebar-section-title">Projects</span>
            <button 
              className="add-project-btn" 
              onClick={() => setIsCreateProjectModalOpen(true)}
              title="Create new project (P)"
            >
              <PlusIcon />
            </button>
          </div>
          <button
            className={`nav-item ${activeProject === 'all' ? 'active' : ''}`}
            onClick={() => setActiveProject('all')}
          >
            <FolderIcon />
            <span className="nav-item-text">All Projects</span>
            <span className="nav-item-count">{projects.length}</span>
          </button>
          
          {projects.map(proj => {
            const count = issues.filter(i => i.project.id === proj.id).length;
            return (
              <button
                key={proj.id}
                className={`nav-item ${activeProject === String(proj.id) ? 'active' : ''}`}
                onClick={() => setActiveProject(String(proj.id))}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu({ visible: true, x: e.clientX, y: e.clientY, projectId: proj.id, projectName: proj.name });
                }}
                title={`${proj.name} (Right click to delete)`}
              >
                <FolderIcon />
                <span className="nav-item-text">{proj.name}</span>
                {count > 0 && <span className="nav-item-count">{count}</span>}
              </button>
            );
          })}
        </nav>
        
        {/* Keyboard Shortcuts Helper Panel */}
        <div className="sidebar-hotkeys">
          <div className="hotkey-item">
            <span>Create issue</span>
            <kbd>C</kbd>
          </div>
          <div className="hotkey-item">
            <span>Create project</span>
            <kbd>P</kbd>
          </div>
          <div className="hotkey-item">
            <span>Refresh data</span>
            <kbd>R</kbd>
          </div>
          <div className="hotkey-item">
            <span>Command menu</span>
            <kbd>Ctrl+K</kbd>
          </div>
          <div className="hotkey-item">
            <span>Delete project</span>
            <kbd>Del</kbd>
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="api-status">
            <div className="status-indicator online"></div>
            <span>Redmarc Native Plugin</span>
          </div>
          <div className="user-profile">
            <div className="user-avatar">AD</div>
            <div className="user-info">
              <span className="user-name">Redmarc Admin</span>
              <span className="user-role">Administrator</span>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. Main Workspace */}
      <main className="app-workspace">
        <header className="workspace-header">
          <div className="header-center">
            <div className="header-search-bar">
              <SearchIcon />
              <input
                type="text"
                className="search-input"
                placeholder="Search issues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {(filterUser || filterStatus || searchQuery) && (
              <div className="active-filters" onClick={() => { setFilterUser(null); setFilterStatus(null); setSearchQuery(''); }}>
                <span>Clear filters</span>
                <XIcon />
              </div>
            )}
          </div>

          <div className="header-actions">
            <div className="view-toggle">
              <button
                className={`view-btn ${view === 'kanban' ? 'active' : ''}`}
                onClick={() => setView('kanban')}
                title="Kanban board"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="18" rx="1"/><rect x="17" y="3" width="4" height="18" rx="1"/></svg>
                Kanban
              </button>
              <button
                className={`view-btn ${view === 'list' ? 'active' : ''}`}
                onClick={() => setView('list')}
                title="List of all issues"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3" cy="6" r="1" fill="currentColor"/><circle cx="3" cy="12" r="1" fill="currentColor"/><circle cx="3" cy="18" r="1" fill="currentColor"/></svg>
                List
              </button>
            </div>
            <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
              <PlusIcon />
              Create issue
            </button>
            <button className="btn btn-icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Toggle theme">
              {theme === 'light' ? <MoonIcon /> : <SunIcon />}
            </button>
            <button className="btn btn-icon" onClick={loadData} title="Refresh data">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path></svg>
            </button>
          </div>
        </header>

        {error && (
          <div className="error-panel">
            <div className="error-icon">⚠️</div>
            <div className="error-text">
              <h4>Server connection error</h4>
              <p>{error}</p>
              <button className="btn mt-3" onClick={loadData}>Retry</button>
            </div>
          </div>
        )}

        {loading && (
          <div className="loading-container">
            <div className="loader-spinner"></div>
            <span className="loading-text">Synchronizing with Redmine...</span>
          </div>
        )}

        {!loading && !error && view === 'kanban' && (
          <div className="kanban-board">
            {/* Column 1: TODO */}
            <div className="kanban-column">
              <div className="column-header">
                <span className="column-title-dot todo-dot"></span>
                <span className="column-title">Backlog / New</span>
                <span className="column-count">{getIssuesForColumn('todo').length}</span>
              </div>
              <div className="column-cards">
                {getIssuesForColumn('todo').map(issue => (
                  <div key={issue.id} className="issue-card" onClick={() => setSelectedIssue(issue)}>
                    <div className="card-project-tag">{issue.project.name}</div>
                    <div className="card-title">{issue.subject}</div>
                    <div className="card-footer">
                      <span className="card-issue-id">#{issue.id}</span>
                      <div className="card-assignee"><UserIcon /><span>{issue.assigned_to?.name || 'Unassigned'}</span></div>
                    </div>
                  </div>
                ))}
                {getIssuesForColumn('todo').length === 0 && <div className="column-empty-state">No issues</div>}
              </div>
            </div>

            {/* Column 2: IN PROGRESS */}
            <div className="kanban-column">
              <div className="column-header">
                <span className="column-title-dot progress-dot"></span>
                <span className="column-title">In Progress</span>
                <span className="column-count">{getIssuesForColumn('progress').length}</span>
              </div>
              <div className="column-cards">
                {getIssuesForColumn('progress').map(issue => (
                  <div key={issue.id} className="issue-card" onClick={() => setSelectedIssue(issue)}>
                    <div className="card-project-tag">{issue.project.name}</div>
                    <div className="card-title">{issue.subject}</div>
                    <div className="card-footer">
                      <span className="card-issue-id">#{issue.id}</span>
                      <div className="card-assignee"><UserIcon /><span>{issue.assigned_to?.name || 'Unassigned'}</span></div>
                    </div>
                  </div>
                ))}
                {getIssuesForColumn('progress').length === 0 && <div className="column-empty-state">No issues</div>}
              </div>
            </div>

            {/* Column 3: IN TESTING / REVIEW */}
            <div className="kanban-column">
              <div className="column-header">
                <span className="column-title-dot review-dot"></span>
                <span className="column-title">Review / Test</span>
                <span className="column-count">{getIssuesForColumn('review').length}</span>
              </div>
              <div className="column-cards">
                {getIssuesForColumn('review').map(issue => (
                  <div key={issue.id} className="issue-card" onClick={() => setSelectedIssue(issue)}>
                    <div className="card-project-tag">{issue.project.name}</div>
                    <div className="card-title">{issue.subject}</div>
                    <div className="card-footer">
                      <span className="card-issue-id">#{issue.id}</span>
                      <div className="card-assignee"><UserIcon /><span>{issue.assigned_to?.name || 'Unassigned'}</span></div>
                    </div>
                  </div>
                ))}
                {getIssuesForColumn('review').length === 0 && <div className="column-empty-state">No issues</div>}
              </div>
            </div>

            {/* Column 4: DONE */}
            <div className="kanban-column">
              <div className="column-header">
                <span className="column-title-dot done-dot"></span>
                <span className="column-title">Done</span>
                <span className="column-count">{getIssuesForColumn('done').length}</span>
              </div>
              <div className="column-cards">
                {getIssuesForColumn('done').map(issue => (
                  <div key={issue.id} className="issue-card finished-task" onClick={() => setSelectedIssue(issue)}>
                    <div className="card-project-tag">{issue.project.name}</div>
                    <div className="card-title">{issue.subject}</div>
                    <div className="card-footer">
                      <span className="card-issue-id">#{issue.id}</span>
                      <div className="card-assignee"><UserIcon /><span>{issue.assigned_to?.name || 'Unassigned'}</span></div>
                    </div>
                  </div>
                ))}
                {getIssuesForColumn('done').length === 0 && <div className="column-empty-state">No issues</div>}
              </div>
            </div>
          </div>
        )}

        {!loading && !error && view === 'list' && (
          <div className="list-view">
            <table className="issues-table">
              <thead>
                <tr>
                  <th className="col-id">#</th>
                  <th className="col-title">Issue</th>
                  <th className="col-project">Project</th>
                  <th className="col-status">Status</th>
                  <th className="col-assignee">Assignee</th>
                  <th className="col-date">Updated</th>
                </tr>
              </thead>
              <tbody>
                {filteredIssues.length === 0 ? (
                  <tr><td colSpan="6" className="table-empty">No issues found</td></tr>
                ) : (
                  filteredIssues.map(issue => (
                    <tr key={issue.id} className="table-row" onClick={() => setSelectedIssue(issue)}>
                      <td className="col-id">#{issue.id}</td>
                      <td className="col-title">{issue.subject}</td>
                      <td className="col-project"><span className="table-project-tag">{issue.project.name}</span></td>
                      <td className="col-status"><span className="table-status-badge">{translateStatus(issue.status.name)}</span></td>
                      <td className="col-assignee">{issue.assigned_to?.name || '–'}</td>
                      <td className="col-date">{new Date(issue.updated_on).toLocaleDateString('en-US')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        
        {isCommandOpen && (
          <CommandPalette 
            open={isCommandOpen}
            setOpen={setIsCommandOpen}
            issues={issues}
            users={users}
            statuses={statuses}
            selectedIssue={selectedIssue}
            onSelectIssue={setSelectedIssue}
            onUpdateIssueStatus={handleUpdateStatus}
            onAssignIssue={handleAssignUser}
            onGlobalFilterUser={setFilterUser}
            onGlobalFilterStatus={setFilterStatus}
            onOpenCreateTask={() => setIsCreateModalOpen(true)}
            onToggleTheme={setTheme}
          />
        )}
      </main>

      {/* 3. Modal: Create Task */}
      {isCreateModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
          <div className="modal-panel glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create new issue in Redmine</h3>
              <button className="close-modal-btn" onClick={() => setIsCreateModalOpen(false)}>
                <XIcon />
              </button>
            </div>
            
            <form onSubmit={handleCreateTask} className="modal-form">
              <div className="form-group">
                <label>Project *</label>
                <select 
                  value={newTask.project_id}
                  onChange={(e) => setNewTask({ ...newTask, project_id: e.target.value })}
                  required
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Issue subject *</label>
                <input 
                  type="text" 
                  value={newTask.subject}
                  onChange={(e) => setNewTask({ ...newTask, subject: e.target.value })}
                  placeholder="Describe the issue briefly..."
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea 
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  onPaste={handlePaste}
                  placeholder="Add detailed issue description..."
                  rows="4"
                ></textarea>
              </div>

              <div className="form-group">
                <label>Assignee</label>
                <select
                  value={newTask.assigned_to_id}
                  onChange={(e) => setNewTask({ ...newTask, assigned_to_id: e.target.value })}
                >
                  <option value="">Unassigned</option>
                  {users.length === 0
                    ? <option value="1">Redmarc Admin</option>
                    : users.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.name || (u.firstname && u.lastname ? `${u.firstname} ${u.lastname}` : u.login) || 'User'}
                        </option>
                      ))
                  }
                </select>
              </div>

              <div className="modal-footer-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsCreateModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create in Redmine</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3b. Modal: Create Project */}
      {isCreateProjectModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateProjectModalOpen(false)}>
          <div className="modal-panel glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create new project</h3>
              <button className="close-modal-btn" onClick={() => setIsCreateProjectModalOpen(false)}>
                <XIcon />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const name = e.target.name.value.trim();
                const identifier = e.target.identifier.value.trim();
                const description = e.target.description.value.trim();
                if (!name || !identifier) return;
                try {
                  setLoading(true);
                  await api.createProject({ name, identifier, description });
                  setIsCreateProjectModalOpen(false);
                  const [pData, iData] = await Promise.all([api.getProjects(), api.getIssues({ status_id: '*' })]);
                  setProjects(pData.projects || []);
                  setIssues(iData.issues || []);
                } catch (err) {
                  alert('Error creating project: ' + err.message);
                } finally {
                  setLoading(false);
                }
              }}
              className="modal-form"
            >
              <div className="form-group">
                <label>Project name *</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Example: Redmarc Interface"
                  required
                  autoFocus
                  onChange={(e) => {
                    const slug = e.target.value.toLowerCase()
                      .replace(/[^a-z0-9\s-]/g, '')
                      .trim().replace(/[\s_]+/g, '-');
                    e.target.form.identifier.value = slug;
                  }}
                />
              </div>
              <div className="form-group">
                <label>Identifier *</label>
                <input
                  type="text"
                  name="identifier"
                  placeholder="Redmarc-ui (letters, numbers, dashes)"
                  required
                />
                <span className="input-tip-helper">Generated automatically from name</span>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea name="description" rows="3" placeholder="Brief project description..." />
              </div>
              <div className="modal-footer-actions">
                <button type="button" className="btn" onClick={() => setIsCreateProjectModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create project</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3c. Modal: Delete Project Confirmation */}
      {deleteConfirm.isOpen && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm({ isOpen: false, projectId: null, projectName: '' })}>
          <div className="modal-panel glass-panel" style={{ maxWidth: '450px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Confirm deletion</h3>
              <button className="close-modal-btn" onClick={() => setDeleteConfirm({ isOpen: false, projectId: null, projectName: '' })}>
                <XIcon />
              </button>
            </div>
            <div className="modal-form">
              <p style={{ color: 'var(--text-primary)', fontSize: '14px' }}>Are you sure you want to delete the project <strong>"{deleteConfirm.projectName}"</strong>?</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '-8px' }}>All project issues will also be deleted. This action is irreversible.</p>
              <div className="modal-footer-actions mt-4">
                <button className="btn btn-secondary" onClick={() => setDeleteConfirm({ isOpen: false, projectId: null, projectName: '' })}>Cancel</button>
                <button className="btn" style={{ background: 'rgba(220, 38, 38, 0.8)', borderColor: 'rgba(220, 38, 38, 0.5)', color: '#fff' }} onClick={() => {
                  handleDeleteProject(deleteConfirm.projectId);
                  setDeleteConfirm({ isOpen: false, projectId: null, projectName: '' });
                }}>Delete project</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Modal: Issue Details */}
      {selectedIssue && (
        <div className="modal-overlay" onClick={() => setSelectedIssue(null)}>
          <div className="modal-panel glass-panel issue-details-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="details-header-meta">
                <span className="details-issue-id">#{selectedIssue.id}</span>
                <span className="details-project-tag">{selectedIssue.project.name}</span>
              </div>
              <button className="close-modal-btn" onClick={() => setSelectedIssue(null)}>
                <XIcon />
              </button>
            </div>

            <div className="details-content">
              <h2 className="details-title">{selectedIssue.subject}</h2>
              
              <div className="details-grid">
                <div className="details-main-section">
                  <h4 className="section-heading">Issue description</h4>
                  <div className="details-description">
                    {selectedIssue.description ? (
                      renderDescription(selectedIssue.description, selectedIssue.attachments)
                    ) : (
                      <span className="no-description">No description.</span>
                    )}
                  </div>

                  {selectedIssue.attachments && selectedIssue.attachments.length > 0 && (
                    <div className="details-attachments">
                      <h4 className="section-heading">Attachments</h4>
                      <ul className="attachment-list">
                        {selectedIssue.attachments.map(att => (
                          <li key={att.id}>
                            <a href={att.content_url} target="_blank" rel="noreferrer" className="attachment-link">
                              {att.filename}
                            </a> <span className="attachment-size">({Math.round(att.filesize / 1024)} KB)</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="details-sidebar-section">
                  <div className="control-group">
                    <label className="sidebar-label">Current status</label>
                    <select 
                      value={selectedIssue.status.id}
                      onChange={(e) => handleUpdateStatus(selectedIssue.id, e.target.value)}
                      className="details-select-status"
                    >
                      {statuses.map(s => (
                        <option key={s.id} value={s.id}>{translateStatus(s.name)}</option>
                      ))}
                    </select>
                  </div>

                  <div className="control-group">
                    <label className="sidebar-label">Assignee</label>
                    <select 
                      value={selectedIssue.assigned_to?.id || ''}
                      onChange={(e) => handleAssignUser(selectedIssue.id, e.target.value)}
                      className="details-select-status"
                    >
                      <option value="">Unassigned</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name || (u.firstname && u.lastname ? `${u.firstname} ${u.lastname}` : u.login) || 'User'}</option>
                      ))}
                    </select>
                  </div>

                  <div className="control-group">
                    <label className="sidebar-label">Updated date</label>
                    <div className="sidebar-value text-sm">
                      {new Date(selectedIssue.updated_on).toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="control-group border-t pt-4 mt-4">
                    <label className="sidebar-label">Redmine details</label>
                    <div className="redmine-link-info">
                      <KeyIcon />
                      <a 
                        href={`http://localhost:3000/issues/${selectedIssue.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="redmine-external-link"
                      >
                        Open in Redmine web interface
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Context menu for project deletion */}
      {contextMenu.visible && (
        <div
          className="context-menu-overlay"
          onClick={() => setContextMenu({ visible: false, x: 0, y: 0, projectId: null, projectName: '' })}
        >
          <div
            className="context-menu"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onClick={e => e.stopPropagation()}
          >
            <div className="context-menu-title">{contextMenu.projectName}</div>
            <button
              className="context-menu-item context-menu-danger"
              onClick={() => {
                const name = contextMenu.projectName;
                const id = contextMenu.projectId;
                setDeleteConfirm({ isOpen: true, projectId: id, projectName: name });
                setContextMenu({ visible: false, x: 0, y: 0, projectId: null, projectName: '' });
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              Delete project
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
