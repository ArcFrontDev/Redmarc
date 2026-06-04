// hooks/useDragAndDrop.js
import { useState, useCallback } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import { getColumnForStatus } from '../utils/statusMapping';

export function useDragAndDrop({ groupedIssues, statuses, handleUpdateStatus }) {
  const [sortOrder, setSortOrder] = useState(() => {
    try { return JSON.parse(localStorage.getItem('redmarc-sort-order')) || {}; }
    catch { return {}; }
  });

  const handleUpdateSortOrder = useCallback((newOrder) => {
    setSortOrder(newOrder);
    localStorage.setItem('redmarc-sort-order', JSON.stringify(newOrder));
  }, []);

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    if (!over) return;

    // activeCol and targetCol are ALWAYS column key strings ('todo', 'progress', 'review', 'done')
    // IssueCard sets data.col = getColumnForStatus(issue.status?.name)
    const activeCol = active.data.current?.col;

    // over.data.current?.col exists when dropped on a sortable item
    // fall back to over.id which is the droppable column id
    const targetCol = over.data.current?.col || over.id;

    if (!activeCol || !targetCol || typeof targetCol !== 'string') return;

    if (activeCol !== targetCol) {
      // Cross-column drag: update status
      // Smart pick: prefer the first status that maps to targetCol
      // but if the issue already has a status mapping to targetCol (edge case), keep it
      const issueId = active.id;
      const issue = Object.values(groupedIssues).flat().find(i => i.id === issueId);
      if (!issue) return;

      // Check if the issue's current status already maps to targetCol (shouldn't happen in cross-col, but safe guard)
      const currentStatusCol = getColumnForStatus(issue.status?.name);
      if (currentStatusCol === targetCol) return;

      // Pick the first status that maps to the target column
      const targetStatus = statuses.find(s => getColumnForStatus(s.name) === targetCol);
      if (targetStatus) {
        handleUpdateStatus(issueId, targetStatus.id);
      }
    } else {
      // Same-column reorder
      if (active.id === over.id) return;

      const colIssues = groupedIssues[activeCol] || [];
      const oldIndex = colIssues.findIndex(i => i.id === active.id);
      const newIndex = colIssues.findIndex(i => i.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(colIssues, oldIndex, newIndex);
        const newOrder = {
          ...sortOrder,
          [activeCol]: reordered.map(i => i.id)
        };
        handleUpdateSortOrder(newOrder);
      }
    }
  }, [groupedIssues, sortOrder, statuses, handleUpdateStatus, handleUpdateSortOrder]);

  return { sortOrder, handleDragEnd };
}
