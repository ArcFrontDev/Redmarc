import React from 'react';
import { getPriorityConfig, getColumnForStatus } from '../utils/statusMapping';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Priority color map
const PRIORITY_COLORS = {
  1: '#6b7280', // Low     — grey
  2: '#3b82f6', // Normal  — blue
  3: '#f59e0b', // High    — amber
  4: '#ef4444', // Urgent  — red
  5: '#dc2626', // Immediate — deep red
};

// Status column dot colors
const STATUS_DOT_COLORS = {
  todo:     '#6b7280', // grey
  progress: '#f59e0b', // amber
  review:   '#a78bfa', // purple
  done:     '#22c55e', // green
};

const PRIORITY_LABELS = {
  1: 'Low', 2: 'Normal', 3: 'High', 4: 'Urgent', 5: 'Immediate',
};

export function IssueCard({ issue, onClick, isOverlay }) {
  const priority = getPriorityConfig(issue.priority?.id || 2);
  const priorityId = issue.priority?.id || 2;
  const priorityColor = PRIORITY_COLORS[priorityId] || PRIORITY_COLORS[2];
  const priorityLabel = PRIORITY_LABELS[priorityId] || 'Normal';

  const assigneeName = issue.assigned_to?.name || null;
  const assigneeInitial = assigneeName ? assigneeName.charAt(0).toUpperCase() : null;

  const colKey = getColumnForStatus(issue.status?.name);
  const statusDotColor = STATUS_DOT_COLORS[colKey] || STATUS_DOT_COLORS.todo;

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
    opacity: isDragging ? 0.3 : 1,
  };

  const overlayStyle = isOverlay ? {
    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.28)',
    transform: 'rotate(1.5deg) scale(1.03)',
    cursor: 'grabbing',
    zIndex: 9999,
  } : {};

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, ...overlayStyle }}
      className={`issue-card ${isOverlay ? 'is-overlay' : ''} ${isDragging ? 'is-dragging' : ''}`}
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      {/* Left priority strip */}
      <div
        className="card-priority-strip"
        style={{ backgroundColor: priorityColor }}
        title={`Priority: ${priorityLabel}`}
      />

      <div className="card-body">
        {/* Top row: project tag + status dot */}
        <div className="card-top-row">
          <div className="card-project-tag">{issue.project.name}</div>
          <div className="card-status-indicators">
            {/* Status dot */}
            <span
              className="card-status-dot"
              style={{ backgroundColor: statusDotColor }}
              title={issue.status?.name || 'Unknown'}
            />
            {/* Priority badge */}
            <span
              className="card-priority-badge"
              style={{ color: priorityColor, borderColor: `${priorityColor}44` }}
              title={`Priority: ${priorityLabel}`}
            >
              {priorityLabel}
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="card-title">{issue.subject}</div>

        {/* Due date warning if overdue */}
        {issue.due_date && new Date(issue.due_date) < new Date() && colKey !== 'done' && (
          <div className="card-due-overdue" title={`Due: ${issue.due_date}`}>
            ⚠ {issue.due_date}
          </div>
        )}

        {/* Footer: ID + assignee */}
        <div className="card-footer">
          <span className="card-issue-id">#{issue.id}</span>
          <div className="card-assignee">
            {assigneeInitial ? (
              <>
                <span
                  className="card-assignee-avatar"
                  style={{ backgroundColor: `hsl(${(assigneeName.charCodeAt(0) * 37) % 360}, 50%, 45%)` }}
                >
                  {assigneeInitial}
                </span>
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
