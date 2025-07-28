import React, { useState, useEffect } from 'react';
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
  console.log("App component mounted");
  const { instance, accounts } = useMsal();
  const navigate = useNavigate();
  const isAuthenticated = useIsAuthenticated();
  const { inProgress } = useMsal();
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [isLoadingUserRoles, setIsLoadingUserRoles] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const fetchUserRoles = async () => {
    try {
      setIsLoadingUserRoles(true);
      console.log("Fetching user roles...");
      const response = await axios.get(`${apiURL}/api/auth/check`, { withCredentials: true });
      console.log("User roles response:", response.data);

      if (response.data && response.data.roles) {
        setUserRoles(response.data.roles);
        setIsAdmin(response.data.roles.includes("Admin"));
      } else {
        setUserRoles([]);
        setIsAdmin(false);
      }
    } catch (error) {
      console.error("Error fetching user roles from backend:", error);
      setUserRoles([]);
      setIsAdmin(false);
    } finally {
      setIsLoadingUserRoles(false);
    }
  };


  useEffect(() => {
    console.log("isAuthenticated:", isAuthenticated);
    if (isAuthenticated) {
      fetchUserRoles();
    } else {
      setUserRoles([]);
      setIsLoadingUserRoles(false);
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
            !isLoadingUserRoles
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
  }, [isAuthenticated, isLoadingUserRoles]);
  // Modal for rate limiting
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
            console.log('Token acquired:', tokenResponse.accessToken);

            await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: tokenResponse.accessToken }),
              credentials: 'include',
            });

            console.log('Login successful, backend should set HttpOnly cookie');
            await fetchUserRoles();
            navigate('/dashboard');
          } catch (tokenError) {
            console.error('Token acquisition error:', tokenError);
          }
        }
      })
      .catch(error => {
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
      setUserRoles([]);
      setIsLoadingUserRoles(false);
      navigate('/');
    });
  };


  // Modal session expired
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
        {sessionExpired && <SessionExpiredModal />}
        {rateLimited && <RateLimitedModal />}
        <NavBar accounts={accounts} onLogin={handleLogin} onLogout={handleLogout} userRoles={[]} />
        <Home />
      </>
    );
  }

  if (isLoadingUserRoles || inProgress !== "none" || isAdmin === null) {  
    console.log("Loading user roles or MSAL in progress");
    return <Loading />;
  }

  return (
    <>
      {sessionExpired && <SessionExpiredModal />}
      {rateLimited && <RateLimitedModal />}
      <NavBar accounts={accounts} onLogin={handleLogin} onLogout={handleLogout} userRoles={userRoles} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/dashboard"
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/" />}
        />
        <Route
          path="/dayoff"
          element={isAuthenticated ? <CalendarDayOffPage /> : <Navigate to="/" />}
        />
        <Route
          path="/admin/pendingAdmin"
          element={isAuthenticated && isAdmin ? <PendingDayOffAdmin /> : <Navigate to="/" />}
        />
        <Route
          path="/admin/deleteDayOff"
          element={isAuthenticated && isAdmin ? <DeleteDayOffAdmin /> : <Navigate to="/" />}
        />
        <Route
          path="/admin/deleteWorkLog"
          element={isAuthenticated && isAdmin ? <DeleteWorkLogAdmin /> : <Navigate to="/" />}
        />
        <Route
          path="/admin/projects"
          element={isAuthenticated && isAdmin ? <AdminProjectsPage /> : <Navigate to="/" />}
        />
        <Route
          path="/admin/user-projects"
          element={isAuthenticated && isAdmin ? <AdminUserProjectsPage /> : <Navigate to="/" />}
        />
        <Route
          path="/admin/summary"
          element={isAuthenticated && isAdmin ? <SummaryAdminPage /> : <Navigate to="/" />}
        />
        <Route
          path="/admin/settings"
          element={isAuthenticated && isAdmin ? <SettingsAdmin /> : <Navigate to="/" />}
        />
        <Route
          path="/worklogs"
          element={isAuthenticated ? <WorkLogCalendarPage /> : <Navigate to="/" />}
        />
        <Route path="/profile" element={isAuthenticated ? <UserProfilePage /> : <Navigate to="/" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      {isAuthenticated && <WorkLogWidget userRoles={userRoles} />}
    </>
  );
};

export default App;