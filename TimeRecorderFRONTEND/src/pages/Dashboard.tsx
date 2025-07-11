import { useEffect, useState } from 'react';
import type { UserProfile } from '../enums/UserProfile';
import { apiURL } from '../config';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    fetch(`${apiURL}/api/auth/check`, {
      method: 'GET',
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        console.log("✅ Auth check:", data);
      })
      .catch(err => {
        console.error("❌ Auth check error:", err);
      });
  } , []);

if (!user) return <div><LoadingSpinner /></div>;

return (
  <div className="p-4 mt-5">
    <h1 className="text-xl font-bold">Hello, {user.name} {user.surname}!</h1>
    <p>Email: {user.email}</p>
  </div>
);
};

export default Dashboard;
