// src/hooks/useKeyboard.js
import { useEffect } from 'react';

export function useKeyboard({
  onCreateIssue,
  onCreateProject,
  onRefresh,
  onToggleCommandPalette,
  onDeleteActiveProject,
  onCloseAll,
  activeProject,
  projects,
  isAnyModalOpen,
}) {
  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement.tagName;
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      // C — create issue (no modifier)
      if (e.code === 'KeyC' && !isInput && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        onCreateIssue();
        return;
      }
      // P — create project
      if (e.code === 'KeyP' && !isInput && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onCreateProject();
        return;
      }
      // R — refresh
      if (e.code === 'KeyR' && !isInput && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onRefresh();
        return;
      }
      // Ctrl+K — command palette
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyK') {
        e.preventDefault();
        onToggleCommandPalette();
        return;
      }
      // Delete — delete active project
      if (e.code === 'Delete' && !isInput && !e.ctrlKey && !e.metaKey && activeProject !== 'all' && !isAnyModalOpen) {
        e.preventDefault();
        const proj = projects.find(p => String(p.id) === activeProject);
        if (proj) onDeleteActiveProject(proj);
        return;
      }
      // Escape — close everything
      if (e.key === 'Escape') {
        onCloseAll();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCreateIssue, onCreateProject, onRefresh, onToggleCommandPalette, onDeleteActiveProject, onCloseAll, activeProject, projects, isAnyModalOpen]);
}
