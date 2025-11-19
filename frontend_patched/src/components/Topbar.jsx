import React from 'react';

export default function Topbar({ currentUser, onLogout }) {
  return (
    <header className="topbar">
      <div className="brand">SecureOnboard (Patched)</div>
      <div className="topbar-right">
        {currentUser && (
          <>
            <span className="user-badge">
              {currentUser.firstName} {currentUser.lastName} — {currentUser.role === 'admin' ? 'Manager' : 'User'}
            </span>
            <button className="btn btn-ghost" onClick={onLogout}>
              Logout
            </button>
          </>
        )}
      </div>
    </header>
  );
}
