import React from 'react';

const XIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export function DeleteConfirmModal({ projectName, onConfirm, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Delete project</h3>
          <button className="close-modal-btn" onClick={onClose}><XIcon /></button>
        </div>

        <div className="modal-form">
          <p style={{ color: 'var(--text-primary)', fontSize: '14px', lineHeight: '1.5' }}>
            Are you sure you want to delete <strong>"{projectName}"</strong>?
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '8px', lineHeight: '1.5' }}>
            All issues in this project will be permanently deleted. This action cannot be undone.
          </p>
          <div className="modal-footer-actions mt-4">
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button
              className="btn"
              style={{ background: 'rgba(220, 38, 38, 0.85)', borderColor: 'rgba(220, 38, 38, 0.5)', color: '#fff' }}
              onClick={() => { onConfirm(); onClose(); }}
            >
              Delete project
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
