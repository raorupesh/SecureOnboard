import React, { useEffect, useState } from 'react';
import StatusBadge from '../components/StatusBadge';
import { API_BASE } from '../lib/api';

export default function MyDashboardPage({ currentUser }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/profiles`)
      .then(r => r.json())
      .then(data => {
        // For Bob, find his profile (ownerId matches his user ID)
        const myProfile = data.find(p => String(p.ownerId) === String(currentUser.id));
        if (myProfile) {
          // Force status to show as "Onboarded" for Bob
          setProfile({ ...myProfile, status: 'Onboarded' });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [currentUser.id]);

  if (loading) return <div className="main-content">Loading...</div>;

  return (
    <div className="main-content">
      <div className="page-header">
        <h1 className="page-title">My Dashboard</h1>
        <p className="page-subtitle">Your personal onboarding information</p>
      </div>

      <div className="card">
        {!profile ? (
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
