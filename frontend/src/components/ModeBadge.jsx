import React, { useEffect, useState } from 'react';
import { apiBase, setApiBase } from '../lib/api';

export default function ModeBadge() {
  const [mode, setMode] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${apiBase()}/mode`, { signal: controller.signal })
      .then(r => r.json())
      .then(data => setMode(data))
      .catch(() => setError('unreachable'));
    return () => controller.abort();
  }, []);

  function toggleMode() {
    // Toggle between demo (4000) and secure (4001) without exposing ports in UI
    const target = mode && mode.patched ? 'http://localhost:4000' : 'http://localhost:4001';
    setApiBase(target);
    window.location.reload();
  }

  const base = apiBase();
  const label = error ? 'Backend Unavailable' : (mode && mode.patched ? 'Secure Mode' : 'Demo Mode');
  const colorStyle = error ? { background: '#fee2e2', borderColor: '#fecaca', color: '#991b1b' } : (mode && mode.patched
    ? { background: '#e0f2fe', borderColor: '#bae6fd', color: '#075985' }
    : { background: '#fff7ed', borderColor: '#fed7aa', color: '#9a3412' });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span className="user-badge" style={colorStyle}>{label} • {base.replace(/^https?:\/\//,'')}</span>
      {!error && (
        <button className="btn btn-ghost" onClick={toggleMode}>
          {mode && mode.patched ? 'Switch to Demo' : 'Switch to Secure'}
        </button>
      )}
    </div>
  );
}
