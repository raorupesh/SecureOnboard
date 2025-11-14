import React, { useState } from 'react';
import { API_BASE } from '../lib/api';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    setError('');

    // Demo credentials (accept short usernames 'alice' and 'bob' to match docs)
    const credentials = {
      'alice': { password: 'Manager@123', userId: '1', role: 'admin', firstName: 'Alice', lastName: 'Johnson' },
      'bob': { password: 'User@123', userId: '2', role: 'user', firstName: 'Bob', lastName: 'Miller' },
      // keep legacy keys for compatibility
      'alice_2025': { password: 'Manager@123', userId: '1', role: 'admin', firstName: 'Alice', lastName: 'Johnson' },
      'bob_2025': { password: 'User@123', userId: '2', role: 'user', firstName: 'Bob', lastName: 'Miller' }
    };

    const user = credentials[username.toLowerCase().trim()];
    
    if (user && user.password === password) {
      const loggedIn = {
        id: user.userId,
        role: user.role,
        apiHeader: `${user.userId}:${user.role}`,
        firstName: user.firstName,
        lastName: user.lastName,
        username
      };
      // Persist session for 1 hour (handled in App as well). Keeping here for immediate durability.
      const session = { user: loggedIn, expiresAt: Date.now() + 60 * 60 * 1000 };
      try { localStorage.setItem('so_session', JSON.stringify(session)); } catch(_) {}
      onLogin(loggedIn);
    } else {
      setError('Invalid username or password');
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h1>SecureOnboard</h1>
          <p>Broken Access Control Demo</p>
        </div>

        <form className="form" onSubmit={handleSubmit} noValidate>
          <div className="input-group">
            <label className="label" htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              className="input"
              placeholder="Enter username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label className="label" htmlFor="password">Password</label>
            <div className="password-row">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="input"
                placeholder="Enter password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowPassword(s => !s)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {error && <div className="error">{error}</div>}
          </div>

          <button type="submit" className="btn btn-primary full-width">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
