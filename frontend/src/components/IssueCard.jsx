import { getColumnForStatus } from '../utils/statusMapping';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Priority color map (left strip + badge)
const PRIORITY_COLORS = {
  1: '#6b7280', // Low     – grey
  2: '#4d8fbd', // Normal  – slate-blue
  3: '#d49a3a', // High    – amber
  4: '#d95555', // Urgent  – red
  5: '#b52a2a', // Immediate – deep red
};

// Status column dot colors – clearly distinct from each other
const STATUS_DOT_COLORS = {
  todo:     '#6b8fb5', // slate blue
  progress: '#c49040', // amber-gold
  review:   '#d07040', // warm orange – clearly different from todo blue
  done:     '#3daa74', // teal-green
};

const PRIORITY_LABELS = {
  1: 'Low', 2: 'Normal', 3: 'High', 4: 'Urgent', 5: 'Immediate',
};

const AlertIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const MoreHorizontalIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
  </svg>
);

export function IssueCard({ issue, onClick, isOverlay, isFocused, isCompact }) {
  const priorityId = issue.priority?.id || 2;
  const priorityColor = PRIORITY_COLORS[priorityId] || PRIORITY_COLORS[2];
  const priorityLabel = PRIORITY_LABELS[priorityId] || 'Normal';

  const assigneeName = issue.assigned_to?.name || null;
  const assigneeInitial = assigneeName ? assigneeName.charAt(0).toUpperCase() : null;

  const colKey = getColumnForStatus(issue.status?.name);
  const statusDotColor = STATUS_DOT_COLORS[colKey] || STATUS_DOT_COLORS.todo;
  const isDone = colKey === 'done';
  const doneRatio = issue.done_ratio ?? 0;

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
    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.32)',
    transform: 'rotate(1.5deg) scale(1.03)',
    cursor: 'grabbing',
    zIndex: 9999,
  } : {};

  // Hue-based assignee avatar color
  const avatarHue = assigneeName
    ? (Array.from(assigneeName).reduce((acc, c) => acc + c.charCodeAt(0), 0) * 37) % 360
    : 0;

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, ...overlayStyle }}
      className={[
        'issue-card',
        isDone ? 'is-done' : '',
        isOverlay ? 'is-overlay' : '',
        isDragging ? 'is-dragging' : '',
        isFocused ? 'is-focused-card' : '',
      ].filter(Boolean).join(' ')}
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      {isCompact ? (
        <div className="card-compact-layout">
          <div
            className="card-priority-strip"
            style={{ backgroundColor: priorityColor, position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', borderRadius: '4px 0 0 4px' }}
            title={`Priority: ${priorityLabel}`}
          />
          <div className="card-compact-content" style={{ display: 'flex', alignItems: 'center', width: '100%', paddingLeft: '8px', paddingRight: '28px' }}>
            <span
              className="card-status-dot"
              style={{ backgroundColor: statusDotColor, marginRight: '8px', flexShrink: 0 }}
              title={issue.status?.name || 'Unknown'}
            />
            <span className="card-issue-id" style={{ marginRight: '8px', flexShrink: 0 }}>#{issue.id}</span>
            <span className={`card-title ${isDone ? 'card-title-done' : ''}`} style={{ flex: 1, fontSize: '13px', margin: 0, paddingRight: '8px', wordBreak: 'break-word', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {issue.subject}
            </span>
            {assigneeInitial && (
              <span
                className="card-assignee-avatar"
                style={{ backgroundColor: `hsl(${avatarHue}, 45%, 42%)`, width: '20px', height: '20px', fontSize: '10px', flexShrink: 0 }}
                title={assigneeName}
              >
                {assigneeInitial}
              </span>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Left priority strip */}
          <div
            className="card-priority-strip"
            style={{ backgroundColor: priorityColor }}
            title={`Priority: ${priorityLabel}`}
          />

          <div className="card-body">
            {/* Top row: project tag + status dot + priority badge */}
            <div className="card-top-row">
              <div className="card-project-tag">{issue.project.name}</div>
              <div className="card-status-indicators">
                <span
                  className="card-status-dot"
                  style={{ backgroundColor: statusDotColor }}
                  title={issue.status?.name || 'Unknown'}
                />
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
            <div className={`card-title ${isDone ? 'card-title-done' : ''}`}>
              {issue.subject}
            </div>

            {/* Due date overdue warning */}
            {issue.due_date && new Date(issue.due_date) < new Date() && !isDone && (
              <div className="card-due-overdue" title={`Due: ${issue.due_date}`} style={{ display: 'flex', alignItems: 'center' }}>
                <AlertIcon /> {issue.due_date}
              </div>
            )}

            {/* Progress bar at bottom of body */}
            {doneRatio > 0 && !isDone && (
              <div className="card-progress-bar-wrapper" title={`Progress: ${doneRatio}%`}>
                <div className="card-progress-bar-fill" style={{ width: `${doneRatio}%` }} />
              </div>
            )}

            {/* Footer: ID + subtask counter + assignee */}
            <div className="card-footer">
              <span className="card-issue-id">#{issue.id}</span>
              {issue.children && issue.children.length > 0 && (() => {
                const total = issue.children.length;
                const done = issue.children.filter(c =>
                  c.status?.name?.toLowerCase().includes('closed') ||
                  c.status?.name?.toLowerCase().includes('done') ||
                  c.status?.name?.toLowerCase().includes('resolved')
                ).length;
                return (
                  <span className="card-subtask-counter" title={`Subtasks: ${done}/${total} done`}>
                    ↳ {done}/{total}
                  </span>
                );
              })()}
              <div className="card-assignee">
                {assigneeInitial ? (
                  <>
                    <span
                      className="card-assignee-avatar"
                      style={{ backgroundColor: `hsl(${avatarHue}, 45%, 42%)` }}
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
        </>
      )}

      {/* Quick actions on hover */}
      <div className="card-quick-actions">
        <button
          className="card-quick-btn"
          onClick={e => { e.stopPropagation(); onClick(); }}
          title="Open issue"
          onPointerDown={e => e.stopPropagation()}
        >
          <MoreHorizontalIcon />
        </button>
      </div>
    </div>
  );
}
