// src/utils/statusMapping.js

// Maps Redmine status names to kanban column types.
// Supports English and Russian Redmine installations out of the box.
// Falls back to the raw name for unknown statuses.

const STATUS_COLUMN_MAP = {
  // TODO / Backlog column
  todo: [
    'new', 'open', 'created', 'backlog', 'to do', 'todo',
    'новая', 'открыта', 'новый', 'к выполнению',
  ],
  // IN PROGRESS column
  progress: [
    'in progress', 'in-progress', 'active', 'working', 'started', 'ongoing', 'wip',
    'в работе', 'в процессе', 'активна',
  ],
  // REVIEW / TEST column
  review: [
    'feedback', 'review', 'in review', 'testing', 'in testing', 'resolved',
    'qa', 'verification', 'need feedback', 'needs feedback',
    'нужен отклик', 'обратная связь', 'решена', 'на проверке', 'тестирование',
  ],
  // DONE column
  done: [
    'closed', 'done', 'completed', 'finished', 'rejected', 'canceled', 'cancelled',
    'закрыта', 'завершена', 'отклонена', 'выполнена',
  ],
};

// English display names for known Russian status names
const STATUS_DISPLAY_MAP = {
  'новая': 'New',
  'в работе': 'In Progress',
  'решена': 'Resolved',
  'нужен отклик': 'Feedback',
  'обратная связь': 'Feedback',
  'закрыта': 'Closed',
  'отклонена': 'Rejected',
  'открыта': 'Open',
  'на проверке': 'In Review',
  'тестирование': 'Testing',
};

/**
 * Returns the kanban column type for a given Redmine status name.
 * Returns 'todo' as default for unknown statuses.
 *
 * @param {string} statusName - The status name from the Redmine API
 * @returns {'todo'|'progress'|'review'|'done'}
 */
export function getColumnForStatus(statusName) {
  if (!statusName) return 'todo';
  const lower = statusName.toLowerCase().trim();
  for (const [column, names] of Object.entries(STATUS_COLUMN_MAP)) {
    if (names.some(n => lower === n || lower.includes(n))) {
      return column;
    }
  }
  return 'todo'; // default unknown statuses to backlog
}

/**
 * Returns a clean English display name for a status.
 * Returns the original name unchanged if no translation is found.
 *
 * @param {string} statusName
 * @returns {string}
 */
export function formatStatusName(statusName) {
  if (!statusName) return '';
  return STATUS_DISPLAY_MAP[statusName.toLowerCase().trim()] || statusName;
}

/**
 * Groups a flat list of issues into kanban columns.
 *
 * @param {Array} issues - flat array of Redmine issue objects
 * @returns {{ todo: Array, progress: Array, review: Array, done: Array }}
 */
export function groupIssuesByColumn(issues, sortOrder = {}) {
  const columns = { todo: [], progress: [], review: [], done: [] };
  for (const issue of issues) {
    const col = getColumnForStatus(issue.status?.name);
    columns[col].push(issue);
  }
  
  // Sort each column according to sortOrder if provided
  for (const col of Object.keys(columns)) {
    const order = sortOrder[col] || [];
    if (order.length > 0) {
      columns[col].sort((a, b) => {
        const indexA = order.indexOf(a.id);
        const indexB = order.indexOf(b.id);
        if (indexA === -1 && indexB === -1) return 0;
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });
    }
  }
  return columns;
}

export const PRIORITY_CONFIG = {
  1: { label: 'Low',       color: '#64748b', cssClass: 'priority-low' },
  2: { label: 'Normal',    color: '#3b82f6', cssClass: 'priority-normal' },
  3: { label: 'High',      color: '#f59e0b', cssClass: 'priority-high' },
  4: { label: 'Urgent',    color: '#ef4444', cssClass: 'priority-urgent' },
  5: { label: 'Immediate', color: '#dc2626', cssClass: 'priority-immediate' },
};

/**
 * Returns the priority display config for a given Redmine priority ID.
 * Falls back to Normal (2) for unknown IDs.
 *
 * @param {number|string} priorityId
 * @returns {{ label: string, color: string, cssClass: string }}
 */
export function getPriorityConfig(priorityId) {
  return PRIORITY_CONFIG[parseInt(priorityId)] || PRIORITY_CONFIG[2];
}
