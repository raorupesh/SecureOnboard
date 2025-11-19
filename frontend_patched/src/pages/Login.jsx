import React, { useState } from 'react';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    setError('');

    // Map dataset with separate ownerId (auth id) and profileId
    const credentials = {
      'alice': { password: 'Manager@123', ownerId: '1', profileId: '17654', role: 'admin', firstName: 'Alice', lastName: 'Johnson' },
      'bob': { password: 'User@123', ownerId: '2', profileId: '17655', role: 'user', firstName: 'Bob', lastName: 'Miller' },
      'alice_2025': { password: 'Manager@123', ownerId: '1', profileId: '17654', role: 'admin', firstName: 'Alice', lastName: 'Johnson' },
      'bob_2025': { password: 'User@123', ownerId: '2', profileId: '17655', role: 'user', firstName: 'Bob', lastName: 'Miller' }
    };

    const user = credentials[username.toLowerCase().trim()];
    
    if (user && user.password === password) {
      const loggedIn = {
        ownerId: user.ownerId,
        profileId: user.profileId,
        role: user.role,
        apiHeader: `${user.ownerId}:${user.role}`,
        firstName: user.firstName,
        lastName: user.lastName,
        username
      };
      const session = { user: loggedIn, expiresAt: Date.now() + 60 * 60 * 1000 };
      try { localStorage.setItem('so_session_patched', JSON.stringify(session)); } catch(_) {}
      onLogin(loggedIn);
    } else {
      setError('Invalid username or password');
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h1>SecureOnboard (Patched)</h1>
          <p>Broken Access Control — Secure Mode</p>
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
