import { useEffect, useState, useRef } from 'react';
import type { UserDtoWithRolesAndAuthStatus } from '../interfaces/types';
import { apiURL } from '../config';
import LoadingSpinner from '../components/LoadingSpinner';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<UserDtoWithRolesAndAuthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${apiURL}/api/User/profile`, {
          method: 'GET',
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Unauthorized');
        const data = await res.json();
        setUser(data);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
    if (audioRef.current) {
      audioRef.current.volume = 0.3;
      audioRef.current.play().catch(() => {});
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!user || !user.roles || user.roles.length === 0) return null;

  return (
    <div className="p-4 mt-5 position-relative">
      <audio
        ref={audioRef}
        src="/YouAreWelcome.mp3"
        loop
        autoPlay
        muted={isMuted}
        style={{ display: 'none' }}
      />
      <h1 className="text-xl font-bold">Hello, {user.name} {user.surname}!</h1>
      <p>Email: {user.email}</p>
      <div style={{ marginTop: 32, fontSize: 18, color: '#0ea5e9', fontWeight: 'bold', textShadow: '0 2px 8px #0002' }}>
        <span role="img" aria-label="ocean">🌊</span> Welcome to your dashboard! Enjoy :D
      </div>
      <button
        onClick={() => setIsMuted(m => !m)}
        style={{ marginTop: 16, background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 20, padding: '8px 16px', fontWeight: 'bold', boxShadow: '0 2px 8px #0002', cursor: 'pointer' }}
        title={isMuted ? 'Unmute music' : 'Mute music'}
      >
        {isMuted ? '🔇 Music OFF' : '🌊 Music ON'}
      </button>
    </div>
  );
};

export default Dashboard;
