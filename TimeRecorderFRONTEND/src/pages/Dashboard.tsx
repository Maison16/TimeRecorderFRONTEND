import { useEffect, useState } from 'react'
import type { UserProfile } from '../interfaces/UserProfile'
import { apiURL } from '../config'

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null)

useEffect(() => {
  const token = localStorage.getItem('access_token');
  console.log('Access token:', token);
  if (!token) return;

  fetch(`${apiURL}/api/User/profile`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
  .then(async res => {
    console.log('Response status:', res.status);
    if (!res.ok) {
      const errorBody = await res.text();
      console.error('Error body:', errorBody);
      throw new Error('Not authorized');
    }
    return res.json();
  })
  .then(data => setUser(data))
  .catch(err => console.error('Fetch error:', err));
  console.log('Access token:', token);
}, []);



  if (!user) return <div>Loading user data...</div>

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Hello, {user.name} {user.surname}!</h1>
      <p>Email: {user.email}</p>
    </div>
  )
}

export default Dashboard
