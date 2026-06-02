import React, { useState } from 'react';

const XIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
}

export function CreateProjectModal({ onSubmit, onClose }) {
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [identifierEdited, setIdentifierEdited] = useState(false);

  const handleNameChange = e => {
    setName(e.target.value);
    if (!identifierEdited) {
      setIdentifier(slugify(e.target.value));
    }
  };

  const handleIdentifierChange = e => {
    setIdentifier(e.target.value.replace(/[^a-z0-9-]/gi, '').toLowerCase());
    setIdentifierEdited(true);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!name.trim() || !identifier.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), identifier: identifier.trim(), description: description.trim() });
      onClose();
    } catch (err) {
      console.error('Failed to create project:', err);
      alert('Failed to create project: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Create new project</h3>
          <button className="close-modal-btn" onClick={onClose}><XIcon /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Project name *</label>
            <input
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder="e.g. Frontend Redesign"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Identifier *</label>
            <input
              type="text"
              value={identifier}
              onChange={handleIdentifierChange}
              placeholder="auto-generated from name"
              required
              pattern="[a-z0-9-]+"
            />
            <span className="input-tip-helper">Lowercase letters, numbers and dashes only</span>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brief project description..."
              rows="3"
            />
          </div>

          <div className="modal-footer-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
