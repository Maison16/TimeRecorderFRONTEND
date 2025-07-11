import React from 'react';
import { useMsal } from '@azure/msal-react';
import NavBar from './components/MyNavbar';
import { Routes, Route, useNavigate } from 'react-router-dom'; 
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import CalendarDayOffPage from './pages/CalendarDayOffPage'; 

const App: React.FC = () => {
  const { instance, accounts } = useMsal();
  const navigate = useNavigate(); 

  const handleLogin = () => {
    instance.loginPopup({
      scopes: ['api://8b8a49ef-3242-4695-985d-9a7eb39071ae/TimeRecorderBACKEND.all'],
      prompt: 'consent'
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
          // Wysyłamy token na backend, który ustawi ciasteczko HttpOnly
          await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: tokenResponse.accessToken }),
            credentials: 'include',  // ważne, żeby przeglądarka obsłużyła cookies
          });

          console.log('Login successful, backend should set HttpOnly cookie');
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
    // Wywołaj endpoint logout na backendzie, który usunie ciasteczko
    fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    }).then(() => {
      instance.logoutRedirect({
        postLogoutRedirectUri: "/",
        onRedirectNavigate: () => false,
      });
      navigate('/');
    });
  };

  return (
    <>
      <NavBar accounts={accounts} onLogin={handleLogin} onLogout={handleLogout} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dayoff" element={<CalendarDayOffPage />} />
      </Routes>
    </>
  );
};

export default App;
