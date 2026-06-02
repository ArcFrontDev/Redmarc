import React, { useEffect, useRef } from 'react';
import { formatStatusName } from '../utils/statusMapping';

const XIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const KeyIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </svg>
);

const renderDescription = (text, attachments = []) => {
  if (!text) return null;
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  attachments.forEach(att => {
    const safe = att.filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const imgUrl = `/attachments/download/${att.id}/${att.filename}`;
    const imgTag = `<br/><img src="${imgUrl}" alt="${att.filename}" class="issue-attachment-img" /><br/>`;
    html = html.replace(new RegExp(`!${safe}!`, 'g'), imgTag);
    html = html.replace(new RegExp(`!\\[.*?\\]\\(${safe}\\)`, 'g'), imgTag);
  });

  html = html.replace(/\n/g, '<br/>');
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
};

export function IssueDetailPanel({ issue, statuses, users, onClose, onUpdateStatus, onAssignUser }) {
  const isOpen = Boolean(issue);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Open in Redmine link uses window.location.origin (not hardcoded localhost)
  const redmineIssueUrl = issue
    ? `${window.location.origin}/issues/${issue.id}`
    : '#';

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div className="issue-detail-drawer-overlay" onClick={onClose} />
      )}

      {/* Drawer */}
      <div className={`issue-detail-drawer ${isOpen ? 'is-open' : ''}`}>
        {issue && (
          <>
            {/* Header */}
            <div className="drawer-header">
              <div className="drawer-header-meta">
                <span className="details-issue-id">#{issue.id}</span>
                <span className="details-project-tag">{issue.project.name}</span>
              </div>
              <button className="close-modal-btn" onClick={onClose} title="Close (Esc)">
                <XIcon />
              </button>
            </div>

            {/* Body */}
            <div className="drawer-body">
              <div className="drawer-content">
                <h2 className="details-title">{issue.subject}</h2>

                <h4 className="section-heading">Description</h4>
                <div className="details-description">
                  {issue.description
                    ? renderDescription(issue.description, issue.attachments)
                    : <span className="no-description">No description provided.</span>
                  }
                </div>

                {issue.attachments && issue.attachments.length > 0 && (
                  <div className="details-attachments">
                    <h4 className="section-heading" style={{ marginTop: '16px' }}>Attachments</h4>
                    <ul className="attachment-list">
                      {issue.attachments.map(att => (
                        <li key={att.id}>
                          <a
                            href={att.content_url}
                            target="_blank"
                            rel="noreferrer"
                            className="attachment-link"
                          >
                            {att.filename}
                          </a>
                          <span className="attachment-size">
                            ({Math.round(att.filesize / 1024)} KB)
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Sidebar controls */}
              <div className="drawer-sidebar">
                <div className="control-group">
                  <label className="sidebar-label">Status</label>
                  <select
                    className="details-select-status"
                    value={issue.status.id}
                    onChange={e => onUpdateStatus(issue.id, e.target.value)}
                  >
                    {statuses.map(s => (
                      <option key={s.id} value={s.id}>
                        {formatStatusName(s.name)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="control-group">
                  <label className="sidebar-label">Assignee</label>
                  <select
                    className="details-select-status"
                    value={issue.assigned_to?.id || ''}
                    onChange={e => onAssignUser(issue.id, e.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name || (u.firstname && u.lastname ? `${u.firstname} ${u.lastname}` : u.login) || 'User'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="control-group">
                  <label className="sidebar-label">Updated</label>
                  <div className="sidebar-value text-sm">
                    {new Date(issue.updated_on).toLocaleString('en-US', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </div>
                </div>

                <div className="control-group">
                  <label className="sidebar-label">Open in Redmine</label>
                  <div className="redmine-link-info">
                    <KeyIcon />
                    <a
                      href={redmineIssueUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="redmine-external-link"
                    >
                      View in Redmine web interface
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
