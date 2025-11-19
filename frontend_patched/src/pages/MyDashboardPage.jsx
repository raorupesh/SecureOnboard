import React, { useEffect, useState } from 'react';
import StatusBadge from '../components/StatusBadge';
import { API_BASE } from '../lib/api';

export default function MyDashboardPage({ currentUser }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    fetch(`${API_BASE}/profiles/self`, { headers: { 'x-user': currentUser.apiHeader } })
      .then(async r => {
        if (!r.ok) {
          const t = await r.text();
          throw new Error(t || `HTTP ${r.status}`);
        }
        return r.json();
      })
      .then(data => {
        setProfile(data);
        setLoading(false);
      })
      .catch(e => {
        setError('Failed to load your profile');
        setLoading(false);
      });
  }, [currentUser.apiHeader]);

  if (loading) return <div className="main-content">Loading...</div>;

  return (
    <div className="main-content">
      <div className="page-header">
        <h1 className="page-title">My Dashboard</h1>
        <p className="page-subtitle">Your personal onboarding information</p>
      </div>

      <div className="card">
        {error ? (
          <div className="empty-state">
            <div className="empty-state-text">{error}</div>
          </div>
        ) : !profile ? (
          <div className="empty-state">
            <div className="empty-state-text">No profile found</div>
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
                <tr>
                  <td>{profile.firstName} {profile.lastName}</td>
                  <td>{profile.id}</td>
                  <td>{profile.employeeId}</td>
                  <td>{profile.publicFields?.department || 'N/A'}</td>
                  <td><StatusBadge status={profile.status} /></td>
                  <td>
                    —
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
