import { useState } from 'react';
import { DEMO_LIFETIME_HOURS } from '@job-tracker/shared';
import AuthForm from '../components/AuthForm';
import { api } from '../utils/api';

// The login and sign-up screens, which differ only in wording and endpoint.
// `fromDemo` is set when a visitor is signing up from inside a demo, which is
// the one time the sign-up screen is reached while already logged in.
export default function AuthPage({ mode, fromDemo = false, onAuthenticated }) {
  const isSignup = mode === 'signup';

  return (
    <div className="page auth">
      <header className="masthead auth__masthead">
        <div>
          <p className="eyebrow">Graduate job search · Auckland</p>
          <h1>Application tracker</h1>
        </div>
      </header>

      <AuthForm
        mode={mode}
        title={isSignup ? 'Create an account' : 'Log in'}
        intro={
          fromDemo
            ? "A real account keeps your applications for good. It starts empty: the ones in the demo don't carry over."
            : undefined
        }
        onAuthenticated={onAuthenticated}
      >
        <p className="auth__switch">
          {isSignup ? (
            <>
              Already have an account? <a href="#/login">Log in</a>
            </>
          ) : (
            <>
              No account yet? <a href="#/signup">Sign up</a>
            </>
          )}
        </p>

        {!isSignup && <TryTheDemo onAuthenticated={onAuthenticated} />}
      </AuthForm>
    </div>
  );
}

// No sign-up at all: the visitor gets a temporary account of their own, with
// the seed data already in it, and is logged straight in (ADR-0005).
function TryTheDemo({ onAuthenticated }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function startDemo() {
    setBusy(true);
    setError('');
    try {
      onAuthenticated(await api('POST', '/auth/demo'));
    } catch (failure) {
      setError(failure.message);
      setBusy(false);
    }
  }

  return (
    <div className="auth__demo">
      <p className="auth__or">or</p>

      <button type="button" className="btn auth__submit" onClick={startDemo} disabled={busy}>
        {busy ? 'Starting the demo…' : 'Try the demo'}
      </button>
      <small className="auth__hint">
        No sign-up. You get a tracker of your own, filled with example applications and deleted{' '}
        {DEMO_LIFETIME_HOURS} hours later.
      </small>

      {error && (
        <p className="auth__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
