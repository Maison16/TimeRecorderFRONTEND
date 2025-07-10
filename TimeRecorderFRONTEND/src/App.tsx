import React from 'react';
import { useMsal } from '@azure/msal-react';
import NavBar from './components/MyNavbar';
import { Routes, Route, useNavigate } from 'react-router-dom'; 
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';

const App: React.FC = () => {
  const { instance, accounts } = useMsal();
  const navigate = useNavigate(); 

const handleLogin = () => {
  instance.loginPopup({
    scopes: ['api://8b8a49ef-3242-4695-985d-9a7eb39071ae/TimeRecorderBACKEND.all'],
  })
    .then(async (response) => {
      const account = response.account;

      if (account) {
        try {
          const tokenResponse = await instance.acquireTokenSilent({
            account,
            scopes: ['api://8b8a49ef-3242-4695-985d-9a7eb39071ae/TimeRecorderBACKEND.all'],
          });

          localStorage.setItem('access_token', tokenResponse.accessToken);
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
  localStorage.removeItem('access_token'); 
  instance.logoutRedirect({
    postLogoutRedirectUri: "/",
    onRedirectNavigate: () => false
  });
  navigate('/'); 
};


  return (
    <>
      <NavBar accounts={accounts} onLogin={handleLogin} onLogout={handleLogout} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        
      </Routes>
    </>
  );
};

export default App;
