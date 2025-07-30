import React, { useState, useEffect } from 'react';
import type { UserDtoWithRolesAndAuthStatus } from './interfaces/types';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import { apiURL } from './config';
import DeleteDayOffAdmin from './pages/admin/DeleteDayOffAdmin';
import NavBar from './components/MyNavbar';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import CalendarDayOffPage from './pages/CalendarDayOffPage';
import PendingDayOffAdmin from './pages/admin/PendingDayOffAdmin';
import Loading from './components/LoadingSpinner';
import AdminProjectsPage from './pages/admin/AdminProjectsPage';
import AdminUserProjectsPage from './pages/admin/AdminUserProjectsPage';
import UserProfilePage from './pages/UserProfilePage';
import SettingsAdmin from './pages/admin/SettingsAdmin';
import WorkLogWidget from './components/WorkStatusWidget';
import WorkLogCalendarPage from './pages/WorkLogCalendarPage';
import DeleteWorkLogAdmin from './pages/admin/DeleteWorkLogAdmin';
import SummaryAdminPage from './pages/admin/SummaryAdminPage';

const App: React.FC = () => {
  const { instance, accounts } = useMsal();
  const navigate = useNavigate();
  const isAuthenticated = useIsAuthenticated();
  const { inProgress } = useMsal();

  // Pobieraj usera z localStorage przy starcie
  const [user, setUser] = useState<UserDtoWithRolesAndAuthStatus | null>(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [isAdmin, setIsAdmin] = useState(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      const parsed = JSON.parse(stored);
      return !!parsed?.roles?.includes("Admin");
    }
    return false;
  });
  const [sessionExpired, setSessionExpired] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);

  useEffect(() => {
    // Pobierz usera z backendu tylko przy logowaniu lub odświeżeniu
    if (isAuthenticated) {
      setIsLoadingUser(true);
      fetch(`${apiURL}/api/User/profile`, {
        method: 'GET',
        credentials: 'include',
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          setUser(data);
          localStorage.setItem("user", JSON.stringify(data));
          setIsAdmin(!!data?.roles?.includes("Admin"));
        })
        .catch(() => {
          setUser(null);
          localStorage.removeItem("user");
          setIsAdmin(false);
        })
        .finally(() => setIsLoadingUser(false));
    } else {
      setUser(null);
      localStorage.removeItem("user");
      setIsAdmin(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response) {
          if (
            error.response.status === 401 &&
            isAuthenticated &&
            !isLoadingUser
          ) {
            setSessionExpired(true);
            handleLogout();
          } else if (error.response.status === 429) {
            setRateLimited(true);
          }
        }
        return Promise.reject(error);
      }
    );
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [isAuthenticated, isLoadingUser]);

  const RateLimitedModal = () => (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.4)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{ background: '#fff', padding: 32, borderRadius: 8, minWidth: 320, textAlign: 'center', boxShadow: '0 2px 16px #0002' }}>
        <h2>Too Many Requests</h2>
        <p>Too many requests sent. Please wait a moment and try again.</p>
        <button className="btn btn-primary" onClick={() => setRateLimited(false)}>OK</button>
      </div>
    </div>
  );

  const handleLogin = () => {
    instance.loginPopup({
      scopes: ['api://8b8a49ef-3242-4695-985d-9a7eb39071ae/TimeRecorderBACKEND.all'],
      prompt: "select_account",
    })
      .then(async (response) => {
        const account = response.account;
        if (account) {
          try {
            const tokenResponse = await instance.acquireTokenSilent({
              account,
              scopes: ['api://8b8a49ef-3242-4695-985d-9a7eb39071ae/TimeRecorderBACKEND.all'],
            });
            const loginRes = await fetch(`${apiURL}/api/auth/login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: tokenResponse.accessToken }),
              credentials: 'include',
            });
            if (loginRes.ok) {
              const loginData = await loginRes.json();
              setUser(loginData);
              localStorage.setItem("user", JSON.stringify(loginData));
              setIsLoadingUser(false);
              setIsAdmin(!!loginData.roles?.includes("Admin"));
              navigate('/dashboard');
            } else {
              setUser(null);
              localStorage.removeItem("user");
              setIsLoadingUser(false);
              setIsAdmin(false);
            }
          } catch (tokenError) {
            setUser(null);
            localStorage.removeItem("user");
            setIsLoadingUser(false);
            setIsAdmin(false);
            console.error('Token acquisition error:', tokenError);
          }
        }
      })
      .catch(error => {
        setUser(null);
        localStorage.removeItem("user");
        setIsLoadingUser(false);
        setIsAdmin(false);
        console.error('Login error:', error);
      });
  };

  const handleLogout = () => {
    fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    }).then(() => {
      instance.logoutRedirect({
        postLogoutRedirectUri: "/",
        onRedirectNavigate: () => false,
      });
      setUser(null);
      localStorage.removeItem("user");
      setIsLoadingUser(false);
      setIsAdmin(false);
      navigate('/');
    });
  };

  const SessionExpiredModal = () => (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.4)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{ background: '#fff', padding: 32, borderRadius: 8, minWidth: 320, textAlign: 'center', boxShadow: '0 2px 16px #0002' }}>
        <h2>Your session has expired</h2>
        <p>Please log in again.</p>
        <button className="btn btn-primary" onClick={() => setSessionExpired(false)}>OK</button>
      </div>
    </div>
  );

    if (!isAuthenticated) {
    return (
      <>
        <NavBar accounts={accounts} onLogin={handleLogin} onLogout={handleLogout} userRoles={[]} user={null} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </>
    );
  }

  if (isLoadingUser || inProgress !== "none" || user === null) {
    return (
      <>
        {sessionExpired && <SessionExpiredModal />}
        {rateLimited && <RateLimitedModal />}
        <NavBar accounts={accounts} onLogin={handleLogin} onLogout={handleLogout} userRoles={[]} user={null} />
        <Loading />
      </>
    );
  }
  return (
    <>
      {sessionExpired && <SessionExpiredModal />}
      {rateLimited && <RateLimitedModal />}
      <NavBar accounts={accounts} onLogin={handleLogin} onLogout={handleLogout} userRoles={user?.roles || []} user={user} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/dashboard"
          element={user?.isAuthenticated ? <Dashboard user={user} /> : <Navigate to="/" />}
        />
        <Route
          path="/dayoff"
          element={user?.isAuthenticated ? <CalendarDayOffPage user={user} /> : <Navigate to="/" />}
        />
        <Route
          path="/admin/pendingAdmin"
          element={user?.isAuthenticated && isAdmin ? <PendingDayOffAdmin /> : <Navigate to="/" />}
        />
        <Route
          path="/admin/deleteDayOff"
          element={user?.isAuthenticated && isAdmin ? <DeleteDayOffAdmin /> : <Navigate to="/" />}
        />
        <Route
          path="/admin/deleteWorkLog"
          element={user?.isAuthenticated && isAdmin ? <DeleteWorkLogAdmin /> : <Navigate to="/" />}
        />
        <Route
          path="/admin/projects"
          element={user?.isAuthenticated && isAdmin ? <AdminProjectsPage /> : <Navigate to="/" />}
        />
        <Route
          path="/admin/user-projects"
          element={user?.isAuthenticated && isAdmin ? <AdminUserProjectsPage user={user} /> : <Navigate to="/" />}
        />
        <Route
          path="/admin/summary"
          element={user?.isAuthenticated && isAdmin ? <SummaryAdminPage /> : <Navigate to="/" />}
        />
        <Route
          path="/admin/settings"
          element={user?.isAuthenticated && isAdmin ? <SettingsAdmin /> : <Navigate to="/" />}
        />
        <Route
          path="/worklogs"
          element={user?.isAuthenticated ? <WorkLogCalendarPage user={user} /> : <Navigate to="/" />}
        />
        <Route path="/profile" element={user?.isAuthenticated ? <UserProfilePage user={user} /> : <Navigate to="/" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      {user.isAuthenticated && <WorkLogWidget userRoles={user.roles || []} user={user} />}
    </>
  );
};

export default App;