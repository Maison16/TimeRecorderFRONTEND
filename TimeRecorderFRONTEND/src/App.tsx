import React, { useState, useEffect } from 'react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig } from './auth/AuthConfig';
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

const msalInstance = new PublicClientApplication(msalConfig);

const App: React.FC = () => {
  const { instance, accounts } = useMsal();
  const navigate = useNavigate();
  const isAuthenticated = useIsAuthenticated();

  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [isLoadingUserRoles, setIsLoadingUserRoles] = useState(true);

  //Funkcja do pobierania ról z backendu 
  const fetchUserRoles = async () => {
    try {
      setIsLoadingUserRoles(true);
      const response = await axios.get(`${apiURL}/api/auth/check`, { withCredentials: true });

      if (response.data && response.data.roles) {
        setUserRoles(response.data.roles);
      } else {
        setUserRoles([]);
      }
    } catch (error) {
      console.error("Error fetching user roles from backend:", error);
      setUserRoles([]);
    } finally {
      setIsLoadingUserRoles(false);
    }
  };

  //Efekt do pobierania ról po zalogowaniu
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserRoles();
    }
    else {
      setUserRoles([]);
      setIsLoadingUserRoles(false);
    }
  }, [isAuthenticated]);

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

  const isAdmin = userRoles.includes("Admin");

  //Obsługa stanu ładowania ról
  if (isAuthenticated && isLoadingUserRoles) {
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
          path="/pendingAdmin"
          element={isAuthenticated && isAdmin ? <PendingDayOffAdmin /> : <Navigate to="/" />}
        />
        .
        <Route
          path="/deleteDayOff"
          element={isAuthenticated && isAdmin ? <DeleteDayOffAdmin /> : <Navigate to="/" />}
        />
        <Route
          path="/admin/projects"
          element={isAuthenticated && isAdmin ? <AdminProjectsPage /> : <Navigate to="/" />}
        />
        <Route
          path="/admin/user-projects"
          element={isAuthenticated && isAdmin ? <AdminUserProjectsPage /> : <Navigate to="/" />}
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
};

export default App;