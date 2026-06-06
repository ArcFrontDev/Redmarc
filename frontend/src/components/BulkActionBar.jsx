import { useState } from 'react';



export function BulkActionBar({ selectedIds, onClearSelection, users, statuses, onBulkUpdate }) {
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (e) => {
    const statusId = e.target.value;
    if (!statusId) return;
    setLoading(true);
    await onBulkUpdate(selectedIds, { status_id: statusId });
    setLoading(false);
    onClearSelection();
    e.target.value = ''; // reset select
  };

  const handleAssigneeChange = async (e) => {
    const userId = e.target.value;
    if (!userId) return;
    setLoading(true);
    await onBulkUpdate(selectedIds, { assigned_to_id: userId === 'none' ? '' : userId });
    setLoading(false);
    onClearSelection();
    e.target.value = '';
  };

  if (selectedIds.length === 0) return null;

  return (
    <div className="bulk-action-bar">
      <div className="bulk-info">
        <span className="bulk-count">{selectedIds.length}</span> issues selected
      </div>

      <div className="bulk-actions">
        {loading ? (
          <span className="bulk-loading">Updating...</span>
        ) : (
          <>
            <select className="bulk-select" onChange={handleStatusChange} defaultValue="">
              <option value="" disabled>Change Status...</option>
              {statuses.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            <select className="bulk-select" onChange={handleAssigneeChange} defaultValue="">
              <option value="" disabled>Assign To...</option>
              <option value="none">Unassigned</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name || `${u.firstname} ${u.lastname}`.trim() || u.login}
                </option>
              ))}
            </select>

            <button className="bulk-btn-outline" onClick={onClearSelection}>
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}
