import React from 'react';
import { getPriorityConfig, getColumnForStatus } from '../utils/statusMapping';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export function IssueCard({ issue, onClick, isOverlay }) {
  const priority = getPriorityConfig(issue.priority?.id || 2);
  const assigneeName = issue.assigned_to?.name || null;
  const assigneeInitial = assigneeName ? assigneeName.charAt(0).toUpperCase() : null;

  // FIX: col must be a column key string ('todo', 'progress', 'review', 'done')
  // NOT status.id (a number)
  const colKey = getColumnForStatus(issue.status?.name);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: issue.id,
    data: { issue, col: colKey },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const overlayStyle = isOverlay ? {
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
    transform: 'rotate(1.5deg) scale(1.02)',
    cursor: 'grabbing',
    zIndex: 9999,
  } : {};

  const isFinished = ['done', 'review'].includes(colKey) &&
    (issue.status?.name?.toLowerCase().includes('clos') ||
     issue.status?.name?.toLowerCase().includes('reject') ||
     issue.status?.name?.toLowerCase() === 'закрыта');

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, ...overlayStyle }}
      className={`issue-card ${isFinished ? 'finished-task' : ''} ${isOverlay ? 'is-overlay' : ''}`}
      onClick={onClick}
      {...attributes}
      {...listeners}
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

      {/* Quick actions on hover */}
      <div className="card-quick-actions">
        <button
          className="card-quick-btn"
          onClick={e => { e.stopPropagation(); onClick(); }}
          title="Open issue"
          onPointerDown={e => e.stopPropagation()}
        >
          ···
        </button>
      </div>
    </div>
  );
}
