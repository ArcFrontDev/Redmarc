import React from 'react';
import { getPriorityConfig } from '../utils/statusMapping';

export function IssueCard({ issue, onClick }) {
  const priority = getPriorityConfig(issue.priority?.id || 2);
  const assigneeName = issue.assigned_to?.name || null;
  const assigneeInitial = assigneeName ? assigneeName.charAt(0).toUpperCase() : null;

  return (
    <div
      className={`issue-card ${issue.status?.name?.toLowerCase().includes('clos') || issue.status?.name?.toLowerCase().includes('done') || issue.status?.name?.toLowerCase().includes('reject') || issue.status?.name?.toLowerCase() === 'закрыта' ? 'finished-task' : ''}`}
      onClick={onClick}
    >
      {/* Priority strip — left color bar */}
      <div className={`card-priority-strip ${priority.cssClass}`} />

      <div className="card-body">
        {/* Project tag */}
        <div className="card-project-tag">{issue.project.name}</div>

        {/* Title */}
        <div className="card-title">{issue.subject}</div>

        {/* Footer: ID + assignee */}
        <div className="card-footer">
          <span className="card-issue-id">#{issue.id}</span>
          <div className="card-assignee">
            {assigneeInitial ? (
              <>
                <span className="card-assignee-avatar">{assigneeInitial}</span>
                <span className="card-assignee-name">{assigneeName}</span>
              </>
            ) : (
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Unassigned</span>
            )}
          </div>
        </div>
      </div>

      {/* Quick actions (visible on hover via CSS) */}
      <div className="card-quick-actions">
        <button
          className="card-quick-btn"
          onClick={e => { e.stopPropagation(); onClick(); }}
          title="Open issue"
        >
          ···
        </button>
      </div>
    </div>
  );
}
