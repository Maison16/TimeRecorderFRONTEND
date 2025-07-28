import React, { useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import { useNavigate } from 'react-router-dom';
import { apiURL } from '../config';
const Home: React.FC = () => {

  return (
    <div className="container mt-5">
        <h2>Welcome to TimeRecorder</h2>
        <p>Please log in to continue.</p>
    </div>
  );
};

export default Home;
