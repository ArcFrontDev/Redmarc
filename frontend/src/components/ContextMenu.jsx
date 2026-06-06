
const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
  </svg>
);

export function ContextMenu({ x, y, projectName, onDelete, onClose }) {
  return (
    <div className="context-menu-overlay" onClick={onClose}>
      <div
        className="context-menu"
        style={{ top: y, left: x }}
        onClick={e => e.stopPropagation()}
      >
        <div className="context-menu-title">{projectName}</div>
        <button
          className="context-menu-item context-menu-danger"
          onClick={() => { onDelete(); onClose(); }}
        >
          <TrashIcon />
          Delete project
        </button>
      </div>
    </div>
  );
}
