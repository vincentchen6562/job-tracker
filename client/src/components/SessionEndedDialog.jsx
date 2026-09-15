import { useEffect, useRef } from 'react';
import AuthForm from './AuthForm';

// Asks for a login over the tracker when the session has ended, so the page
// and its unsaved edits stay put. Closing it leaves the edits held.
export default function SessionEndedDialog({ open, email, onLoggedIn, onClose }) {
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
      {open && (
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
      )}
    </dialog>
  );
}
