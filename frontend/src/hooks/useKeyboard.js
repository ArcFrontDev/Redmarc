// src/hooks/useKeyboard.js
import { useEffect } from 'react';

export function useKeyboard({
  onCreateIssue,
  onCreateProject,
  onRefresh,
  onToggleCommandPalette,
  onDeleteActiveProject,
  onCloseAll,
  onKanbanView,
  onListView,
  onFocusSearch,
  onOpenHotkeys,
  activeProject,
  projects,
  isAnyModalOpen,
}) {
  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement.tagName;
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      // Ctrl+K — command palette (works even in inputs to stay consistent)
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyK') {
        e.preventDefault();
        onToggleCommandPalette();
        return;
      }

      // Escape — close everything
      if (e.key === 'Escape') {
        onCloseAll();
        return;
      }

      // Remaining shortcuts only fire when not typing in an input
      if (isInput) return;

      // C — create issue
      if (e.code === 'KeyC' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        onCreateIssue();
        return;
      }

      // P — create project
      if (e.code === 'KeyP' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onCreateProject();
        return;
      }

      // R — refresh
      if (e.code === 'KeyR' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onRefresh();
        return;
      }

      // K — kanban view
      if (e.code === 'KeyK' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onKanbanView?.();
        return;
      }

      // L — list view
      if (e.code === 'KeyL' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onListView?.();
        return;
      }

      // F — focus search
      if (e.code === 'KeyF' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onFocusSearch?.();
        return;
      }

      // ? — open hotkeys modal
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onOpenHotkeys?.();
        return;
      }

      // Delete — delete active project
      if (
        e.code === 'Delete' &&
        !e.ctrlKey && !e.metaKey &&
        activeProject !== 'all' &&
        !isAnyModalOpen
      ) {
        e.preventDefault();
        const proj = projects.find(p => String(p.id) === activeProject);
        if (proj) onDeleteActiveProject(proj);
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [
    onCreateIssue, onCreateProject, onRefresh, onToggleCommandPalette,
    onDeleteActiveProject, onCloseAll, onKanbanView, onListView,
    onFocusSearch, onOpenHotkeys,
    activeProject, projects, isAnyModalOpen,
  ]);
}
