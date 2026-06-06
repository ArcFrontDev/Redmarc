import React, { useEffect, useState, useRef, useCallback } from 'react';
import { formatStatusName, getColumnForStatus } from '../utils/statusMapping';
import { api } from '../utils/api';

// Icons
const XIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ExternalIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

const CopyIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const EyeIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

// Textile HTML renderer
function textileToHtml(text) {
  if (!text) return '';

  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  html = html.replace(/^h([1-6])\. (.+)$/gm, (_, level, content) =>
    `<h${level} class="textile-h">${content}</h${level}>`);
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*\n]+?)\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.+?)__/g, '<em>$1</em>');
  html = html.replace(/_([^_\n]+?)_/g, '<em>$1</em>');
  html = html.replace(/@([^@\n]+?)@/g, '<code class="textile-code">$1</code>');
  html = html.replace(/(?<![\w])-([^-\n]+)-(?![\w])/g, '<del>$1</del>');
  html = html.replace(/^\* (.+)$/gm, '<li class="textile-li">$1</li>');
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote class="textile-quote">$1</blockquote>');
  html = html.replace(/"([^"]+)":((https?|ftp):\/\/[^\s]+)/g,
    '<a href="$2" target="_blank" rel="noreferrer" class="textile-link">$1</a>');
  html = html.replace(/(?<!href=")((?:https?|ftp):\/\/[^\s<"]+)/g,
    '<a href="$1" target="_blank" rel="noreferrer" class="textile-link">$1</a>');
  html = html.replace(/\n/g, '<br/>');

  return html;
}

// Smart Journal Detail Formatter
const FIELD_NAME_MAP = {
  status_id:        'Status',
  assigned_to_id:   'Assignee',
  priority_id:      'Priority',
  due_date:         'Due Date',
  start_date:       'Start Date',
  estimated_hours:  'Estimated Hours',
  done_ratio:       'Progress',
  description:      'Description',
  subject:          'Title',
  tracker_id:       'Tracker',
  project_id:       'Project',
  fixed_version_id: 'Version',
  category_id:      'Category',
  parent_id:        'Parent Issue',
  is_private:       'Private',
};

const PRIORITY_NAMES = { 1: 'Low', 2: 'Normal', 3: 'High', 4: 'Urgent', 5: 'Immediate' };

function formatJournalDetail(detail, statuses = [], users = []) {
  const fieldKey = detail.name || detail.property;
  const fieldLabel = FIELD_NAME_MAP[fieldKey] || fieldKey;

  const resolve = (key, value) => {
    if (!value && value !== 0) return 'None';
    if (key === 'status_id') {
      const s = statuses.find(s => String(s.id) === String(value));
      return s ? formatStatusName(s.name) : value;
    }
    if (key === 'assigned_to_id') {
      const u = users.find(u => String(u.id) === String(value));
      if (u) return u.name || (u.firstname && u.lastname ? `${u.firstname} ${u.lastname}` : u.login) || String(value);
      return String(value);
    }
    if (key === 'priority_id') return PRIORITY_NAMES[parseInt(value)] || String(value);
    if (key === 'done_ratio') return `${value}%`;
    if (key === 'is_private') return value === '1' ? 'Yes' : 'No';
    return String(value);
  };

  const oldLabel = resolve(fieldKey, detail.old_value);
  const newLabel = resolve(fieldKey, detail.new_value);

  if (fieldKey === 'description' || fieldKey === 'subject') {
    return `Updated ${fieldLabel}`;
  }
  return `${fieldLabel}: ${oldLabel} → ${newLabel}`;
}

// Attachment helpers
const IMAGE_EXTS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'];
function isImage(filename) {
  const ext = (filename || '').split('.').pop().toLowerCase();
  return IMAGE_EXTS.includes(ext);
}

function formatBytes(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Custom Date Picker component
function SidebarDatePicker({ value, onChange }) {
  const nativeInputRef = useRef(null);

  const handleWrapperClick = (e) => {
    if (e.target.closest('.custom-date-clear-btn')) return;
    try {
      if (nativeInputRef.current) {
        nativeInputRef.current.showPicker();
      }
    } catch (err) {
      console.warn('showPicker failed, fallback to focus:', err);
      nativeInputRef.current?.focus();
    }
  };

  const handleClear = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(null);
  };

  return (
    <div className="custom-date-picker-container" onClick={handleWrapperClick}>
      <div className="custom-date-picker-wrapper">
        <input
          type="text"
          className="details-input custom-date-display-input"
          value={value || ''}
          placeholder="YYYY-MM-DD"
          readOnly
        />
        {value && (
          <button type="button" className="custom-date-clear-btn" onClick={handleClear} title="Clear date">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
        <span className="custom-date-calendar-icon">📅</span>
      </div>
      <input
        ref={nativeInputRef}
        type="date"
        value={value || ''}
        onChange={e => onChange(e.target.value || null)}
        style={{
          position: 'absolute',
          opacity: 0,
          width: 0,
          height: 0,
          pointerEvents: 'none',
          zIndex: -1
        }}
      />
    </div>
  );
}

// Component
const PRIORITIES = [
  { id: 1, label: 'Low' },
  { id: 2, label: 'Normal' },
  { id: 3, label: 'High' },
  { id: 4, label: 'Urgent' },
  { id: 5, label: 'Immediate' },
];

export function IssueDetailPanel({ issue, statuses, users, onClose, onUpdateStatus, onAssignUser, onIssueUpdated, initialFocus, onOpenIssue }) {
  const isOpen = Boolean(issue);
  const [fullIssue, setFullIssue] = useState(null);
  const [loading, setLoading] = useState(false);

  // Inline edit state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleVal, setTitleVal] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descVal, setDescVal] = useState('');

  // Comment state
  const [commentText, setCommentText] = useState('');
  const [commentSaving, setCommentSaving] = useState(false);

  // Project-level data (categories + versions)
  const [categories, setCategories] = useState([]);
  const [versions, setVersions] = useState([]);

  // Watch state
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isWatching, setIsWatching] = useState(false);
  const [watchLoading, setWatchLoading] = useState(false);

  //Copy feedback
  const [copied, setCopied] = useState(false);

  //Subtask inline create
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [subtaskSubject, setSubtaskSubject] = useState('');
  const [subtaskSaving, setSubtaskSaving] = useState(false);
  const subtaskInputRef = useRef(null);

  const titleRef = useRef(null);
  const statusSelectRef = useRef(null);

  // Load current user once
  useEffect(() => {
    api.getCurrentUser().then(res => {
      if (res?.user?.id) setCurrentUserId(res.user.id);
    }).catch(() => {});
  }, []);

  // Esc to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Fetch full issue on open
  useEffect(() => {
    if (!isOpen || !issue) {
      setFullIssue(null);
      setCommentText('');
      setCategories([]);
      setVersions([]);
      return;
    }
    let active = true;
    setLoading(true);

    api.getIssueDetails(issue.id)
      .then(res => {
        if (!active) return;
        const fi = res.issue;
        setFullIssue(fi);
        setTitleVal(fi.subject || '');
        setDescVal(fi.description || '');

        // Determine watch state
        if (currentUserId && fi.watchers) {
          setIsWatching(fi.watchers.some(w => w.id === currentUserId));
        }

        // Fetch project-level data
        const pid = fi.project?.id;
        if (pid) {
          Promise.allSettled([
            api.getProjectCategories(pid),
            api.getProjectVersions(pid),
          ]).then(([catRes, verRes]) => {
            if (!active) return;
            if (catRes.status === 'fulfilled') setCategories(catRes.value?.issue_categories || []);
            if (verRes.status === 'fulfilled') setVersions(verRes.value?.versions || []);
          });
        }
      })
      .catch(console.error)
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [isOpen, issue]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update watch when currentUserId loads after fullIssue
  useEffect(() => {
    if (currentUserId && fullIssue?.watchers) {
      setIsWatching(fullIssue.watchers.some(w => w.id === currentUserId));
    }
  }, [currentUserId, fullIssue]);

  useEffect(() => {
    if (isEditingTitle && titleRef.current) titleRef.current.focus();
  }, [isEditingTitle]);

  //Handle initialFocus from keyboard shortcut
  useEffect(() => {
    if (!initialFocus || !isOpen) return;
    if (initialFocus === 'title') {
      setTimeout(() => setIsEditingTitle(true), 80);
    }
    if (initialFocus === 'status') {
      //Focus and open the status select so user can change it immediately
      setTimeout(() => {
        if (statusSelectRef.current) {
          statusSelectRef.current.focus();
          //Trigger native picker open on supported browsers
          try { statusSelectRef.current.showPicker?.(); } catch (_) {}
        }
      }, 120);
    }
  }, [initialFocus, isOpen]);

  // Inline edit handlers
  const handleSaveTitle = async () => {
    const trimmed = titleVal.trim();
    if (!trimmed || trimmed === fullIssue?.subject) {
      setIsEditingTitle(false);
      setTitleVal(fullIssue?.subject || '');
      return;
    }
    try {
      await api.updateIssue(issue.id, { subject: trimmed });
      setFullIssue(prev => ({ ...prev, subject: trimmed }));
      setIsEditingTitle(false);
      if (onIssueUpdated) onIssueUpdated();
    } catch (err) {
      console.error(err);
      setTitleVal(fullIssue?.subject || '');
      setIsEditingTitle(false);
    }
  };

  const handleSaveDesc = async () => {
    const trimmed = descVal.trim();
    if (trimmed === (fullIssue?.description || '')) {
      setIsEditingDesc(false);
      return;
    }
    try {
      await api.updateIssue(issue.id, { description: trimmed });
      setFullIssue(prev => ({ ...prev, description: trimmed }));
      setIsEditingDesc(false);
      if (onIssueUpdated) onIssueUpdated();
    } catch (err) {
      console.error(err);
      setDescVal(fullIssue?.description || '');
      setIsEditingDesc(false);
    }
  };

  const handleFieldUpdate = useCallback(async (field, value) => {
    try {
      await api.updateIssue(issue.id, { [field]: value });
      setFullIssue(prev => ({ ...prev, [field]: value }));
      if (onIssueUpdated) onIssueUpdated();
    } catch (err) {
      console.error(`Failed to update ${field}:`, err);
    }
  }, [issue, onIssueUpdated]);

  // Comment
  const handleAddComment = async () => {
    const notes = commentText.trim();
    if (!notes) return;
    setCommentSaving(true);
    try {
      await api.addComment(issue.id, notes);
      setCommentText('');
      const res = await api.getIssueDetails(issue.id);
      setFullIssue(res.issue);
      if (onIssueUpdated) onIssueUpdated();
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setCommentSaving(false);
    }
  };

  // Add subtask
  const handleAddSubtask = async () => {
    const subject = subtaskSubject.trim();
    if (!subject) return;
    setSubtaskSaving(true);
    try {
      await api.createIssue({
        project_id: fullIssue?.project?.id || issue?.project?.id,
        subject,
        parent_issue_id: issue.id,
        status_id: statuses[0]?.id,
      });
      setSubtaskSubject('');
      setIsAddingSubtask(false);
      // Reload full issue to refresh children list
      const res = await api.getIssueDetails(issue.id);
      setFullIssue(res.issue);
      if (onIssueUpdated) onIssueUpdated();
    } catch (err) {
      console.error('Failed to create subtask:', err);
    } finally {
      setSubtaskSaving(false);
    }
  };

  // Watch/Unwatch
  const handleToggleWatch = async () => {
    if (!currentUserId || watchLoading) return;
    setWatchLoading(true);
    try {
      if (isWatching) {
        await api.unwatchIssue(issue.id, currentUserId);
        setIsWatching(false);
      } else {
        await api.watchIssue(issue.id, currentUserId);
        setIsWatching(true);
      }
    } catch (err) {
      console.error('Watch toggle failed:', err);
    } finally {
      setWatchLoading(false);
    }
  };

  // Copy link
  const handleCopyLink = () => {
    const url = `${window.location.origin}/issues/${issue.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }).catch(() => {});
  };

  const displayIssue = fullIssue || issue;
  const redmineIssueUrl = issue ? `${window.location.origin}/issues/${issue.id}` : '#';

  return (
    <>
      {isOpen && <div className="issue-detail-drawer-overlay" onClick={onClose} />}

      <div className={`issue-detail-drawer ${isOpen ? 'is-open' : ''}`}>
        {displayIssue && (
          <>
            {/* Header */}
            <div className="drawer-header">
              <div className="drawer-header-meta">
                <span className="details-issue-id">#{displayIssue.id}</span>
                <span className="details-project-tag">{displayIssue.project?.name}</span>
              </div>
              <div className="drawer-header-actions">
                {/* Copy link */}
                <button
                  className="btn btn-icon"
                  onClick={handleCopyLink}
                  title={copied ? 'Copied!' : 'Copy link to issue'}
                  style={copied ? { color: 'var(--color-done)' } : {}}
                >
                  <CopyIcon />
                </button>

                {/* Watch/Unwatch */}
                {currentUserId && (
                  <button
                    className={`btn btn-icon ${isWatching ? 'btn-watching' : ''}`}
                    onClick={handleToggleWatch}
                    disabled={watchLoading}
                    title={isWatching ? 'Unwatch issue' : 'Watch issue'}
                  >
                    {isWatching ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                )}

                {/* Open in Redmine */}
                <a href={redmineIssueUrl} target="_blank" rel="noreferrer" className="btn btn-icon" title="Open in Redmine">
                  <ExternalIcon />
                </a>

                <button className="close-modal-btn" onClick={onClose} title="Close (Esc)">
                  <XIcon />
                </button>
              </div>
            </div>

            <div className="drawer-body">
              {/* Main scrollable content */}
              <div className="drawer-content">

                {/* Title */}
                {isEditingTitle ? (
                  <input
                    ref={titleRef}
                    className="details-title-input"
                    value={titleVal}
                    onChange={e => setTitleVal(e.target.value)}
                    onBlur={handleSaveTitle}
                    onKeyDown={e => e.key === 'Enter' && handleSaveTitle()}
                  />
                ) : (
                  <h2
                    className="details-title editable"
                    onClick={() => setIsEditingTitle(true)}
                    title="Click to edit"
                  >
                    {displayIssue.subject}
                  </h2>
                )}

                {/* Description */}
                <h4 className="section-heading">Description</h4>
                <div className="details-description-wrapper">
                  {isEditingDesc ? (
                    <div className="details-description-edit">
                      <textarea
                        className="details-description-textarea"
                        value={descVal}
                        onChange={e => setDescVal(e.target.value)}
                        rows={7}
                        placeholder="Supports Textile: *bold*, _italic_, @code@, h2. Heading"
                      />
                      <div className="edit-actions mt-2">
                        <button className="btn btn-primary btn-sm" onClick={handleSaveDesc}>Save</button>
                        <button className="btn btn-sm" onClick={() => {
                          setIsEditingDesc(false);
                          setDescVal(displayIssue.description || '');
                        }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="details-description editable textile-body"
                      onClick={() => setIsEditingDesc(true)}
                      title="Click to edit"
                    >
                      {displayIssue.description
                        ? <div dangerouslySetInnerHTML={{ __html: textileToHtml(displayIssue.description) }} />
                        : <span className="no-description">No description. Click to add.</span>
                      }
                    </div>
                  )}
                </div>

                {/* Attachments */}
                {displayIssue.attachments && displayIssue.attachments.length > 0 && (
                  <div className="details-attachments">
                    <h4 className="section-heading" style={{ marginTop: '16px' }}>Attachments</h4>
                    <div className="attachment-grid">
                      {displayIssue.attachments.map(att => (
                        isImage(att.filename) ? (
                          <a
                            key={att.id}
                            href={att.content_url}
                            target="_blank"
                            rel="noreferrer"
                            className="attachment-image-item"
                            title={att.filename}
                          >
                            <img
                              src={att.content_url}
                              alt={att.filename}
                              className="attachment-image-preview"
                              onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
                            />
                            <span className="attachment-image-name">{att.filename}</span>
                          </a>
                        ) : (
                          <a
                            key={att.id}
                            href={att.content_url}
                            target="_blank"
                            rel="noreferrer"
                            className="attachment-file-item"
                          >
                            <span className="attachment-file-icon">📎</span>
                            <span className="attachment-file-info">
                              <span className="attachment-file-name">{att.filename}</span>
                              <span className="attachment-file-size">{formatBytes(att.filesize)}</span>
                            </span>
                          </a>
                        )
                      ))}
                    </div>
                  </div>
                )}

                {/* Activity Journal */}
                <div className="details-activity">
                  <h4 className="section-heading" style={{ marginTop: '24px', marginBottom: '12px' }}>Activity</h4>

                  {loading && !fullIssue ? (
                    <div className="journal-loading">Loading activity...</div>
                  ) : fullIssue?.journals && fullIssue.journals.length > 0 ? (
                    <div className="journal-timeline">
                      {fullIssue.journals.map(journal => (
                        <div key={journal.id} className="journal-entry">
                          <div className="journal-header">
                            <span className="journal-user">{journal.user?.name}</span>
                            <span className="journal-date">
                              {new Date(journal.created_on).toLocaleString('en-US', {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })}
                            </span>
                          </div>
                          {journal.notes && (
                            <div
                              className="journal-notes textile-body"
                              dangerouslySetInnerHTML={{ __html: textileToHtml(journal.notes) }}
                            />
                          )}
                          {journal.details && journal.details.length > 0 && (
                            <ul className="journal-details-list">
                              {journal.details.map((detail, idx) => (
                                <li key={idx}>{formatJournalDetail(detail, statuses, users)}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="journal-empty">No activity yet.</div>
                  )}

                  {/* Add Comment */}
                  <div className="comment-box">
                    <h4 className="section-heading" style={{ marginTop: '20px', marginBottom: '8px' }}>Add Comment</h4>
                    <textarea
                      className="details-description-textarea"
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      rows={3}
                      placeholder="Write a comment... (Textile markup supported)"
                    />
                    <div className="edit-actions mt-2">
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={handleAddComment}
                        disabled={!commentText.trim() || commentSaving}
                      >
                        {commentSaving ? 'Saving...' : 'Add Comment'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right sidebar – fields */}
              <div className="drawer-sidebar">

                {/* Status */}
                <div className="control-group">
                  <label className="sidebar-label">Status</label>
                  <select
                    ref={statusSelectRef}
                    className="details-select"
                    value={displayIssue.status?.id || ''}
                    onChange={e => onUpdateStatus(displayIssue.id, e.target.value)}
                  >
                    {statuses.map(s => (
                      <option key={s.id} value={s.id}>
                        {formatStatusName(s.name)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Assignee */}
                <div className="control-group">
                  <label className="sidebar-label">Assignee</label>
                  <select
                    className="details-select"
                    value={displayIssue.assigned_to?.id || ''}
                    onChange={e => onAssignUser(displayIssue.id, e.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name || (u.firstname && u.lastname ? `${u.firstname} ${u.lastname}` : u.login) || 'User'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
                <div className="control-group">
                  <label className="sidebar-label">Priority</label>
                  <select
                    className="details-select"
                    value={fullIssue?.priority?.id || displayIssue.priority?.id || 2}
                    onChange={e => handleFieldUpdate('priority_id', e.target.value)}
                  >
                    {PRIORITIES.map(p => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                </div>

                {/* Done Ratio */}
                <div className="control-group">
                  <label className="sidebar-label">
                    Progress
                    <span className="sidebar-label-meta">
                      {fullIssue?.done_ratio ?? displayIssue.done_ratio ?? 0}%
                    </span>
                  </label>
                  <div className="progress-bar-wrapper">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${fullIssue?.done_ratio ?? displayIssue.done_ratio ?? 0}%` }}
                    />
                  </div>
                  <input
                    type="range"
                    className="progress-range"
                    min="0"
                    max="100"
                    step="10"
                    value={fullIssue?.done_ratio ?? displayIssue.done_ratio ?? 0}
                    onChange={e => setFullIssue(prev => ({ ...(prev || displayIssue), done_ratio: parseInt(e.target.value) }))}
                    onMouseUp={e => {
                      const val = parseInt(e.target.value);
                      handleFieldUpdate('done_ratio', val);
                      // Auto-status: move to matching column
                      const currentCol = getColumnForStatus(displayIssue.status?.name);
                      let targetCol = null;
                      if (val === 100 && currentCol !== 'done') targetCol = 'done';
                      else if (val >= 1 && val < 100 && currentCol === 'todo') targetCol = 'progress';
                      if (targetCol) {
                        const ts = statuses.find(s => getColumnForStatus(s.name) === targetCol);
                        if (ts) onUpdateStatus(displayIssue.id, ts.id);
                      }
                    }}
                    onTouchEnd={e => handleFieldUpdate('done_ratio', parseInt(e.target.value))}
                  />
                </div>

                {/* Start Date */}
                <div className="control-group">
                  <label className="sidebar-label">Start Date</label>
                  <SidebarDatePicker
                    value={fullIssue?.start_date || displayIssue.start_date || ''}
                    onChange={val => handleFieldUpdate('start_date', val)}
                  />
                </div>

                {/* Due Date */}
                <div className="control-group">
                  <label className="sidebar-label">Due Date</label>
                  <SidebarDatePicker
                    value={fullIssue?.due_date || displayIssue.due_date || ''}
                    onChange={val => handleFieldUpdate('due_date', val)}
                  />
                </div>

                {/* Estimated Hours */}
                <div className="control-group">
                  <label className="sidebar-label">Est. Hours</label>
                  <input
                    type="number"
                    className="details-input"
                    min="0"
                    step="0.5"
                    value={fullIssue?.estimated_hours ?? displayIssue.estimated_hours ?? ''}
                    placeholder="0"
                    onChange={e => setFullIssue(prev => ({ ...(prev || displayIssue), estimated_hours: e.target.value }))}
                    onBlur={e => handleFieldUpdate('estimated_hours', e.target.value || null)}
                  />
                </div>

                {/* Category */}
                {categories.length > 0 && (
                  <div className="control-group">
                    <label className="sidebar-label">Category</label>
                    <select
                      className="details-select"
                      value={fullIssue?.category?.id || ''}
                      onChange={e => handleFieldUpdate('category_id', e.target.value || null)}
                    >
                      <option value="">None</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Version / Milestone */}
                {versions.length > 0 && (
                  <div className="control-group">
                    <label className="sidebar-label">Milestone</label>
                    <select
                      className="details-select"
                      value={fullIssue?.fixed_version?.id || ''}
                      onChange={e => handleFieldUpdate('fixed_version_id', e.target.value || null)}
                    >
                      <option value="">None</option>
                      {versions.filter(v => v.status === 'open').map(v => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Parent Issue */}
                {(fullIssue?.parent || displayIssue.parent) && (
                  <div className="control-group">
                    <label className="sidebar-label">Parent Issue</label>
                    <button
                      className="subtask-parent-link"
                      onClick={() => {
                        const parent = fullIssue?.parent || displayIssue.parent;
                        if (onOpenIssue && parent?.id) onOpenIssue(parent.id);
                      }}
                      title="Navigate to parent issue"
                    >
                      <span className="subtask-parent-id">#{(fullIssue?.parent || displayIssue.parent)?.id}</span>
                      <span className="subtask-parent-subject">{(fullIssue?.parent || displayIssue.parent)?.subject || 'Parent issue'}</span>
                    </button>
                  </div>
                )}

                {/* Subtasks */}
                <div className="control-group subtasks-group">
                  <div className="subtasks-header">
                    <label className="sidebar-label">
                      Subtasks
                      {fullIssue?.children?.length > 0 && (
                        <span className="subtasks-count-badge">{fullIssue.children.filter(c => c.status?.name?.toLowerCase().includes('closed') || c.status?.name?.toLowerCase().includes('done') || c.status?.name?.toLowerCase().includes('resolved')).length}/{fullIssue.children.length}</span>
                      )}
                    </label>
                    <button
                      className="subtask-add-btn"
                      onClick={() => {
                        setIsAddingSubtask(true);
                        setTimeout(() => subtaskInputRef.current?.focus(), 60);
                      }}
                      title="Add subtask"
                    >
                      +
                    </button>
                  </div>

                  {/* Subtask list */}
                  {fullIssue?.children && fullIssue.children.length > 0 && (
                    <div className="subtasks-list">
                      {fullIssue.children.map(child => {
                        const isDoneChild = child.done_ratio === 100
                          || child.status?.name?.toLowerCase().includes('closed')
                          || child.status?.name?.toLowerCase().includes('done')
                          || child.status?.name?.toLowerCase().includes('resolved');
                        return (
                          <button
                            key={child.id}
                            className={`subtask-card ${isDoneChild ? 'is-done' : ''}`}
                            onClick={() => onOpenIssue && onOpenIssue(child.id)}
                            title={`Open #${child.id}`}
                          >
                            <div className="subtask-card-top">
                              <span className="subtask-card-id">#{child.id}</span>
                              {child.status?.name && (
                                <span className="subtask-card-status">{child.status.name}</span>
                              )}
                            </div>
                            <div className={`subtask-card-subject ${isDoneChild ? 'is-done-text' : ''}`}>
                              {child.subject}
                            </div>
                            {child.assigned_to?.name && (
                              <div className="subtask-card-assignee">{child.assigned_to.name}</div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Inline add subtask form */}
                  {isAddingSubtask && (
                    <div className="subtask-inline-form">
                      <input
                        ref={subtaskInputRef}
                        type="text"
                        className="details-input subtask-inline-input"
                        placeholder="Subtask subject..."
                        value={subtaskSubject}
                        onChange={e => setSubtaskSubject(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleAddSubtask();
                          if (e.key === 'Escape') { setIsAddingSubtask(false); setSubtaskSubject(''); }
                        }}
                      />
                      <div className="subtask-inline-actions">
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={handleAddSubtask}
                          disabled={!subtaskSubject.trim() || subtaskSaving}
                        >
                          {subtaskSaving ? '...' : 'Add'}
                        </button>
                        <button
                          className="btn btn-sm"
                          onClick={() => { setIsAddingSubtask(false); setSubtaskSubject(''); }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Empty state */}
                  {(!fullIssue?.children || fullIssue.children.length === 0) && !isAddingSubtask && (
                    <div className="subtasks-empty">No subtasks yet.</div>
                  )}
                </div>

                {/* Updated */}
                <div className="control-group">
                  <label className="sidebar-label">Updated</label>
                  <div className="sidebar-value text-sm">
                    {displayIssue.updated_on && new Date(displayIssue.updated_on).toLocaleString('en-US', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </div>
                </div>

                {/* Created */}
                {displayIssue.created_on && (
                  <div className="control-group">
                    <label className="sidebar-label">Created</label>
                    <div className="sidebar-value text-sm">
                      {new Date(displayIssue.created_on).toLocaleString('en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
