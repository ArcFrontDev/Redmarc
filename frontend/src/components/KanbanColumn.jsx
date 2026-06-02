import React from 'react';
import { IssueCard } from './IssueCard';

const PlusSmIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export function KanbanColumn({ title, dotClass, issues, onIssueClick, onAddIssue }) {
  return (
    <div className="kanban-column">
      <div className="column-header">
        <span className={`column-title-dot ${dotClass}`} />
        <span className="column-title">{title}</span>
        <span className="column-count">{issues.length}</span>
      </div>

      <div className="column-cards">
        {issues.length === 0 ? (
          <div className="column-empty-state">No issues</div>
        ) : (
          issues.map(issue => (
            <IssueCard
              key={issue.id}
              issue={issue}
              onClick={() => onIssueClick(issue)}
            />
          ))
        )}
      </div>

      <button className="column-add-btn" onClick={onAddIssue}>
        <PlusSmIcon /> Add issue
      </button>
    </div>
  );
}
