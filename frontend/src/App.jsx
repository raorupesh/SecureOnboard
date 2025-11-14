import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import OnboardedPage from './pages/OnboardedPage';
import OffboardedPage from './pages/OffboardedPage';
import InProgressPage from './pages/InProgressPage';
import RejectedPage from './pages/RejectedPage';
import MyDashboardPage from './pages/MyDashboardPage';
import ExportPage from './pages/ExportPage';
import Topbar from './components/Topbar';
import './styles.css';

function TabNav({ currentUser }) {
  const location = useLocation();
  const isManager = currentUser?.role === 'admin';

  if (!isManager) {
    // Bob only sees My Dashboard
    return (
      <div className="tabs-container">
        <div className="tabs">
          <Link to="/my-dashboard" className={`tab ${location.pathname === '/my-dashboard' ? 'active' : ''}`}>
            My Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Alice sees all tabs
  return (
    <div className="tabs-container">
      <div className="tabs">
        <Link to="/my-dashboard" className={`tab ${location.pathname === '/my-dashboard' ? 'active' : ''}`}>
          My Dashboard
        </Link>
        <Link to="/onboarded" className={`tab ${location.pathname === '/onboarded' ? 'active' : ''}`}>
          Onboarded
        </Link>
        <Link to="/offboarded" className={`tab ${location.pathname === '/offboarded' ? 'active' : ''}`}>
          Offboarded
        </Link>
        <Link to="/in-progress" className={`tab ${location.pathname === '/in-progress' ? 'active' : ''}`}>
          In Progress
        </Link>
        <Link to="/rejected" className={`tab ${location.pathname === '/rejected' ? 'active' : ''}`}>
          Rejected
        </Link>
        <Link to="/export" className={`tab ${location.pathname === '/export' ? 'active' : ''}`}>
          Export
        </Link>
      </div>
    </div>
  );
}

function AppContent({ currentUser, onLogout }) {
  return (
    <div className="app-container">
      <Topbar currentUser={currentUser} onLogout={onLogout} />
      <TabNav currentUser={currentUser} />
      <Routes>
        <Route path="/my-dashboard" element={<MyDashboardPage currentUser={currentUser} />} />
        <Route path="/onboarded" element={<OnboardedPage currentUser={currentUser} />} />
        <Route path="/offboarded" element={<OffboardedPage currentUser={currentUser} />} />
        <Route path="/in-progress" element={<InProgressPage currentUser={currentUser} />} />
        <Route path="/rejected" element={<RejectedPage currentUser={currentUser} />} />
        <Route path="/export" element={<ExportPage currentUser={currentUser} />} />
        <Route path="/" element={<Navigate to="/my-dashboard" replace />} />
        <Route path="*" element={<MyDashboardPage currentUser={currentUser} />} />
      </Routes>
    </div>
  );
}

function AppWrapper() {
  const [currentUser, setCurrentUser] = useState(null);

  // Restore session from localStorage and enforce 1-hour expiry
  useEffect(() => {
    try {
      const raw = localStorage.getItem('so_session');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.user && typeof parsed.expiresAt === 'number') {
          if (Date.now() < parsed.expiresAt) {
            setCurrentUser(parsed.user);
          } else {
            localStorage.removeItem('so_session');
          }
        }
      }
    } catch (_) {
      // ignore
    }

    // Periodically check for expiry
    const id = setInterval(() => {
      try {
        const raw = localStorage.getItem('so_session');
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.expiresAt === 'number' && Date.now() >= parsed.expiresAt) {
          localStorage.removeItem('so_session');
          setCurrentUser(null);
        }
      } catch (_) {}
    }, 30000);

    return () => clearInterval(id);
  }, []);

  function handleLogout() {
    try { localStorage.removeItem('so_session'); } catch(_) {}
    setCurrentUser(null);
  }

  if (!currentUser) {
    return <Login onLogin={(u) => {
      // On login, persist for 1 hour
      const session = { user: u, expiresAt: Date.now() + 60 * 60 * 1000 };
      try { localStorage.setItem('so_session', JSON.stringify(session)); } catch(_) {}
      setCurrentUser(u);
    }} />;
  }

  return <AppContent currentUser={currentUser} onLogout={handleLogout} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AppWrapper />
    </BrowserRouter>
  );
}
