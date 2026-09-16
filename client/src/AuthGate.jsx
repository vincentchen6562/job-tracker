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
  const [notice, setNotice] = useState('');

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
  // A demo account is the one kind allowed onto the sign-up screen while
  // logged in: signing up is how a visitor turns the demo into an account
  // that keeps their applications (ADR-0005).
  const leavingDemo = Boolean(account?.isDemo) && route.name === 'signup';

  // Replacing rather than pushing, so Back doesn't return to a screen that
  // would only redirect again.
  useEffect(() => {
    if (account === null && !onAuthRoute) window.location.replace('#/login');
    if (account && onAuthRoute && !leavingDemo) window.location.replace('#/');
  }, [account, onAuthRoute, leavingDemo]);

  async function logOut() {
    await api('POST', '/auth/logout');
    setNotice('');
    setAccount(null);
  }

  // Deleting the account ended its sessions, so it's back to logging in.
  function accountDeleted() {
    setNotice('');
    setAccount(null);
  }

  // Logging in to another account after the session ended. The tracker is
  // keyed by account, so the old one closes with its held edits and they're
  // never saved to this account.
  function switchAccount(next, { discardedEdits }) {
    setNotice(
      discardedEdits
        ? `You're now logged in as ${next.email}. Edits that hadn't been saved to ${account.email} were discarded.`
        : '',
    );
    setAccount(next);
    // An open application belonged to the old account.
    window.location.replace('#/');
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

  // The demo is still open behind this; signing up swaps it for the new
  // account, and its unsaved edits go with it.
  if (leavingDemo) {
    return <AuthPage key="signup-from-demo" mode="signup" fromDemo onAuthenticated={setAccount} />;
  }

  return onAuthRoute ? null : (
    <App
      key={account.id}
      account={account}
      onLogout={logOut}
      onAccountDeleted={accountDeleted}
      onSwitchAccount={switchAccount}
      notice={notice}
      onDismissNotice={() => setNotice('')}
    />
  );
}
