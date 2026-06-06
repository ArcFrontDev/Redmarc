//src/hooks/useKeyboard.js
import { useEffect, useCallback } from 'react';

const COL_ORDER = ['todo', 'progress', 'review', 'done'];

export function useKeyboard({
  onCreateIssue,
  onCreateProject,
  onRefresh,
  onToggleCommandPalette,
  onDeleteActiveProject,
  onCloseAll,
  onToggleView,
  onFocusSearch,
  onOpenHotkeys,
  activeProject,
  projects,
  isAnyModalOpen,
  //Card navigation
  groupedIssues,
  focusedCard,
  setFocusedCard,
  onOpenFocusedCard,
  onQuickAssign,
  onQuickStatus,
  onQuickEdit,
  onMoveCardToColumn,
}) {
  const navigate = useCallback((direction) => {
    if (!groupedIssues) return;

    if (!focusedCard) {
      //No focus yet – land on first card in first non-empty column
      for (const col of COL_ORDER) {
        const cards = groupedIssues[col] || [];
        if (cards.length > 0) {
          setFocusedCard({ colKey: col, issueId: cards[0].id });
          return;
        }
      }
      return;
    }

    const { colKey, issueId } = focusedCard;
    const cards = groupedIssues[colKey] || [];
    const idx = cards.findIndex(i => i.id === issueId);
    const safeIdx = idx === -1 ? 0 : idx;

    if (direction === 'down') {
      const nextIdx = Math.min(safeIdx + 1, cards.length - 1);
      setFocusedCard({ colKey, issueId: cards[nextIdx].id });
    } else if (direction === 'up') {
      const prevIdx = Math.max(safeIdx - 1, 0);
      setFocusedCard({ colKey, issueId: cards[prevIdx].id });
    } else if (direction === 'right' || direction === 'left') {
      const colIdx = COL_ORDER.indexOf(colKey);
      const delta = direction === 'right' ? 1 : -1;

      //Find next column with cards
      for (let step = 1; step < COL_ORDER.length; step++) {
        const newColIdx = colIdx + delta * step;
        if (newColIdx < 0 || newColIdx >= COL_ORDER.length) break;
        const newCol = COL_ORDER[newColIdx];
        const newCards = groupedIssues[newCol] || [];
        if (newCards.length > 0) {
          const targetIdx = Math.min(safeIdx, newCards.length - 1);
          setFocusedCard({ colKey: newCol, issueId: newCards[targetIdx].id });
          return;
        }
      }
    }
  }, [groupedIssues, focusedCard, setFocusedCard]);

  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement.tagName;
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      //Always-on: Ctrl+K – command palette
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyK') {
        e.preventDefault();
        onToggleCommandPalette();
        return;
      }

      //Always-on: Escape – close everything
      if (e.key === 'Escape') {
        onCloseAll();
        setFocusedCard(null);
        return;
      }

      //Always-on: ? modal – triggered by the physical key next to right Shift
      //Works on any layout: Slash (en), Period/Slash (ru), regardless of Shift
      //We check the physical key code (Slash) and also e.key for ? and . and /
      if (!isInput && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const isHelpKey =
          e.code === 'Slash' ||      //physical / key (en layout: / or ?, ru layout: . or ,)
          e.code === 'Period' ||     //physical . key on some layouts
          e.key === '?' ||           //shift+slash on en
          e.key === '/' ||           //slash on en
          e.key === '.' ||           //period on ru
          e.key === ',';             //comma on some ru layouts
        if (isHelpKey) {
          e.preventDefault();
          onOpenHotkeys?.();
          return;
        }
      }

      //Block remaining shortcuts when typing
      if (isInput) return;

      //C – create issue
      if (e.code === 'KeyC' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        e.preventDefault(); onCreateIssue(); return;
      }

      //P – create project
      if (e.code === 'KeyP' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault(); onCreateProject(); return;
      }

      //R – refresh
      if (e.code === 'KeyR' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault(); onRefresh(); return;
      }

      //V – toggle view (kanban vs list)
      if (e.code === 'KeyV' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault(); onToggleView?.(); return;
      }

      //F – focus search
      if (e.code === 'KeyF' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault(); onFocusSearch?.(); return;
      }

      //Card navigation: J or ArrowDown
      if ((e.code === 'KeyJ' || e.code === 'ArrowDown') && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        e.preventDefault(); navigate('down'); return;
      }

      //Card navigation: K or ArrowUp
      if ((e.code === 'KeyK' || e.code === 'ArrowUp') && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        e.preventDefault(); navigate('up'); return;
      }

      //Card navigation: L or ArrowRight
      if ((e.code === 'KeyL' || e.code === 'ArrowRight') && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        e.preventDefault(); navigate('right'); return;
      }

      //Card navigation: H or ArrowLeft
      if ((e.code === 'KeyH' || e.code === 'ArrowLeft') && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        e.preventDefault(); navigate('left'); return;
      }

      //Enter or Space – open focused card
      if ((e.code === 'Enter' || e.code === 'Space') && focusedCard) {
        e.preventDefault();
        onOpenFocusedCard?.();
        return;
      }

      //1-4 – move focused card to column 1,2,3,4 (instant column switch)
      if (focusedCard && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        const numMap = { 'Digit1': 0, 'Digit2': 1, 'Digit3': 2, 'Digit4': 3 };
        if (e.code in numMap) {
          e.preventDefault();
          const targetColKey = COL_ORDER[numMap[e.code]];
          onMoveCardToColumn?.(focusedCard.issueId, targetColKey);
          //Keep focus on same card in new column
          setFocusedCard({ colKey: targetColKey, issueId: focusedCard.issueId });
          return;
        }
      }

      if (focusedCard) {
        //A – quick assign
        if (e.code === 'KeyA' && !e.ctrlKey && !e.metaKey) {
          e.preventDefault(); onQuickAssign?.(); return;
        }

        //S – open detail panel focused on Status select
        if (e.code === 'KeyS' && !e.ctrlKey && !e.metaKey) {
          e.preventDefault(); onQuickStatus?.(); return;
        }

        //E – edit title
        if (e.code === 'KeyE' && !e.ctrlKey && !e.metaKey) {
          e.preventDefault(); onQuickEdit?.(); return;
        }
      }

      //Delete – delete active project (only when no card focused)
      if (
        e.code === 'Delete' &&
        !e.ctrlKey && !e.metaKey &&
        activeProject !== 'all' &&
        !isAnyModalOpen &&
        !focusedCard
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
    onDeleteActiveProject, onCloseAll, onToggleView, onFocusSearch, onOpenHotkeys,
    activeProject, projects, isAnyModalOpen,
    focusedCard, setFocusedCard, navigate,
    onOpenFocusedCard, onQuickAssign, onQuickStatus, onQuickEdit, onMoveCardToColumn,
  ]);
}
