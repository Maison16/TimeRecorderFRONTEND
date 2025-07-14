import { useEffect, useState } from 'react';
import type { UserDtoWithRolesAndAuthStatus } from '../interfaces/types';
import { apiURL } from '../config';
import LoadingSpinner from '../components/LoadingSpinner';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<UserDtoWithRolesAndAuthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${apiURL}/api/auth/check`, {
      method: 'GET',
      credentials: 'include',
    })
      .then(async res => {
        if (res.status === 401) {
          navigate('/');
          return;
        }
        if (!res.ok) {
          throw new Error('Błąd serwera');
        }
        const data = await res.json();
        console.log("✅ Auth check:", data);

        if (data.isAuthenticated) {
          setUser({
            id: data.id,
            isAuthenticated: data.isAuthenticated,
            name: data.name ?? '',
            surname: data.surname ?? '',
            email: data.email ?? '',
            roles: data.roles || [],
          });
        } else {
          navigate('/');
        }

      })
      .catch(err => {
        console.error("❌ Auth check error:", err);
        navigate('/');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [navigate]);

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
