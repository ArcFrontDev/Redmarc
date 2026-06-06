import { useState, useRef } from 'react';
import { api } from '../utils/api';
import { formatStatusName } from '../utils/statusMapping';

const XIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export function CreateIssueModal({
  projects,
  statuses,
  users,
  defaultProjectId,
  defaultStatusId,
  onSubmit,
  onClose,
}) {
  const firstStatusId = statuses.find(s => {
    const n = s.name.toLowerCase();
    return n.includes('new') || n.includes('open') || n === 'новая';
  })?.id || statuses[0]?.id || '';

  const [form, setForm] = useState({
    project_id: defaultProjectId || projects[0]?.id || '',
    subject: '',
    description: '',
    status_id: defaultStatusId || firstStatusId,
    assigned_to_id: '',
    priority_id: 2,
    uploads: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const descRef = useRef(null);

  const update = patch => setForm(f => ({ ...f, ...patch }));

  const handlePaste = async e => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        const uniqueName = `paste_${Date.now()}.${file.type.split('/')[1] || 'png'}`;
        const placeholder = `![Uploading ${uniqueName}...]`;
        update({ description: form.description + placeholder });
        try {
          const result = await api.uploadAttachment(file);
          const finalMd = `\n!${uniqueName}!\n`;
          setForm(f => ({
            ...f,
            description: f.description.replace(placeholder, finalMd),
            uploads: [...(f.uploads || []), { token: result.token, filename: uniqueName, content_type: file.type }],
          }));
        } catch {
          setForm(f => ({
            ...f,
            description: f.description.replace(placeholder, `[Upload failed: ${uniqueName}]`),
          }));
        }
        break;
      }
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.subject.trim()) return;
    setSubmitting(true);
    try {
      const payload = {
        project_id: parseInt(form.project_id, 10),
        subject: form.subject.trim(),
        description: form.description,
        status_id: parseInt(form.status_id, 10),
        priority_id: form.priority_id,
      };
      if (form.assigned_to_id) payload.assigned_to_id = parseInt(form.assigned_to_id, 10);
      if (form.uploads?.length) payload.uploads = form.uploads;
      await onSubmit(payload);
      onClose();
    } catch (err) {
      console.error('Failed to create issue:', err);
      alert('Failed to create issue: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Create new issue</h3>
          <button className="close-modal-btn" onClick={onClose}><XIcon /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Project *</label>
            <select value={form.project_id} onChange={e => update({ project_id: e.target.value })} required>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Issue subject *</label>
            <input
              type="text"
              value={form.subject}
              onChange={e => update({ subject: e.target.value })}
              placeholder="Describe the issue briefly..."
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              ref={descRef}
              value={form.description}
              onChange={e => update({ description: e.target.value })}
              onPaste={handlePaste}
              placeholder="Add detailed description... (paste images with Ctrl+V)"
              rows="4"
            />
          </div>

          <div className="form-group">
            <label>Status</label>
            <select value={form.status_id} onChange={e => update({ status_id: e.target.value })}>
              {statuses.map(s => <option key={s.id} value={s.id}>{formatStatusName(s.name)}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Assignee</label>
            <select value={form.assigned_to_id} onChange={e => update({ assigned_to_id: e.target.value })}>
              <option value="">Unassigned</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name || (u.firstname && u.lastname ? `${u.firstname} ${u.lastname}` : u.login) || 'User'}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-footer-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
