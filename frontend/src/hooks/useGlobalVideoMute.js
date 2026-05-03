import { useEffect, useState } from 'react';

const STORAGE_KEY = 'globalVideoMuted';

const readInitialMute = () => {
  if (typeof window === 'undefined') return true;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === null) return true;
  return stored === 'true';
};

const useGlobalVideoMute = () => {
  const [isMuted, setIsMuted] = useState(readInitialMute);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, String(isMuted));
  }, [isMuted]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== STORAGE_KEY) return;
      setIsMuted(event.newValue !== 'false');
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return [isMuted, setIsMuted];
};

export default useGlobalVideoMute;
