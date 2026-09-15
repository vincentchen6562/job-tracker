import { useState } from 'react';
import { PASSWORD_MAX, PASSWORD_MIN } from '@job-tracker/shared';
import { api } from '../utils/api';

// The login and sign-up screens, which differ only in wording and endpoint.
export default function AuthPage({ mode, onAuthenticated }) {
  const isSignup = mode === 'signup';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const account = await api('POST', isSignup ? '/auth/signup' : '/auth/login', {
        email,
        password,
      });
      onAuthenticated(account);
    } catch (failure) {
      setError(failure.message);
      setBusy(false);
    }
  }

  return (
    <div className="page auth">
      <header className="masthead auth__masthead">
        <div>
          <p className="eyebrow">Graduate job search · Auckland</p>
          <h1>Application tracker</h1>
        </div>
      </header>

      <form className="auth__form card" onSubmit={handleSubmit}>
        <h2 className="auth__title">{isSignup ? 'Create an account' : 'Log in'}</h2>

        <label className="auth__field">
          <span>Email</span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoFocus
          />
        </label>

        <label className="auth__field">
          <span>Password</span>
          <input
            type="password"
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={isSignup ? PASSWORD_MIN : undefined}
            maxLength={isSignup ? PASSWORD_MAX : undefined}
            required
          />
          {isSignup && (
            <small className="auth__hint">
              {PASSWORD_MIN}–{PASSWORD_MAX} characters. A passphrase works well.
            </small>
          )}
        </label>

        {error && (
          <p className="auth__error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn btn--primary auth__submit" disabled={busy}>
          {busy ? 'One moment…' : isSignup ? 'Sign up' : 'Log in'}
        </button>

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
      </form>
    </div>
  );
}
