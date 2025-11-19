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
import AccessDenied from './components/AccessDenied';
import './styles.css';
import { loadPatchedSession, savePatchedSession, clearPatchedSession } from './lib/authStorage';

function TabNav({ currentUser }) {
  const location = useLocation();
  const isManager = currentUser?.role === 'admin';

  if (!isManager) {
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

function RequireAdmin({ currentUser, children }) {
  if (currentUser?.role !== 'admin') {
    return <AccessDenied title="Access Denied" message="This dashboard is limited to managers." />;
  }
  return children;
}

function AppContent({ currentUser, onLogout }) {
  return (
    <div className="app-container">
      <Topbar currentUser={currentUser} onLogout={onLogout} />
      <TabNav currentUser={currentUser} />
      <Routes>
        <Route path="/my-dashboard" element={<MyDashboardPage currentUser={currentUser} />} />
        <Route path="/onboarded" element={<RequireAdmin currentUser={currentUser}><OnboardedPage currentUser={currentUser} /></RequireAdmin>} />
        <Route path="/offboarded" element={<RequireAdmin currentUser={currentUser}><OffboardedPage currentUser={currentUser} /></RequireAdmin>} />
        <Route path="/in-progress" element={<RequireAdmin currentUser={currentUser}><InProgressPage currentUser={currentUser} /></RequireAdmin>} />
        <Route path="/rejected" element={<RequireAdmin currentUser={currentUser}><RejectedPage currentUser={currentUser} /></RequireAdmin>} />
        <Route path="/export" element={<RequireAdmin currentUser={currentUser}><ExportPage currentUser={currentUser} /></RequireAdmin>} />
        <Route path="/" element={<Navigate to="/my-dashboard" replace />} />
        <Route path="*" element={<Navigate to="/my-dashboard" replace />} />
      </Routes>
    </div>
  );
}

function AppWrapper() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const u = loadPatchedSession();
    if (u) setCurrentUser(u);
    const id = setInterval(() => {
      const u2 = loadPatchedSession();
      if (!u2) setCurrentUser(null);
    }, 30000);
    return () => clearInterval(id);
  }, []);

  function handleLogout() {
    clearPatchedSession();
    setCurrentUser(null);
  }

  if (!currentUser) {
    return <Login onLogin={(u) => { savePatchedSession(u); setCurrentUser(u); }} />;
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
