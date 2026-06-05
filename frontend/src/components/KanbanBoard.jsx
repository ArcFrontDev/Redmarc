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

const COLUMNS = [
  { id: 'todo',     title: 'Backlog / New', dotClass: 'todo-dot' },
  { id: 'progress', title: 'In Progress',   dotClass: 'progress-dot' },
  { id: 'review',   title: 'Review / Test', dotClass: 'review-dot' },
  { id: 'done',     title: 'Done',          dotClass: 'done-dot' },
];

export function KanbanBoard({ groupedIssues, onIssueClick, onAddIssue, onDragEnd }) {
  const [activeId, setActiveId] = useState(null);
  const [activeIssue, setActiveIssue] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // px before drag starts — prevents accidental drags on click
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,      // ms hold before drag starts on touch
        tolerance: 6,    // px movement tolerance during hold
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event) => {
    const { active } = event;
    setActiveId(active.id);
    setActiveIssue(active.data.current?.issue || null);
  };

  const handleDragEnd = (event) => {
    setActiveId(null);
    setActiveIssue(null);
    if (onDragEnd) onDragEnd(event);
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setActiveIssue(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="kanban-board">
        {COLUMNS.map(col => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            title={col.title}
            dotClass={col.dotClass}
            issues={groupedIssues[col.id] || []}
            onIssueClick={onIssueClick}
            onAddIssue={() => onAddIssue(col.id)}
            activeId={activeId}
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
