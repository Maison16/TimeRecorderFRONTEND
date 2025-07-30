import { useEffect, useState, useRef } from 'react';
import type { UserDtoWithRolesAndAuthStatus } from '../interfaces/types';
import { apiURL } from '../config';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard: React.FC<{ user: UserDtoWithRolesAndAuthStatus }> = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setLoading(false);

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

  const handleMuteClick = () => {
    setIsMuted(m => {
      const newMuted = !m;
      if (audioRef.current) {
        audioRef.current.muted = newMuted;
        if (!newMuted) {
          audioRef.current.play().catch(() => {});
        } else {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
      }
      return newMuted;
    });
  };

  const quotes = [
    'Success is not the key to happiness. Happiness is the key to success.',
    'The best way to get started is to quit talking and begin doing.',
    "Don’t watch the clock; do what it does. Keep going.",
  ];
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

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
      <h1 className="text-xl font-bold">
        Hello, {user.name} {user.surname}!
      </h1>
      <p>Email: {user.email}</p>
      <div
        style={{
          marginTop: 32,
          fontSize: 18,
          color: '#0ea5e9',
          fontWeight: 'bold',
          textShadow: '0 2px 8px #0002',
        }}
      >
        <span role="img" aria-label="ocean">
          🌊
        </span>{' '}
        Welcome to your dashboard! Enjoy :D
      </div>
      <button
        onClick={handleMuteClick}
        style={{
          marginTop: 16,
          background: '#0ea5e9',
          color: '#fff',
          border: 'none',
          borderRadius: 20,
          padding: '8px 16px',
          fontWeight: 'bold',
          boxShadow: '0 2px 8px #0002',
          cursor: 'pointer',
        }}
        title={isMuted ? 'Unmute music' : 'Mute music'}
      >
        {isMuted ? '🔇 Music OFF' : '🌊 Music ON'}
      </button>
      <p
        style={{
          marginTop: 24,
          fontStyle: 'italic',
          color: '#555',
        }}
      >
        {randomQuote}
      </p>
    </div>
  );
};

export default Dashboard;
