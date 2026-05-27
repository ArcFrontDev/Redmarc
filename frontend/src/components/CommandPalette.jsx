import { useState, useEffect } from 'react';
import { Command } from 'cmdk';

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
  onToggleTheme
}) {
  const [search, setSearch] = useState('');

  // Toggle the menu when ⌘K or Ctrl+K is pressed
  useEffect(() => {
    const down = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [setOpen]);

  // Reset search on close
  useEffect(() => {
    if (!open) {
      setSearch('');
    }
  }, [open]);

  const isActionMode = search.startsWith('>');
  const isUserMode = search.startsWith('@');
  const isEmpty = search.trim() === '';

  const handleSelectIssue = (issue) => {
    onSelectIssue(issue);
    setOpen(false);
  };

  const handleUpdateStatus = (statusId) => {
    if (selectedIssue) {
      onUpdateIssueStatus(selectedIssue.id, statusId);
    } else {
      onGlobalFilterStatus(statusId);
    }
    setOpen(false);
  };

  const handleAssignUser = (userId) => {
    if (selectedIssue) {
      onAssignIssue(selectedIssue.id, userId);
    } else {
      onGlobalFilterUser(userId);
    }
    setOpen(false);
  };

  const handleGlobalAction = (action) => {
    if (action === 'create') {
      onOpenCreateTask(true);
    } else if (action === 'theme_dark') {
      onToggleTheme('dark');
    } else if (action === 'theme_light') {
      onToggleTheme('light');
    }
    setOpen(false);
  };

  const recentIssues = issues.slice(0, 4);

  return (
    <Command.Dialog 
      open={open} 
      onOpenChange={setOpen} 
      label="Global Command Menu"
      className="cmdk-dialog"
      filter={(value, search) => {
        if (!search) return 1;
        let normalizedSearch = search.toLowerCase();
        if (normalizedSearch.startsWith('>') || normalizedSearch.startsWith('@')) {
          normalizedSearch = normalizedSearch.slice(1).trim();
        }
        if (!normalizedSearch) return 1;
        if (value.toLowerCase().includes(normalizedSearch)) return 1;
        return 0;
      }}
    >
      <div className="cmdk-overlay" onClick={() => setOpen(false)} />
      <div className="cmdk-content glass-panel">
        <div className="cmdk-input-wrapper">
          <Command.Input 
            autoFocus
            value={search}
            onValueChange={setSearch}
            placeholder="Type a command (>, @) or search..." 
            className="cmdk-input"
          />
        </div>

        <Command.List className="cmdk-list">
          <Command.Empty className="cmdk-empty">No results found.</Command.Empty>

          {isEmpty && (
            <Command.Group heading="Suggested Actions">
              <Command.Item onSelect={() => handleGlobalAction('create')} className="cmdk-item">
                <span className="cmdk-action-icon">+</span> Create new issue
              </Command.Item>
              <Command.Item onSelect={() => handleGlobalAction('theme_dark')} className="cmdk-item">
                <span className="cmdk-action-icon">🌙</span> Dark mode
              </Command.Item>
              <Command.Item onSelect={() => handleGlobalAction('theme_light')} className="cmdk-item">
                <span className="cmdk-action-icon">☀️</span> Light mode
              </Command.Item>
              {recentIssues.length > 0 && (
                <>
                  <div className="cmdk-separator" />
                  <div className="cmdk-group-heading">Recent Issues</div>
                  {recentIssues.map(issue => (
                    <Command.Item key={`recent-${issue.id}`} onSelect={() => handleSelectIssue(issue)} className="cmdk-item">
                      <span className="cmdk-issue-id">#{issue.id}</span>
                      {issue.subject}
                    </Command.Item>
                  ))}
                </>
              )}
            </Command.Group>
          )}

          {isActionMode && (
            <Command.Group heading={selectedIssue ? "Current Issue Actions" : "Global Actions & Filters"}>
              {!selectedIssue && (
                <>
                  <Command.Item onSelect={() => handleGlobalAction('create')} className="cmdk-item">
                    Create issue (create / new)
                  </Command.Item>
                  <Command.Item onSelect={() => handleGlobalAction('theme_dark')} className="cmdk-item">
                    Dark mode (theme dark)
                  </Command.Item>
                  <Command.Item onSelect={() => handleGlobalAction('theme_light')} className="cmdk-item">
                    Light mode (theme light)
                  </Command.Item>
                  <div className="cmdk-separator" />
                </>
              )}
              {statuses.map(s => {
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
                return (
                  <Command.Item 
                    key={s.id}
                    onSelect={() => handleUpdateStatus(s.id)}
                    className="cmdk-item"
                  >
                    {selectedIssue ? `Change status to: ${translateStatus(s.name)}` : `Filter by status: ${translateStatus(s.name)}`}
                  </Command.Item>
                );
              })}
              {!selectedIssue && (
                <Command.Item onSelect={() => handleUpdateStatus(null)} className="cmdk-item cmdk-reset">
                  Clear status filter
                </Command.Item>
              )}
            </Command.Group>
          )}

          {isUserMode && (
            <Command.Group heading={selectedIssue ? "Assign User" : "Filter by Assignee"}>
              {users.map(u => (
                <Command.Item 
                  key={u.id}
                  onSelect={() => handleAssignUser(u.id)}
                  className="cmdk-item"
                >
                  {selectedIssue ? `Assign to: ${u.name}` : `Filter by assignee: ${u.name}`}
                </Command.Item>
              ))}
              {!selectedIssue && (
                <Command.Item onSelect={() => handleAssignUser(null)} className="cmdk-item cmdk-reset">
                  Clear assignee filter
                </Command.Item>
              )}
            </Command.Group>
          )}

          {/* Text search removed from Command Palette - use Header Search instead */}
        </Command.List>
      </div>
    </Command.Dialog>
  );
}
