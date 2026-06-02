import React from 'react';
import { KanbanColumn } from './KanbanColumn';

const COLUMNS = [
  { id: 'todo',     title: 'Backlog / New', dotClass: 'todo-dot' },
  { id: 'progress', title: 'In Progress',   dotClass: 'progress-dot' },
  { id: 'review',   title: 'Review / Test', dotClass: 'review-dot' },
  { id: 'done',     title: 'Done',          dotClass: 'done-dot' },
];

export function KanbanBoard({ groupedIssues, onIssueClick, onAddIssue }) {
  return (
    <div className="kanban-board">
      {COLUMNS.map(col => (
        <KanbanColumn
          key={col.id}
          title={col.title}
          dotClass={col.dotClass}
          issues={groupedIssues[col.id] || []}
          onIssueClick={onIssueClick}
          onAddIssue={onAddIssue}
        />
      ))}
    </div>
  );
}
