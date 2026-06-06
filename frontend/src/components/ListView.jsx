import { useState } from 'react';
import { formatStatusName } from '../utils/statusMapping';
import { BulkActionBar } from './BulkActionBar';

export function ListView({ issues, onIssueClick, users, statuses, onBulkUpdate }) {
  const [selectedIds, setSelectedIds] = useState([]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(issues.map(i => i.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (e, id) => {
    if (e.target.checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(i => i !== id));
    }
  };

  return (
    <div className="list-view">
      <table className="issues-table">
        <thead>
          <tr>
            <th className="col-checkbox">
              <input
                type="checkbox"
                onChange={handleSelectAll}
                checked={issues.length > 0 && selectedIds.length === issues.length}
              />
            </th>
            <th className="col-id">#</th>
            <th className="col-title">Issue</th>
            <th className="col-project">Project</th>
            <th className="col-status">Status</th>
            <th className="col-assignee">Assignee</th>
            <th className="col-date">Updated</th>
          </tr>
        </thead>
        <tbody>
          {issues.length === 0 ? (
            <tr>
              <td colSpan="6" className="table-empty">No issues found</td>
            </tr>
          ) : (
            issues.map(issue => (
              <tr
                key={issue.id}
                className={`table-row ${selectedIds.includes(issue.id) ? 'selected' : ''}`}
                onClick={() => onIssueClick(issue)}
              >
                <td className="col-checkbox" onClick={e => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(issue.id)}
                    onChange={(e) => handleSelectOne(e, issue.id)}
                  />
                </td>
                <td className="col-id">#{issue.id}</td>
                <td className="col-title">{issue.subject}</td>
                <td className="col-project">
                  <span className="table-project-tag">{issue.project.name}</span>
                </td>
                <td className="col-status">
                  <span className="table-status-badge">
                    {formatStatusName(issue.status?.name)}
                  </span>
                </td>
                <td className="col-assignee">{issue.assigned_to?.name || '–'}</td>
                <td className="col-date">
                  {new Date(issue.updated_on).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <BulkActionBar
        selectedIds={selectedIds}
        onClearSelection={() => setSelectedIds([])}
        users={users}
        statuses={statuses}
        onBulkUpdate={onBulkUpdate}
      />
    </div>
  );
}
