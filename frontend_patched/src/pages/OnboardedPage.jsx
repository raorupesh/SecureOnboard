import React, { useEffect, useState } from 'react';
import StatusBadge from '../components/StatusBadge';
import { API_BASE } from '../lib/api';

export default function OnboardedPage({ currentUser }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/profiles`)
      .then(r => r.json())
      .then(data => {
        const filtered = data.filter(p => p.status === 'Onboarded');
        setProfiles(filtered);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleOffboard(id) {
    const r = await fetch(`${API_BASE}/profiles/${id}/offboard`, {
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
        <h1 className="page-title">Onboarded Employees</h1>
        <p className="page-subtitle">Employees who have completed the onboarding process</p>
      </div>

      <div className="card">
        {profiles.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-text">No onboarded employees found</div>
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
                        <button className="btn btn-danger" onClick={() => handleOffboard(p.id)}>
                          Offboard
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
