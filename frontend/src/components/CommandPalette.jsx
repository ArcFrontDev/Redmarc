import { useState, useEffect } from 'react';
import { Command } from 'cmdk';
import { formatStatusName } from '../utils/statusMapping';

export default function CommandPalette({
  open,
  setOpen,
  issues,
  users,
  statuses,
  selectedIssue,
  onSelectIssue,
  onUpdateIssueStatus,
  onAssignIssue,
  onGlobalFilterUser,
  onGlobalFilterStatus,
  onOpenCreateTask,
  onToggleTheme,
}) {
  const [search, setSearch] = useState('');

  // Ctrl+K toggles the palette (also handled in useKeyboard, but kept here for robustness)
  useEffect(() => {
    const handler = e => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(o => !o);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [setOpen]);

  // Clear search on close
  useEffect(() => {
    if (!open) setSearch('');
  }, [open]);

  const isActionMode = search.startsWith('>');
  const isUserMode = search.startsWith('@');
  const isEmpty = search.trim() === '';

  // Fuzzy match helper (case-insensitive contains)
  const matches = (text, query) => {
    if (!query) return true;
    return text.toLowerCase().includes(query.toLowerCase());
  };

  const handleSelectIssue = issue => {
    onSelectIssue(issue);
    setOpen(false);
  };

  const handleUpdateStatus = statusId => {
    if (selectedIssue) {
      onUpdateIssueStatus(selectedIssue.id, statusId);
    } else {
      onGlobalFilterStatus(statusId);
    }
    setOpen(false);
  };

  const handleAssignUser = userId => {
    if (selectedIssue) {
      onAssignIssue(selectedIssue.id, userId);
    } else {
      onGlobalFilterUser(userId);
    }
    setOpen(false);
  };

  const handleGlobalAction = action => {
    if (action === 'create') onOpenCreateTask(true);
    else if (action === 'theme_dark') onToggleTheme('dark');
    else if (action === 'theme_light') onToggleTheme('light');
    setOpen(false);
  };

  const recentIssues = issues.slice(0, 5);

  // Issues matching the search query
  const searchTerm = search.replace(/^[>@]/, '').trim();
  const matchingIssues = searchTerm
    ? issues.filter(i =>
        matches(i.subject, searchTerm) ||
        matches(`#${i.id}`, searchTerm) ||
        matches(i.project.name, searchTerm)
      ).slice(0, 8)
    : [];

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Command Menu"
      className="cmdk-dialog"
      filter={(value, search) => {
        // Custom filter disabled — we handle filtering ourselves
        return 1;
      }}
    >
      <div className="cmdk-overlay" onClick={() => setOpen(false)} />
      <div className="cmdk-content glass-panel">
        <div className="cmdk-input-wrapper">
          <Command.Input
            autoFocus
            value={search}
            onValueChange={setSearch}
            placeholder="Search issues, projects or type a command (>, @)..."
            className="cmdk-input"
          />
        </div>

        <Command.List className="cmdk-list">
          <Command.Empty className="cmdk-empty">No results found.</Command.Empty>

          {/* Empty state — show actions + recent issues */}
          {isEmpty && (
            <>
              <Command.Group heading="Actions">
                <Command.Item
                  onSelect={() => handleGlobalAction('create')}
                  className="cmdk-item"
                  value="create issue"
                >
                  <span className="cmdk-action-icon">+</span>
                  Create new issue
                </Command.Item>
                <Command.Item
                  onSelect={() => handleGlobalAction('theme_dark')}
                  className="cmdk-item"
                  value="switch dark mode"
                >
                  <span className="cmdk-action-icon">🌙</span>
                  Switch to Dark mode
                </Command.Item>
                <Command.Item
                  onSelect={() => handleGlobalAction('theme_light')}
                  className="cmdk-item"
                  value="switch light mode"
                >
                  <span className="cmdk-action-icon">☀️</span>
                  Switch to Light mode
                </Command.Item>
              </Command.Group>

              {recentIssues.length > 0 && (
                <>
                  <div className="cmdk-separator" />
                  <Command.Group heading="Recent Issues">
                    {recentIssues.map(issue => (
                      <Command.Item
                        key={`recent-${issue.id}`}
                        onSelect={() => handleSelectIssue(issue)}
                        className="cmdk-item"
                        value={`#${issue.id} ${issue.subject}`}
                      >
                        <span className="cmdk-issue-id">#{issue.id}</span>
                        {issue.subject}
                      </Command.Item>
                    ))}
                  </Command.Group>
                </>
              )}
            </>
          )}

          {/* Issue search results */}
          {!isEmpty && !isActionMode && !isUserMode && matchingIssues.length > 0 && (
            <Command.Group heading="Issues">
              {matchingIssues.map(issue => (
                <Command.Item
                  key={issue.id}
                  onSelect={() => handleSelectIssue(issue)}
                  className="cmdk-item"
                  value={`#${issue.id} ${issue.subject} ${issue.project.name}`}
                >
                  <span className="cmdk-issue-id">#{issue.id}</span>
                  <span style={{ flex: 1 }}>{issue.subject}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{issue.project.name}</span>
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {/* > action mode */}
          {isActionMode && (
            <Command.Group heading={selectedIssue ? 'Issue Actions' : 'Global Actions'}>
              {!selectedIssue && (
                <>
                  <Command.Item
                    onSelect={() => handleGlobalAction('create')}
                    className="cmdk-item"
                    value="create issue"
                  >
                    <span className="cmdk-action-icon">+</span>
                    Create new issue
                  </Command.Item>
                  <Command.Item
                    onSelect={() => handleGlobalAction('theme_dark')}
                    className="cmdk-item"
                    value="dark mode"
                  >
                    Dark mode
                  </Command.Item>
                  <Command.Item
                    onSelect={() => handleGlobalAction('theme_light')}
                    className="cmdk-item"
                    value="light mode"
                  >
                    Light mode
                  </Command.Item>
                  <div className="cmdk-separator" />
                </>
              )}

              {statuses.map(s => (
                <Command.Item
                  key={s.id}
                  onSelect={() => handleUpdateStatus(s.id)}
                  className="cmdk-item"
                  value={`status ${s.name} ${formatStatusName(s.name)}`}
                >
                  {selectedIssue
                    ? `Change status → ${formatStatusName(s.name)}`
                    : `Filter by status: ${formatStatusName(s.name)}`}
                </Command.Item>
              ))}

              {!selectedIssue && (
                <Command.Item
                  onSelect={() => handleUpdateStatus(null)}
                  className="cmdk-item cmdk-reset"
                  value="clear status filter"
                >
                  Clear status filter
                </Command.Item>
              )}
            </Command.Group>
          )}

          {/* @ user mode */}
          {isUserMode && (
            <Command.Group heading={selectedIssue ? 'Assign User' : 'Filter by Assignee'}>
              {users.map(u => (
                <Command.Item
                  key={u.id}
                  onSelect={() => handleAssignUser(u.id)}
                  className="cmdk-item"
                  value={`user ${u.name || u.login}`}
                >
                  <span className="cmdk-action-icon" style={{ fontSize: '13px' }}>
                    {(u.name || u.login || 'U').charAt(0).toUpperCase()}
                  </span>
                  {selectedIssue
                    ? `Assign to: ${u.name || u.login}`
                    : `Filter by: ${u.name || u.login}`}
                </Command.Item>
              ))}
              {!selectedIssue && (
                <Command.Item
                  onSelect={() => handleAssignUser(null)}
                  className="cmdk-item cmdk-reset"
                  value="clear assignee filter"
                >
                  Clear assignee filter
                </Command.Item>
              )}
            </Command.Group>
          )}
        </Command.List>
      </div>
    </Command.Dialog>
  );
}
