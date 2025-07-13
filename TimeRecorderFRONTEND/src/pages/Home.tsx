import React, { useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import { useNavigate } from 'react-router-dom';
import { apiURL } from '../config';
const Home: React.FC = () => {
  const { accounts } = useMsal();
  const navigate = useNavigate();

useEffect(() => {
  if (accounts.length > 0) {
    fetch(`${apiURL}/api/auth/check`, {
      credentials: 'include',
    })
    .then(res => {
      if (res.status === 200) {
        navigate('/dashboard');
      }
    });
  }
}, [accounts, navigate]);


  return (
    <div className="container mt-5">
        <h2>Welcome to TimeRecorder</h2>
        <p>Please log in to continue.</p>
    </div>
  );
};

export default Home;
