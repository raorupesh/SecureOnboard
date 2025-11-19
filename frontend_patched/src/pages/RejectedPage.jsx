import React, { useEffect, useState } from 'react';
import StatusBadge from '../components/StatusBadge';
import { API_BASE } from '../lib/api';

export default function RejectedPage({ currentUser }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/profiles`)
      .then(r => r.json())
      .then(data => {
        const filtered = data.filter(p => p.status === 'Rejected');
        setProfiles(filtered);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleApprove(id) {
    const r = await fetch(`${API_BASE}/profiles/${id}/approve`, {
      method: 'PATCH',
      headers: { 'x-user': currentUser.apiHeader }
    });
    if (r.ok) {
      setProfiles(prev => prev.filter(p => p.id !== id));
    }
  }

  if (loading) return <div className="main-content">Loading...</div>;

  return (
    <div className="main-content">
      <div className="page-header">
        <h1 className="page-title">Rejected Applications</h1>
        <p className="page-subtitle">Onboarding requests that were rejected</p>
      </div>

      <div className="card">
        {profiles.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-text">No rejected applications</div>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>User ID</th>
                  <th>Employee ID</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map(p => (
                  <tr key={p.id}>
                    <td>{p.firstName} {p.lastName}</td>
                    <td>{p.id}</td>
                    <td>{p.employeeId}</td>
                    <td>{p.publicFields?.department || 'N/A'}</td>
                    <td><StatusBadge status={p.status} /></td>
                    <td>
                      <div className="actions">
                        <button className="btn btn-success" onClick={() => handleApprove(p.id)}>
                          Approve
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
