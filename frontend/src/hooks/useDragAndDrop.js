// hooks/useDragAndDrop.js
import { useState, useCallback, useRef } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import { getColumnForStatus } from '../utils/statusMapping';

export function useDragAndDrop({ groupedIssues, statuses, handleUpdateStatus }) {
  const [sortOrder, setSortOrder] = useState(() => {
    try { return JSON.parse(localStorage.getItem('redmarc-sort-order')) || {}; }
    catch { return {}; }
  });

  // Track pending status updates for rollback on API failure
  const pendingRollback = useRef(null);

  const handleUpdateSortOrder = useCallback((newOrder) => {
    setSortOrder(newOrder);
    localStorage.setItem('redmarc-sort-order', JSON.stringify(newOrder));
  }, []);

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    if (!over) return;

    const activeCol = active.data.current?.col;
    const targetCol = over.data.current?.col || over.id;

    if (!activeCol || !targetCol || typeof targetCol !== 'string') return;

    if (activeCol !== targetCol) {
      // Cross-column: status update with optimistic rollback
      const issueId = active.id;
      const allIssues = Object.values(groupedIssues).flat();
      const issue = allIssues.find(i => i.id === issueId);
      if (!issue) return;

      const currentStatusCol = getColumnForStatus(issue.status?.name);
      if (currentStatusCol === targetCol) return;

      const targetStatus = statuses.find(s => getColumnForStatus(s.name) === targetCol);
      if (!targetStatus) return;

      // Optimistic update – fires immediately in UI
      // handleUpdateStatus already sets optimistic state in parent
      const originalStatusId = issue.status?.id;
      const originalStatusName = issue.status?.name;

      // Store rollback data
      pendingRollback.current = {
        issueId,
        originalStatusId,
        originalStatusName,
      };

      // Call with rollback
      handleUpdateStatus(issueId, targetStatus.id, (apiError) => {
        if (apiError && pendingRollback.current?.issueId === issueId) {
          // Rollback – restore original status
          handleUpdateStatus(issueId, originalStatusId);
          pendingRollback.current = null;
        }
      });
    } else {
      // Same-column reorder (localStorage only)
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
