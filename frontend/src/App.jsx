import { useState, useCallback, useMemo } from 'react';
import './App.css';

import { ErrorBoundary } from './components/ErrorBoundary';
import { Sidebar } from './components/Sidebar';
import { AppHeader } from './components/AppHeader';
import { KanbanBoard } from './components/KanbanBoard';
import { ListView } from './components/ListView';
import { IssueDetailPanel } from './components/IssueDetailPanel';
import { CreateIssueModal } from './components/CreateIssueModal';
import { CreateProjectModal } from './components/CreateProjectModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { ContextMenu } from './components/ContextMenu';
import CommandPalette from './components/CommandPalette';

import { useAppData } from './hooks/useAppData';
import { useTheme } from './hooks/useTheme';
import { useKeyboard } from './hooks/useKeyboard';
import { groupIssuesByColumn } from './utils/statusMapping';

function App() {
  const { theme, setTheme, toggleTheme } = useTheme();

  const {
    issues, projects, statuses, users,
    loading, error,
    loadData,
    updateIssueStatus,
    assignUser,
    createIssue,
    createProject,
    deleteProject,
  } = useAppData();

  // UI state
  const [view, setView]                   = useState('kanban');
  const [activeProject, setActiveProject] = useState('all');
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [searchQuery, setSearchQuery]     = useState('');
  const [filterUser, setFilterUser]       = useState(null);
  const [filterStatus, setFilterStatus]   = useState(null);

  // Modal state
  const [isCreateIssueOpen, setIsCreateIssueOpen]     = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm]             = useState({ isOpen: false, project: null });
  const [contextMenu, setContextMenu]                 = useState({ visible: false, x: 0, y: 0, project: null });
  const [isCommandOpen, setIsCommandOpen]             = useState(false);

  const isAnyModalOpen = isCreateIssueOpen || isCreateProjectOpen || deleteConfirm.isOpen;

  // Close all overlays
  const closeAll = useCallback(() => {
    setSelectedIssue(null);
    setIsCommandOpen(false);
    setContextMenu({ visible: false, x: 0, y: 0, project: null });
  }, []);

  const openDeleteConfirm = useCallback(project => {
    setDeleteConfirm({ isOpen: true, project });
  }, []);

  const handleDeleteActiveProject = useCallback(project => {
    openDeleteConfirm(project);
  }, [openDeleteConfirm]);

  // Keyboard shortcuts
  useKeyboard({
    onCreateIssue:          () => setIsCreateIssueOpen(true),
    onCreateProject:        () => setIsCreateProjectOpen(true),
    onRefresh:              loadData,
    onToggleCommandPalette: () => setIsCommandOpen(o => !o),
    onDeleteActiveProject:  handleDeleteActiveProject,
    onCloseAll:             closeAll,
    activeProject,
    projects,
    isAnyModalOpen,
  });

  // Filter issues
  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      const matchesProject =
        activeProject === 'all' || issue.project.id === parseInt(activeProject);
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        issue.subject.toLowerCase().includes(q) ||
        (issue.description && issue.description.toLowerCase().includes(q)) ||
        `#${issue.id}`.includes(q);
      const matchesUser   = !filterUser   || issue.assigned_to?.id === filterUser;
      const matchesStatus = !filterStatus || issue.status?.id === filterStatus;
      return matchesProject && matchesSearch && matchesUser && matchesStatus;
    });
  }, [issues, activeProject, searchQuery, filterUser, filterStatus]);

  const groupedIssues = useMemo(() => groupIssuesByColumn(filteredIssues), [filteredIssues]);

  // Status / assignee handlers wiring statuses/users into the hook
  const handleUpdateStatus = useCallback((issueId, statusId) => {
    updateIssueStatus(issueId, statusId, statuses).catch(() => {});
    // Also refresh selectedIssue if it matches
    if (selectedIssue?.id === issueId) {
      const s = statuses.find(st => st.id === parseInt(statusId));
      if (s) setSelectedIssue(prev => ({ ...prev, status: { id: s.id, name: s.name } }));
    }
  }, [updateIssueStatus, statuses, selectedIssue]);

  const handleAssignUser = useCallback((issueId, userId) => {
    assignUser(issueId, userId, users).catch(() => {});
    if (selectedIssue?.id === issueId) {
      const u = users.find(u => u.id === parseInt(userId));
      const assignee = u
        ? { id: u.id, name: u.name || `${u.firstname} ${u.lastname}`.trim() || u.login }
        : null;
      setSelectedIssue(prev => ({ ...prev, assigned_to: assignee }));
    }
  }, [assignUser, users, selectedIssue]);

  const handleCreateIssue = useCallback(async issueData => {
    await createIssue(issueData);
  }, [createIssue]);

  const handleCreateProject = useCallback(async projectData => {
    await createProject(projectData);
  }, [createProject]);

  const handleDeleteProject = useCallback(async () => {
    if (!deleteConfirm.project) return;
    await deleteProject(deleteConfirm.project.id, activeProject, setActiveProject);
    setDeleteConfirm({ isOpen: false, project: null });
  }, [deleteProject, deleteConfirm.project, activeProject]);

  // Default project id for create issue modal
  const defaultProjectId = activeProject !== 'all' ? activeProject : projects[0]?.id || '';

  return (
    <ErrorBoundary>
      <div className="app-container">
        {/* Sidebar */}
        <Sidebar
          projects={projects}
          activeProject={activeProject}
          onSelectProject={setActiveProject}
          onCreateProject={() => setIsCreateProjectOpen(true)}
          onDeleteProject={proj => {
            setContextMenu({ visible: false, x: 0, y: 0, project: null });
            openDeleteConfirm(proj);
          }}
          issues={issues}
          theme={theme}
          onToggleTheme={toggleTheme}
          loading={loading}
        />

        {/* Main workspace */}
        <main className="app-workspace">
          <AppHeader
            activeProject={activeProject}
            projects={projects}
            view={view}
            onSetView={setView}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filterUser={filterUser}
            filterStatus={filterStatus}
            onClearFilters={() => { setFilterUser(null); setFilterStatus(null); setSearchQuery(''); }}
            onCreateIssue={() => setIsCreateIssueOpen(true)}
            onRefresh={loadData}
            onOpenCommandPalette={() => setIsCommandOpen(true)}
            theme={theme}
            onToggleTheme={toggleTheme}
            loading={loading}
          />

          {/* Error state */}
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

          {/* Loading state */}
          {loading && (
            <div className="loading-container">
              <div className="loader-spinner" />
              <span className="loading-text">Synchronizing with Redmine...</span>
            </div>
          )}

          {/* Kanban view */}
          {!loading && !error && view === 'kanban' && (
            <KanbanBoard
              groupedIssues={groupedIssues}
              onIssueClick={setSelectedIssue}
              onAddIssue={() => setIsCreateIssueOpen(true)}
            />
          )}

          {/* List view */}
          {!loading && !error && view === 'list' && (
            <ListView
              issues={filteredIssues}
              onIssueClick={setSelectedIssue}
            />
          )}

          {/* Command palette */}
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
              onOpenCreateTask={setIsCreateIssueOpen}
              onToggleTheme={setTheme}
            />
          )}
        </main>

        {/* Right-side issue detail drawer */}
        <IssueDetailPanel
          issue={selectedIssue}
          statuses={statuses}
          users={users}
          onClose={() => setSelectedIssue(null)}
          onUpdateStatus={handleUpdateStatus}
          onAssignUser={handleAssignUser}
        />

        {/* Create Issue modal */}
        {isCreateIssueOpen && (
          <CreateIssueModal
            projects={projects}
            statuses={statuses}
            users={users}
            defaultProjectId={defaultProjectId}
            defaultStatusId=""
            onSubmit={handleCreateIssue}
            onClose={() => setIsCreateIssueOpen(false)}
          />
        )}

        {/* Create Project modal */}
        {isCreateProjectOpen && (
          <CreateProjectModal
            onSubmit={handleCreateProject}
            onClose={() => setIsCreateProjectOpen(false)}
          />
        )}

        {/* Delete Confirm modal */}
        {deleteConfirm.isOpen && (
          <DeleteConfirmModal
            projectName={deleteConfirm.project?.name || ''}
            onConfirm={handleDeleteProject}
            onClose={() => setDeleteConfirm({ isOpen: false, project: null })}
          />
        )}

        {/* Context menu (right-click on project) */}
        {contextMenu.visible && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            projectName={contextMenu.project?.name || ''}
            onDelete={() => openDeleteConfirm(contextMenu.project)}
            onClose={() => setContextMenu({ visible: false, x: 0, y: 0, project: null })}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;
