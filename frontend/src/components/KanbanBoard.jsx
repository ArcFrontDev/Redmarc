import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';
import { IssueCard } from './IssueCard';

export const KANBAN_COLUMNS = [
  { id: 'todo',     title: 'Backlog / New', dotClass: 'todo-dot' },
  { id: 'progress', title: 'In Progress',   dotClass: 'progress-dot' },
  { id: 'review',   title: 'Review / Test', dotClass: 'review-dot' },
  { id: 'done',     title: 'Done',          dotClass: 'done-dot' },
];

export function KanbanBoard({ groupedIssues, onIssueClick, onAddIssue, onDragEnd, focusedCardId }) {
  const [activeId, setActiveId] = useState(null);
  const [activeIssue, setActiveIssue] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
    setActiveIssue(event.active.data.current?.issue || null);
  };

  const handleDragEnd = (event) => {
    setActiveId(null);
    setActiveIssue(null);
    if (onDragEnd) onDragEnd(event);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => { setActiveId(null); setActiveIssue(null); }}
    >
      <div className="kanban-board">
        {KANBAN_COLUMNS.map(col => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            title={col.title}
            dotClass={col.dotClass}
            issues={groupedIssues[col.id] || []}
            onIssueClick={onIssueClick}
            onAddIssue={() => onAddIssue(col.id)}
            focusedCardId={focusedCardId}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
        {activeId && activeIssue ? (
          <IssueCard issue={activeIssue} onClick={() => {}} isOverlay={true} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
