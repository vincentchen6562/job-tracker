import { useRef, useState } from 'react';
import { DEMO_LIFETIME_HOURS, PASSWORD_MAX, PASSWORD_MIN } from '@job-tracker/shared';
import { api } from '../utils/api';

// Where an account holder changes their password or deletes their account.
// `waitForSaves()` resolves once no edit is still on its way to the server.
// `onSessionEnded` is told when a request finds the session over, so the
// login dialog opens; `onDeleted` once the account is gone.
export default function AccountPage({
  account,
  applicationCount,
  onDownloadBackup,
  waitForSaves,
  onSessionEnded,
  onDeleted,
}) {
  return (
    <div className="detail-page account-page">
      <a className="back-link" href="#/">
        ← All applications
      </a>

      <h2 className="account-page__title">Account</h2>

      {account.isDemo ? (
        <>
          <p className="account-page__email">You're trying the demo.</p>
          <SignUpInstead onDownloadBackup={onDownloadBackup} />
        </>
      ) : (
        <>
          <p className="account-page__email">Logged in as {account.email}</p>

          <ChangePassword accountId={account.id} onSessionEnded={onSessionEnded} />
          <DeleteAccount
            account={account}
            applicationCount={applicationCount}
            onDownloadBackup={onDownloadBackup}
            waitForSaves={waitForSaves}
            onSessionEnded={onSessionEnded}
            onDeleted={onDeleted}
          />
        </>
      )}
    </div>
  );
}

// A demo has no password to change and deletes itself, so the settings a real
// account has are replaced by the way out of the demo (ADR-0005).
function SignUpInstead({ onDownloadBackup }) {
  return (
    <section className="auth__form card">
      <h3 className="auth__title">Sign up for a real account</h3>
      <p className="auth__intro">
        This demo account and everything in it are deleted {DEMO_LIFETIME_HOURS} hours after it
        was made. A real account keeps your applications, on every device you log in on. It
        starts empty: the ones in this demo don't carry over, so download a backup first if you
        want them.
      </p>
      <div className="account-page__demo-actions">
        <button type="button" className="btn" onClick={onDownloadBackup}>
          Download backup
        </button>
        <a className="btn btn--primary" href="#/signup">
          Sign up
        </a>
      </div>
    </section>
  );
}

function ChangePassword({ accountId, onSessionEnded }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [changed, setChanged] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setChanged(false);
    try {
      await api('PUT', '/auth/password', { currentPassword, newPassword }, { accountId });
      setCurrentPassword('');
      setNewPassword('');
      setChanged(true);
    } catch (failure) {
      if (failure.kind === 'unauthenticated') onSessionEnded();
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="auth__form card" onSubmit={handleSubmit}>
      <h3 className="auth__title">Change password</h3>

      <label className="auth__field">
        <span>Current password</span>
        <input
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          required
        />
      </label>

      <label className="auth__field">
        <span>New password</span>
        <input
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          minLength={PASSWORD_MIN}
          maxLength={PASSWORD_MAX}
          required
        />
        <small className="auth__hint">
          {PASSWORD_MIN}–{PASSWORD_MAX} characters. Every other device you're logged in on
          will be logged out.
        </small>
      </label>

      {error && (
        <p className="auth__error" role="alert">
          {error}
        </p>
      )}
      {changed && (
        <p className="auth__success" role="status">
          Password changed. Every other device has been logged out.
        </p>
      )}

      <button type="submit" className="btn btn--primary auth__submit" disabled={busy}>
        {busy ? 'One moment…' : 'Change password'}
      </button>
    </form>
  );
}

// A button, then a confirmation that asks for the password and offers a
// backup first, since deleting can't be undone.
function DeleteAccount({
  account,
  applicationCount,
  onDownloadBackup,
  waitForSaves,
  onSessionEnded,
  onDeleted,
}) {
  const dialog = useRef(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const applicationsText = `${applicationCount} ${
    applicationCount === 1 ? 'application' : 'applications'
  }`;

  function openConfirmation() {
    setPassword('');
    setError('');
    dialog.current.showModal();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      // A save landing after the account is gone would create an application
      // with no account, so nothing may still be on its way.
      await waitForSaves();
      await api('DELETE', '/auth/account', { password }, { accountId: account.id });
      onDeleted();
    } catch (failure) {
      setBusy(false);
      if (failure.kind === 'unauthenticated') {
        // The login dialog takes over; this one would sit on top of it.
        dialog.current.close();
        onSessionEnded();
        return;
      }
      setError(failure.message);
    }
  }

  return (
    <section className="auth__form card">
      <h3 className="auth__title">Delete account</h3>
      <p className="auth__intro">
        Deletes your account and the {applicationsText} in it. This can't be undone.
      </p>
      <div>
        <button type="button" className="btn btn--danger" onClick={openConfirmation}>
          Delete account…
        </button>
      </div>

      <dialog ref={dialog} className="form-dialog">
        <form className="auth__form card" onSubmit={handleSubmit}>
          <h2 className="auth__title">Delete your account?</h2>
          <p className="auth__intro">
            This deletes {account.email} and the {applicationsText} in it straight away, and
            can't be undone. Download a backup first if you might want them again.
          </p>

          <button type="button" className="btn" onClick={onDownloadBackup}>
            Download backup
          </button>

          <label className="auth__field">
            <span>Password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          {error && (
            <p className="auth__error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="btn btn--danger auth__submit" disabled={busy}>
            {busy ? 'Deleting…' : 'Delete account'}
          </button>
          <button type="button" className="btn btn--quiet" onClick={() => dialog.current.close()}>
            Cancel
          </button>
        </form>
      </dialog>
    </section>
  );
}
