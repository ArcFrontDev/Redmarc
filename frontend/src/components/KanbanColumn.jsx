import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { IssueCard } from './IssueCard';

import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

const PlusSmIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export function KanbanColumn({ id, colId, title, dotClass, issues, onIssueClick, onAddIssue, focusedCardId, hideHeader, isCompact }) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { col: colId || id },
  });

  const issueIds = issues.map(issue => issue.id);

  const parentRef = useRef(null);

  const virtualizer = useVirtualizer({
    count: issues.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => isCompact ? 40 : 100,
    overscan: 5,
  });

  return (
    <div className={`kanban-column ${isOver ? 'is-drag-over' : ''}`}>
      {!hideHeader && (
        <div className="column-header">
          <span className={`column-title-dot ${dotClass}`} />
          <span className="column-title">{title}</span>
          <span className="column-count">{issues.length}</span>
        </div>
      )}

      <div
        className="column-cards"
        ref={(el) => {
          parentRef.current = el;
          setNodeRef(el);
        }}
        style={{ overflowY: 'auto' }}
      >
        <SortableContext items={issueIds} strategy={verticalListSortingStrategy}>
          {issues.length === 0 ? (
            <div className="column-empty-state">No issues</div>
          ) : (
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const issue = issues[virtualRow.index];
                return (
                  <div
                    key={issue.id}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <IssueCard
                      issue={issue}
                      onClick={() => onIssueClick(issue)}
                      isFocused={focusedCardId === issue.id}
                      isCompact={isCompact}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </SortableContext>
      </div>

      {!isCompact && (
        <button className="column-add-btn" onClick={onAddIssue}>
          <PlusSmIcon /> Add issue
        </button>
      )}
    </div>
  );
}
