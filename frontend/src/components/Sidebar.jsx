import React from 'react';
import logoUrl from '../assets/logo.png';

const PlusIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const FolderIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);



export function Sidebar({
  projects,
  activeProject,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  issues,
  loading,
}) {
  return (
    <aside className="app-sidebar">
      {/* Brand header */}
      <div className="brand-header">
        <div className="brand-logo-circle">
          <img src={logoUrl} alt="Redmarc" className="brand-logo-img" />
        </div>
        <span className="brand-name">Redmarc</span>
        <span className="brand-tag">BETA</span>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-header">
          <span className="sidebar-section-title">Projects</span>
          <button
            className="add-project-btn"
            onClick={onCreateProject}
            title="Create new project (P)"
          >
            <PlusIcon />
          </button>
        </div>

        {/* All Projects */}
        <button
          className={`nav-item ${activeProject === 'all' ? 'active' : ''}`}
          onClick={() => onSelectProject('all')}
        >
          <FolderIcon />
          <span className="nav-item-text">All Projects</span>
          <span className="nav-item-count">{projects.length}</span>
        </button>

        {/* Individual projects */}
        {projects.map(proj => {
          const count = issues.filter(i => i.project.id === proj.id).length;
          return (
            <button
              key={proj.id}
              className={`nav-item ${activeProject === String(proj.id) ? 'active' : ''}`}
              onClick={() => onSelectProject(String(proj.id))}
              onContextMenu={e => {
                e.preventDefault();
                onDeleteProject(proj);
              }}
              title={`${proj.name} — right-click to delete`}
            >
              <FolderIcon />
              <span className="nav-item-text">{proj.name}</span>
              {count > 0 && <span className="nav-item-count">{count}</span>}
            </button>
          );
        })}
      </nav>

      {/* Keyboard shortcuts reference */}
      <div className="sidebar-hotkeys">
        <div className="hotkey-item">
          <span>Create issue</span>
          <kbd>C</kbd>
        </div>
        <div className="hotkey-item">
          <span>New project</span>
          <kbd>P</kbd>
        </div>
        <div className="hotkey-item">
          <span>Refresh</span>
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

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="api-status">
          <div className="status-indicator online" />
          <span>Redmarc Plugin</span>
        </div>
        <div className="user-profile">
          <div className="user-avatar">RM</div>
          <div className="user-info">
            <span className="user-name">Redmine User</span>
            <span className="user-role">Connected</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
