import { useState, useCallback, useMemo, useRef } from 'react';
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
import { HotkeysModal } from './components/HotkeysModal';
import CommandPalette from './components/CommandPalette';

import { useAppData } from './hooks/useAppData';
import { useTheme } from './hooks/useTheme';
import { useKeyboard } from './hooks/useKeyboard';
import { useDragAndDrop } from './hooks/useDragAndDrop';
import { groupIssuesByColumn } from './utils/statusMapping';

function App() {
  const { theme, setTheme, toggleTheme } = useTheme();
  const searchRef = useRef(null);

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
  const [detailInitialFocus, setDetailInitialFocus] = useState(null);
  const [searchQuery, setSearchQuery]     = useState('');
  const [filterUser, setFilterUser]       = useState(null);
  const [filterStatus, setFilterStatus]   = useState(null);

  // Keyboard card focus
  const [focusedCard, setFocusedCard]     = useState(null);

  // Modal state
  const [isCreateIssueOpen, setIsCreateIssueOpen]     = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm]             = useState({ isOpen: false, project: null });
  const [contextMenu, setContextMenu]                 = useState({ visible: false, x: 0, y: 0, project: null });
  const [isCommandOpen, setIsCommandOpen]             = useState(false);
  const [isHotkeysOpen, setIsHotkeysOpen]             = useState(false);

  const isAnyModalOpen = isCreateIssueOpen || isCreateProjectOpen || deleteConfirm.isOpen || isHotkeysOpen;

  const closeAll = useCallback(() => {
    setSelectedIssue(null);
    setIsCommandOpen(false);
    setIsHotkeysOpen(false);
    setContextMenu({ visible: false, x: 0, y: 0, project: null });
  }, []);

  const openDeleteConfirm = useCallback(project => {
    setDeleteConfirm({ isOpen: true, project });
  }, []);

  const handleDeleteActiveProject = useCallback(project => {
    openDeleteConfirm(project);
  }, [openDeleteConfirm]);

  const handleUpdateStatus = useCallback((issueId, statusId) => {
    updateIssueStatus(issueId, statusId, statuses).catch(() => {});
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

  //Move focused card to a column by key (1-4 shortcut)
  const handleMoveCardToColumn = useCallback((issueId, colKey) => {
    const target = statuses.find(s => {
      const n = s.name.toLowerCase();
      if (colKey === 'todo')     return n.includes('new') || n.includes('open') || n.includes('backlog') || n.includes('to do') || n.includes('новая') || n.includes('открыта');
      if (colKey === 'progress') return n.includes('progress') || n.includes('active') || n.includes('started') || n.includes('в работе');
      if (colKey === 'review')   return n.includes('review') || n.includes('feedback') || n.includes('testing') || n.includes('resolved') || n.includes('на проверке');
      if (colKey === 'done')     return n.includes('closed') || n.includes('done') || n.includes('completed') || n.includes('закрыта');
      return false;
    });
    if (target) handleUpdateStatus(issueId, target.id);
  }, [statuses, handleUpdateStatus]);

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

  // Base grouped (no sort order)
  const baseGrouped = useMemo(
    () => groupIssuesByColumn(filteredIssues, {}),
    [filteredIssues]
  );

  // DnD hook
  const { sortOrder, handleDragEnd } = useDragAndDrop({
    groupedIssues: baseGrouped,
    statuses,
    handleUpdateStatus,
  });

  // Final grouped with sort order applied
  const groupedIssues = useMemo(
    () => groupIssuesByColumn(filteredIssues, sortOrder),
    [filteredIssues, sortOrder]
  );

  // Open focused card helper
  const openFocusedCard = useCallback((focus = null) => {
    if (!focusedCard) return;
    const allIssues = Object.values(groupedIssues).flat();
    const issue = allIssues.find(i => i.id === focusedCard.issueId);
    if (issue) {
      setDetailInitialFocus(focus);
      setSelectedIssue(issue);
    }
  }, [focusedCard, groupedIssues]);

  useKeyboard({
    onCreateIssue:          () => setIsCreateIssueOpen(true),
    onCreateProject:        () => setIsCreateProjectOpen(true),
    onRefresh:              loadData,
    onToggleCommandPalette: () => setIsCommandOpen(o => !o),
    onDeleteActiveProject:  handleDeleteActiveProject,
    onCloseAll:             closeAll,
    onToggleView:           () => setView(v => v === 'kanban' ? 'list' : 'kanban'),
    onFocusSearch:          () => searchRef.current?.focus(),
    onOpenHotkeys:          () => setIsHotkeysOpen(o => !o),
    activeProject,
    projects,
    isAnyModalOpen,
    //Card navigation
    groupedIssues,
    focusedCard,
    setFocusedCard,
    onOpenFocusedCard:    () => openFocusedCard(null),
    onQuickAssign:        () => openFocusedCard('assignee'),
    onQuickStatus:        () => openFocusedCard('status'),
    onQuickEdit:          () => openFocusedCard('title'),
    onMoveCardToColumn:   handleMoveCardToColumn,
  });

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

  const handleIssueUpdated = useCallback(() => {
    loadData();
  }, [loadData]);

  const defaultProjectId = activeProject !== 'all' ? activeProject : projects[0]?.id || '';

  return (
    <ErrorBoundary>
      <div className="app-container">
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
          loading={loading}
          onOpenHotkeys={() => setIsHotkeysOpen(true)}
        />

        <main className="app-workspace">
          <AppHeader
            activeProject={activeProject}
            projects={projects}
            view={view}
            onSetView={setView}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchRef={searchRef}
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

          {error && (
            <div className="error-panel">
              <div className="error-icon">&#9888;</div>
              <div className="error-text">
                <h4>Server connection error</h4>
                <p>{error}</p>
                <button className="btn mt-3" onClick={loadData}>Retry</button>
              </div>
            </div>
          )}

          {loading && (
            <div className="loading-container">
              <div className="loader-spinner" />
              <span className="loading-text">Synchronizing with Redmine...</span>
            </div>
          )}

          {!loading && !error && view === 'kanban' && (
            <KanbanBoard
              groupedIssues={groupedIssues}
              onIssueClick={issue => { setDetailInitialFocus(null); setSelectedIssue(issue); }}
              onAddIssue={() => setIsCreateIssueOpen(true)}
              onDragEnd={handleDragEnd}
              focusedCardId={focusedCard?.issueId || null}
            />
          )}

          {!loading && !error && view === 'list' && (
            <ListView
              issues={filteredIssues}
              onIssueClick={issue => { setDetailInitialFocus(null); setSelectedIssue(issue); }}
            />
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
              onOpenCreateTask={setIsCreateIssueOpen}
              onToggleTheme={setTheme}
            />
          )}
        </main>

        <IssueDetailPanel
          issue={selectedIssue}
          statuses={statuses}
          users={users}
          onClose={() => { setSelectedIssue(null); setDetailInitialFocus(null); }}
          onUpdateStatus={handleUpdateStatus}
          onAssignUser={handleAssignUser}
          onIssueUpdated={handleIssueUpdated}
          initialFocus={detailInitialFocus}
          onOpenIssue={(issueId) => {
            // Navigate to another issue by ID – look up in local list or create a stub
            const found = issues.find(i => i.id === issueId);
            setDetailInitialFocus(null);
            setSelectedIssue(found || { id: issueId });
          }}
        />

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

        {isCreateProjectOpen && (
          <CreateProjectModal
            onSubmit={handleCreateProject}
            onClose={() => setIsCreateProjectOpen(false)}
          />
        )}

        {deleteConfirm.isOpen && (
          <DeleteConfirmModal
            projectName={deleteConfirm.project?.name || ''}
            onConfirm={handleDeleteProject}
            onClose={() => setDeleteConfirm({ isOpen: false, project: null })}
          />
        )}

        {isHotkeysOpen && (
          <HotkeysModal onClose={() => setIsHotkeysOpen(false)} />
        )}

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
