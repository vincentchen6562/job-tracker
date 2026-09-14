// Minimal hash-based router. No dependency needed for two routes, and hash
// links keep working when the built app is opened straight from disk or
// hosted under a sub-path (see vite.config.js base: './').

import { useEffect, useState } from 'react';

function parseHash() {
  const hash = window.location.hash.replace(/^#/, '') || '/';
  const match = hash.match(/^\/app\/(.+)$/);
  if (match) return { name: 'detail', id: decodeURIComponent(match[1]) };
  return { name: 'home' };
}

export function useHashRoute() {
  const [route, setRoute] = useState(parseHash);

  useEffect(() => {
    function onHashChange() {
      setRoute(parseHash());
    }
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return route;
}
