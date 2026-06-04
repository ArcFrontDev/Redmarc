import React, { useEffect, useState, useRef, useCallback } from 'react';
import { formatStatusName } from '../utils/statusMapping';
import { api } from '../utils/api';

// ─── Icons ────────────────────────────────────────────────────────────────────
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

// ─── Textile → HTML renderer ─────────────────────────────────────────────────
// Covers the most common Redmine Textile markup without a heavy library.
function textileToHtml(text) {
  if (!text) return '';

  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Headings: h1. h2. h3.
  html = html.replace(/^h([1-6])\. (.+)$/gm, (_, level, content) =>
    `<h${level} class="textile-h">${content}</h${level}>`);

  // Bold: **text** or *text*
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*\n]+?)\*/g, '<strong>$1</strong>');

  // Italic: __text__ or _text_
  html = html.replace(/__(.+?)__/g, '<em>$1</em>');
  html = html.replace(/_([^_\n]+?)_/g, '<em>$1</em>');

  // Monospace/code: @text@
  html = html.replace(/@([^@\n]+?)@/g, '<code class="textile-code">$1</code>');

  // Strikethrough: -text-
  html = html.replace(/(?<![\\w])-([^-\n]+)-(?![\\w])/g, '<del>$1</del>');

  // Unordered list
  html = html.replace(/^\* (.+)$/gm, '<li class="textile-li">$1</li>');

  // Blockquote: > text
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote class="textile-quote">$1</blockquote>');

  // Links: "text":url
  html = html.replace(/"([^"]+)":((https?|ftp):\/\/[^\s]+)/g,
    '<a href="$2" target="_blank" rel="noreferrer" class="textile-link">$1</a>');

  // Bare URLs
  html = html.replace(/(?<!href=")((?:https?|ftp):\/\/[^\s<"]+)/g,
    '<a href="$1" target="_blank" rel="noreferrer" class="textile-link">$1</a>');

  // Newlines to <br>
  html = html.replace(/\n/g, '<br/>');

  return html;
}

// ─── Smart Journal Detail Formatter ──────────────────────────────────────────
const FIELD_NAME_MAP = {
  status_id:        'Status',
  assigned_to_id:   'Assignee',
  priority_id:      'Priority',
  due_date:         'Due Date',
  estimated_hours:  'Estimated Hours',
  done_ratio:       'Progress',
  description:      'Description',
  subject:          'Title',
  tracker_id:       'Tracker',
  project_id:       'Project',
  fixed_version_id: 'Version',
  category_id:      'Category',
  start_date:       'Start Date',
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

  return `Changed ${fieldLabel}: ${oldLabel} → ${newLabel}`;
}

// ─── Component ────────────────────────────────────────────────────────────────
const PRIORITIES = [
  { id: 1, label: 'Low' },
  { id: 2, label: 'Normal' },
  { id: 3, label: 'High' },
  { id: 4, label: 'Urgent' },
  { id: 5, label: 'Immediate' },
];

export function IssueDetailPanel({ issue, statuses, users, onClose, onUpdateStatus, onAssignUser, onIssueUpdated }) {
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

  const titleRef = useRef(null);

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
      return;
    }
    let active = true;
    setLoading(true);
    api.getIssueDetails(issue.id)
      .then(res => {
        if (active) {
          setFullIssue(res.issue);
          setTitleVal(res.issue.subject || '');
          setDescVal(res.issue.description || '');
        }
      })
      .catch(console.error)
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [isOpen, issue]);

  useEffect(() => {
    if (isEditingTitle && titleRef.current) titleRef.current.focus();
  }, [isEditingTitle]);

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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                    <ul className="attachment-list">
                      {displayIssue.attachments.map(att => (
                        <li key={att.id}>
                          <a href={att.content_url} target="_blank" rel="noreferrer" className="attachment-link">
                            {att.filename}
                          </a>
                          <span className="attachment-size">({Math.round(att.filesize / 1024)} KB)</span>
                        </li>
                      ))}
                    </ul>
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

              {/* Right sidebar — fields */}
              <div className="drawer-sidebar">
                <div className="control-group">
                  <label className="sidebar-label">Status</label>
                  <select
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

                <div className="control-group">
                  <label className="sidebar-label">Due Date</label>
                  <input
                    type="date"
                    className="details-input"
                    value={fullIssue?.due_date || displayIssue.due_date || ''}
                    onChange={e => handleFieldUpdate('due_date', e.target.value || null)}
                  />
                </div>

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

                <div className="control-group">
                  <label className="sidebar-label">Updated</label>
                  <div className="sidebar-value text-sm">
                    {displayIssue.updated_on && new Date(displayIssue.updated_on).toLocaleString('en-US', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
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
