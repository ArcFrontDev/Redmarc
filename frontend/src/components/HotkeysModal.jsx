import React, { useEffect } from 'react';

const HOTKEYS = [
  {
    section: 'Global Actions',
    items: [
      { keys: ['C'], description: 'Create new issue' },
      { keys: ['P'], description: 'Create new project' },
      { keys: ['R'], description: 'Refresh data' },
      { keys: ['Ctrl', 'K'], description: 'Open command palette' },
      { keys: ['/'], description: 'Show keyboard shortcuts (any layout)' },
      { keys: ['Esc'], description: 'Close panel / cancel' },
    ],
  },
  {
    section: 'Board Navigation',
    items: [
      { keys: ['J', '↓'], description: 'Focus card below' },
      { keys: ['K', '↑'], description: 'Focus card above' },
      { keys: ['H', '←'], description: 'Move focus to previous column' },
      { keys: ['L', '→'], description: 'Move focus to next column' },
      { keys: ['Enter', 'Space'], description: 'Open focused card' },
      { keys: ['V'], description: 'Toggle Kanban / List view' },
      { keys: ['F'], description: 'Focus search bar' },
    ],
  },
  {
    section: 'Quick Actions (on focused card)',
    items: [
      { keys: ['1'], description: 'Move card to column 1 – To Do' },
      { keys: ['2'], description: 'Move card to column 2 – In Progress' },
      { keys: ['3'], description: 'Move card to column 3 – Review' },
      { keys: ['4'], description: 'Move card to column 4 – Done' },
      { keys: ['A'], description: 'Quick assign – open detail & focus assignee' },
      { keys: ['S'], description: 'Quick status – open detail & focus status' },
      { keys: ['E'], description: 'Edit title – open detail in title edit mode' },
    ],
  },
  {
    section: 'Projects',
    items: [
      { keys: ['Del'], description: 'Delete active project (confirm required)' },
    ],
  },
];

export function HotkeysModal({ onClose }) {
  useEffect(() => {
    const handler = e => {
      //Close on Escape or the same help key (physical Slash/Period)
      if (
        e.key === 'Escape' ||
        e.code === 'Slash' ||
        e.code === 'Period' ||
        e.key === '?' ||
        e.key === '/' ||
        e.key === '.'
      ) onClose();
    };
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
          <button className="close-modal-btn" onClick={onClose} title="Close">&#x2715;</button>
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
                        {i < item.keys.length - 1 && (
                          <span className="hotkey-plus">
                            {item.keys.includes('Ctrl') ? '+' : ' / '}
                          </span>
                        )}
                      </React.Fragment>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="hotkeys-modal-footer">
          Press <kbd className="hotkey-kbd">/</kbd> or <kbd className="hotkey-kbd">Esc</kbd> to close
        </div>
      </div>
    </div>
  );
}
