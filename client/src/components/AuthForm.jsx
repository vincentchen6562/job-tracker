import { useState } from 'react';
import { PASSWORD_MAX, PASSWORD_MIN } from '@job-tracker/shared';
import { api } from '../utils/api';

// The email and password form, shared by the login and sign-up screens and
// the dialog for logging back in. `children` go below the submit button.
export default function AuthForm({
  mode,
  title,
  intro,
  initialEmail = '',
  onAuthenticated,
  children,
}) {
  const isSignup = mode === 'signup';
  const [email, setEmail] = useState(initialEmail);
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
    <form className="auth__form card" onSubmit={handleSubmit}>
      <h2 className="auth__title">{title}</h2>
      {intro && <p className="auth__intro">{intro}</p>}

      <label className="auth__field">
        <span>Email</span>
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          autoFocus={!initialEmail}
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
          autoFocus={Boolean(initialEmail)}
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

      {children}
    </form>
  );
}
