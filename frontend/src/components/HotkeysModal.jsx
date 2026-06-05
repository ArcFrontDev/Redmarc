import React, { useEffect } from 'react';

const HOTKEYS = [
  {
    section: 'Navigation',
    items: [
      { keys: ['Ctrl', 'K'], description: 'Open command palette' },
      { keys: ['K'], description: 'Kanban view' },
      { keys: ['L'], description: 'List view' },
      { keys: ['R'], description: 'Refresh data' },
      { keys: ['Esc'], description: 'Close panel / modal' },
      { keys: ['?'], description: 'Show this help' },
    ],
  },
  {
    section: 'Issues',
    items: [
      { keys: ['C'], description: 'Create new issue' },
      { keys: ['E'], description: 'Edit selected issue title' },
      { keys: ['F'], description: 'Focus search bar' },
    ],
  },
  {
    section: 'Projects',
    items: [
      { keys: ['P'], description: 'Create new project' },
      { keys: ['Del'], description: 'Delete active project' },
    ],
  },
  {
    section: 'Drag & Drop',
    items: [
      { keys: ['Space'], description: 'Pick up / drop card (keyboard DnD)' },
      { keys: ['← →'], description: 'Move card between columns' },
      { keys: ['↑ ↓'], description: 'Reorder card within column' },
    ],
  },
];

export function HotkeysModal({ onClose }) {
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape' || e.key === '?') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="hotkeys-modal"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
      >
        <div className="hotkeys-modal-header">
          <span className="hotkeys-modal-title">Keyboard Shortcuts</span>
          <button className="close-modal-btn" onClick={onClose} title="Close">✕</button>
        </div>

        <div className="hotkeys-modal-body">
          {HOTKEYS.map(group => (
            <div key={group.section} className="hotkeys-group">
              <div className="hotkeys-group-title">{group.section}</div>
              {group.items.map(item => (
                <div key={item.description} className="hotkeys-row">
                  <span className="hotkeys-desc">{item.description}</span>
                  <span className="hotkeys-keys">
                    {item.keys.map((k, i) => (
                      <React.Fragment key={k}>
                        <kbd className="hotkey-kbd">{k}</kbd>
                        {i < item.keys.length - 1 && <span className="hotkey-plus">+</span>}
                      </React.Fragment>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="hotkeys-modal-footer">
          Press <kbd className="hotkey-kbd">?</kbd> or <kbd className="hotkey-kbd">Esc</kbd> to close
        </div>
      </div>
    </div>
  );
}
