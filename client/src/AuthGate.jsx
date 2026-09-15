import { useEffect, useState } from 'react';
import App from './App';
import AuthPage from './pages/AuthPage';
import { useHashRoute } from './hooks/useHashRoute';
import { api } from './utils/api';

const AUTH_ROUTES = ['login', 'signup'];

// Decides between the tracker and the login screens. Nothing renders until
// the server has said whether this browser is logged in, so the wrong screen
// never flashes up first.
export default function AuthGate() {
  const route = useHashRoute();
  // undefined while checking, null when logged out.
  const [account, setAccount] = useState(undefined);
  const [checkError, setCheckError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api('GET', '/auth/me')
      .then((current) => {
        if (!cancelled) setAccount(current);
      })
      .catch((error) => {
        if (cancelled) return;
        if (error.kind === 'unauthenticated') setAccount(null);
        else setCheckError(error);
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const onAuthRoute = AUTH_ROUTES.includes(route.name);

  // Replacing rather than pushing, so Back doesn't return to a screen that
  // would only redirect again.
  useEffect(() => {
    if (account === null && !onAuthRoute) window.location.replace('#/login');
    if (account && onAuthRoute) window.location.replace('#/');
  }, [account, onAuthRoute]);

  async function logOut() {
    await api('POST', '/auth/logout');
    setAccount(null);
  }

  if (checkError) {
    return (
      <div className="page">
        <p className="flash flash--warn" role="alert">
          <span>{checkError.message}</span>
          <button
            type="button"
            className="btn"
            onClick={() => {
              setCheckError(null);
              setAttempt((count) => count + 1);
            }}
          >
            Try again
          </button>
        </p>
      </div>
    );
  }

  if (account === undefined) return null;

  if (account === null) {
    return onAuthRoute ? (
      <AuthPage key={route.name} mode={route.name} onAuthenticated={setAccount} />
    ) : null;
  }

  return onAuthRoute ? null : <App account={account} onLogout={logOut} />;
}
