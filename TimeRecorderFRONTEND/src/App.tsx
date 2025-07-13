import React, { useState, useEffect } from 'react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { PublicClientApplication } from '@azure/msal-browser'; // Potrzebne do `msalInstance`
import { msalConfig } from './auth/AuthConfig'; // Upewnij się, że to ścieżka do Twojej konfiguracji MSAL
import axios from 'axios';
import { apiURL } from './config'; // Upewnij się, że to ścieżka do Twojego apiURL

import NavBar from './components/MyNavbar'; // Zakładam, że Twoja nazwa to MyNavbar
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import CalendarDayOffPage from './pages/CalendarDayOffPage';
import AdminPanel from './pages/AdminPanel'; // Nowy komponent strony Admin Panel
import Loading from './components/LoadingSpinner'; // Załóżmy, że masz komponent Loading

const msalInstance = new PublicClientApplication(msalConfig); // Musisz zdefiniować instancję MSAL tutaj

const App: React.FC = () => {
  const { instance, accounts } = useMsal();
  const navigate = useNavigate();
  const isAuthenticated = useIsAuthenticated(); // Hook do sprawdzania, czy użytkownik jest zalogowany

  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [isLoadingUserRoles, setIsLoadingUserRoles] = useState(true);

  // --- Funkcja do pobierania ról z backendu ---
  const fetchUserRoles = async () => {
    try {
      setIsLoadingUserRoles(true);
      const response = await axios.get(`${apiURL}/api/auth/check`, { withCredentials: true });

      if (response.data && response.data.roles) {
        setUserRoles(response.data.roles);
      } else {
        setUserRoles([]); // Upewnij się, że roles są puste, jeśli backend nic nie zwróci
      }
    } catch (error) {
      console.error("Error fetching user roles from backend:", error);
      setUserRoles([]); // W przypadku błędu role są puste
    } finally {
      setIsLoadingUserRoles(false);
    }
  };

  // --- Efekt do pobierania ról po zalogowaniu ---
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserRoles();
    } else {
      // Resetuj stan ról i ładowania, gdy użytkownik nie jest zalogowany
      setUserRoles([]);
      setIsLoadingUserRoles(false);
    }
  }, [isAuthenticated]); // Wywołaj ten efekt, gdy zmieni się stan uwierzytelnienia

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

  // Sprawdzenie roli Admin
  const isAdmin = userRoles.includes("Admin");

  // --- Obsługa stanu ładowania ról ---
  // Jeśli użytkownik jest zalogowany i role są jeszcze ładowane, wyświetl komponent Loading
  if (isAuthenticated && isLoadingUserRoles) {
    return <Loading />;
  }

  return (
    <>
      {/* Przekazujemy userRoles do NavBar */}
      <NavBar accounts={accounts} onLogin={handleLogin} onLogout={handleLogout} userRoles={userRoles} />
      <Routes>
        <Route path="/" element={<Home />} />
        
        {/* Zabezpieczenie tras */}
        <Route 
          path="/dashboard" 
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/" />} 
        />
        <Route 
          path="/dayoff" 
          element={isAuthenticated ? <CalendarDayOffPage /> : <Navigate to="/" />} 
        />
        <Route 
          path="/admin" 
          element={isAuthenticated && isAdmin ? <AdminPanel /> : <Navigate to="/" />} 
        />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
};

export default App;