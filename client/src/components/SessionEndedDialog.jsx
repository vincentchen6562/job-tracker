import { useEffect, useRef } from 'react';
import { DEMO_LIFETIME_HOURS } from '@job-tracker/shared';
import AuthForm from './AuthForm';

// Asks for a login over the tracker when the session has ended, so the page
// and its unsaved edits stay put. Closing it leaves the edits held. A demo
// has no email or password to log back in with, and its applications are
// deleted with it, so it is told the demo is over instead.
export default function SessionEndedDialog({
  open,
  email,
  isDemo,
  onLoggedIn,
  onDemoEnded,
  onClose,
}) {
  const dialog = useRef(null);

  useEffect(() => {
    const element = dialog.current;
    if (open && !element.open) {
      element.showModal();
      // React's autoFocus ran while the dialog was still hidden, and
      // showModal focuses the first field, but the email is already filled in.
      element.querySelector('input[type="password"]')?.focus();
    }
    if (!open && element.open) element.close();
  }, [open]);

  return (
    <dialog ref={dialog} className="form-dialog" onClose={onClose}>
      {open &&
        (isDemo ? (
          <section className="auth__form card">
            <h2 className="auth__title">This demo has ended</h2>
            <p className="auth__intro">
              A demo lasts {DEMO_LIFETIME_HOURS} hours. This one is over, so its applications
              have been deleted and your latest edits can't be saved. Start another demo, or sign
              up for an account that keeps them.
            </p>
            <button
              type="button"
              className="btn btn--primary auth__submit"
              onClick={onDemoEnded}
            >
              Back to the start
            </button>
          </section>
        ) : (
          <AuthForm
            mode="login"
            title="Log in to keep saving"
            intro="Your session has ended, so your latest edits haven't been saved. They're held on this page until you log back in. Logging in to a different account discards them."
            initialEmail={email}
            onAuthenticated={onLoggedIn}
          >
            <button type="button" className="btn btn--quiet" onClick={onClose}>
              Not now
            </button>
          </AuthForm>
        ))}
    </dialog>
  );
}
