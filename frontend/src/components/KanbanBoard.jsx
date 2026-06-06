/* eslint-disable react-refresh/only-export-components */
import { useState } from 'react';
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

export function KanbanBoard({ groupedIssues, onIssueClick, onAddIssue, onDragEnd, focusedCardId, isSwimlaneView }) {
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
      <div className={`kanban-board ${isSwimlaneView ? 'swimlane-mode' : ''}`}>
        {isSwimlaneView ? (
          <div className="swimlane-wrapper">
            <div className="swimlane-global-header">
              <div className="swimlane-header-placeholder"></div>
              <div className="swimlane-header-columns">
                {KANBAN_COLUMNS.map(col => (
                  <div key={col.id} className="swimlane-global-col-header">
                    <span className={`column-title-dot ${col.dotClass}`} />
                    <span className="column-title">{col.title}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {(() => {
              const allIssues = Object.values(groupedIssues).flat();
            const parents = {};
            const ungrouped = { title: 'Other Tasks', issues: { todo: [], progress: [], review: [], done: [] } };

            allIssues.forEach(issue => {
              const parent = issue.parent;
              // determine column based on original groupedIssues arrays
              const colId = Object.keys(groupedIssues).find(col => groupedIssues[col].find(i => i.id === issue.id)) || 'todo';

              if (parent && parent.id) {
                if (!parents[parent.id]) {
                  parents[parent.id] = {
                    title: `#${parent.id} ${parent.subject || 'Task'}`,
                    issues: { todo: [], progress: [], review: [], done: [] }
                  };
                }
                parents[parent.id].issues[colId].push(issue);
              } else {
                ungrouped.issues[colId].push(issue);
              }
            });

            const swimlanes = [...Object.values(parents), ungrouped].filter(sl => 
              Object.values(sl.issues).some(list => list.length > 0)
            );

            if (swimlanes.length === 0) {
              swimlanes.push(ungrouped);
            }

            return swimlanes.map((swimlane, idx) => (
              <div key={idx} className="swimlane-container">
                <div className="swimlane-header">
                  <h3>{swimlane.title}</h3>
                </div>
                <div className="swimlane-columns">
                  {KANBAN_COLUMNS.map(col => (
                    <KanbanColumn
                      key={`${col.id}-${idx}`}
                      id={`${col.id}-${idx}`}
                      colId={col.id}
                      title={col.title}
                      dotClass={col.dotClass}
                      issues={swimlane.issues[col.id] || []}
                      onIssueClick={onIssueClick}
                      onAddIssue={() => onAddIssue(col.id)}
                      focusedCardId={focusedCardId}
                      hideHeader={true}
                      isCompact={true}
                    />
                  ))}
                </div>
              </div>
            ));
          })()}
          </div>
        ) : (
          KANBAN_COLUMNS.map(col => (
            <KanbanColumn
              key={col.id}
              id={col.id}
              colId={col.id}
              title={col.title}
              dotClass={col.dotClass}
              issues={groupedIssues[col.id] || []}
              onIssueClick={onIssueClick}
              onAddIssue={() => onAddIssue(col.id)}
              focusedCardId={focusedCardId}
            />
          ))
        )}
      </div>

      <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
        {activeId && activeIssue ? (
          <IssueCard issue={activeIssue} onClick={() => {}} isOverlay={true} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
