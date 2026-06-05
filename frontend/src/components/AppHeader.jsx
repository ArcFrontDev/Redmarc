import React from 'react';

const SearchIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const XIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const PlusIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const MoonIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const SunIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const KanbanIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="5" height="18" rx="1" /><rect x="10" y="3" width="5" height="18" rx="1" /><rect x="17" y="3" width="4" height="18" rx="1" />
  </svg>
);

const ListIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
    <circle cx="3" cy="6" r="1" fill="currentColor" /><circle cx="3" cy="12" r="1" fill="currentColor" /><circle cx="3" cy="18" r="1" fill="currentColor" />
  </svg>
);

const RefreshIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
  </svg>
);

export function AppHeader({
  activeProject,
  projects,
  view,
  onSetView,
  searchQuery,
  onSearchChange,
  searchRef,
  filterUser,
  filterStatus,
  onClearFilters,
  onCreateIssue,
  onRefresh,
  onOpenCommandPalette,
  theme,
  onToggleTheme,
  loading,
}) {
  const activeProjectName =
    activeProject === 'all'
      ? 'All Projects'
      : projects.find(p => String(p.id) === activeProject)?.name || 'Project';

  const hasFilters = filterUser || filterStatus || searchQuery;

  return (
    <header className="workspace-header">
      {/* Left: breadcrumb */}
      <div className="header-left">
        <span className="header-breadcrumb" title={activeProjectName}>
          {activeProjectName}
        </span>
      </div>

      {/* Center: search */}
      <div className="header-center">
        <div className="header-search-bar">
          <SearchIcon />
          <input
            ref={searchRef}
            type="text"
            className="search-input"
            placeholder="Search issues... (F)"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => onSearchChange('')} title="Clear search">
              <XIcon />
            </button>
          )}
        </div>

        {hasFilters && (
          <div
            className="active-filters"
            onClick={onClearFilters}
            title="Clear all filters"
          >
            <span>Clear filters</span>
            <XIcon />
          </div>
        )}
      </div>

      {/* Right: actions */}
      <div className="header-actions">
        {/* View toggle */}
        <div className="view-toggle">
          <button
            className={`view-btn ${view === 'kanban' ? 'active' : ''}`}
            onClick={() => onSetView('kanban')}
            title="Kanban board"
          >
            <KanbanIcon />
            Kanban
          </button>
          <button
            className={`view-btn ${view === 'list' ? 'active' : ''}`}
            onClick={() => onSetView('list')}
            title="Issue list"
          >
            <ListIcon />
            List
          </button>
        </div>

        <button className="btn btn-primary" onClick={onCreateIssue}>
          <PlusIcon />
          Create issue
        </button>

        <button
          className="btn btn-icon"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>

        <button
          className="btn btn-icon"
          onClick={onRefresh}
          title="Refresh data (R)"
          disabled={loading}
          style={{ opacity: loading ? 0.5 : 1 }}
        >
          <RefreshIcon />
        </button>
      </div>
    </header>
  );
}
