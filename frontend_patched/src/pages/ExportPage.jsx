import React, { useEffect, useState } from 'react';
import { API_BASE } from '../lib/api';

export default function ExportPage({ currentUser }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/profiles`)
      .then(r => r.json())
      .then(setProfiles)
      .catch(() => setProfiles([]))
      .finally(() => setLoading(false));
  }, []);

  function exportToCSV() {
    const headers = ['Name', 'User ID', 'Employee ID', 'Department', 'Status'];
    const rows = profiles.map(p => [
      `${p.firstName} ${p.lastName}`,
      p.id,
      p.employeeId,
      p.publicFields?.department || 'N/A',
      p.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'secureonboard-export.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportToJSON() {
    const json = JSON.stringify(profiles, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'secureonboard-export.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <div className="main-content">Loading...</div>;

  return (
    <div className="main-content">
      <div className="page-header">
        <h1 className="page-title">Export Data</h1>
        <p className="page-subtitle">Download employee data in various formats</p>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16 }}>Available Data</h3>
        <p style={{ color: 'var(--muted)', marginBottom: 24 }}>
          Total Profiles: <strong>{profiles.length}</strong>
        </p>

        <div className="export-section">
          <h4 style={{ marginBottom: 12 }}>Export Options</h4>
          <div className="export-options">
            <button className="btn btn-primary" onClick={exportToCSV}>
              Export as CSV
            </button>
            <button className="btn btn-primary" onClick={exportToJSON}>
              Export as JSON
            </button>
          </div>
        </div>

        <div style={{ marginTop: 32, padding: 16, background: '#f9fafb', borderRadius: 8 }}>
          <h4 style={{ marginBottom: 8 }}>Preview</h4>
          <div style={{ maxHeight: 300, overflow: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>User ID</th>
                  <th>Employee ID</th>
                  <th>Department</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {profiles.slice(0, 5).map(p => (
                  <tr key={p.id}>
                    <td>{p.firstName} {p.lastName}</td>
                    <td>{p.id}</td>
                    <td>{p.employeeId}</td>
                    <td>{p.publicFields?.department || 'N/A'}</td>
                    <td>{p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {profiles.length > 5 && (
              <p style={{ textAlign: 'center', color: 'var(--muted)', marginTop: 12 }}>
                ...and {profiles.length - 5} more
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
