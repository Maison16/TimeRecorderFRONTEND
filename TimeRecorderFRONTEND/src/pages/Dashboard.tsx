import { useEffect, useState } from 'react';
import type { UserDtoWithRolesAndAuthStatus } from '../interfaces/types';
import { apiURL } from '../config';
import LoadingSpinner from '../components/LoadingSpinner';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<UserDtoWithRolesAndAuthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();


  if (loading) return <LoadingSpinner />;
  if (!user || !user.roles || user.roles.length === 0) return null;


  return (
    <div className="p-4 mt-5">
      <h1 className="text-xl font-bold">Hello, {user.name} {user.surname}!</h1>
      <p>Email: {user.email}</p>
    </div>
  );
};

export default Dashboard;
