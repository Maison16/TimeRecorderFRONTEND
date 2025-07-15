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
import SyncUsersAdmin from './pages/admin/SyncUserAdmin';
import WorkLogWidget from './components/WorkStatusWidget';
import WorkLogCalendarPage from './pages/WorkLogCalendarPage';
import DeleteWorkLogAdmin from './pages/admin/DeleteWorkLogAdmin';
import SummaryAdminPage from './pages/admin/SummaryAdminPage';

const App: React.FC = () => {
  const { instance, accounts } = useMsal();
  const navigate = useNavigate();
  const isAuthenticated = useIsAuthenticated();
  const { inProgress } = useMsal();
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [isLoadingUserRoles, setIsLoadingUserRoles] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const fetchUserRoles = async () => {
    try {
      setIsLoadingUserRoles(true);
      const response = await axios.get(`${apiURL}/api/auth/check`, { withCredentials: true });

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
    if (isAuthenticated) {
      fetchUserRoles();
    }
    else {
      setUserRoles([]);
      setIsLoadingUserRoles(false);
    }
  }, [isAuthenticated]);
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      response => response,
      error => {
        if (
          error.response &&
          error.response.status === 401 &&
          isAuthenticated &&
          !isLoadingUserRoles
        ) {
          handleLogout();
        }
        return Promise.reject(error);
      }
    );
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [isAuthenticated, isLoadingUserRoles]);
  const handleLogin = () => {
    instance.loginPopup({
      scopes: ['api://8b8a49ef-3242-4695-985d-9a7eb39071ae/TimeRecorderBACKEND.all']
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

  if (isLoadingUserRoles || inProgress !== "none" || isAdmin === null) {
    return <Loading />;
  }

  return (
    <>
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
          path="/admin/sync-users"
          element={isAuthenticated && isAdmin ? <SyncUsersAdmin /> : <Navigate to="/" />}
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