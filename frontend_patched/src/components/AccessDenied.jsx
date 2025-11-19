import React from 'react';

export default function AccessDenied({ title = 'Access Denied', message = 'You do not have permission to view this page.' }) {
  return (
    <div className="main-content">
      <div className="card" style={{ textAlign: 'center' }}>
        <div className="empty-state-icon">🚫</div>
        <h2 style={{ marginBottom: 8 }}>{title}</h2>
        <p className="empty-state-text" style={{ marginBottom: 16 }}>{message}</p>
        <p className="empty-state-text" style={{ fontSize: 13 }}>If you believe this is an error, contact your manager.</p>
      </div>
    </div>
  );
}
