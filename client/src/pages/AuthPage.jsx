import AuthForm from '../components/AuthForm';

// The login and sign-up screens, which differ only in wording and endpoint.
export default function AuthPage({ mode, onAuthenticated }) {
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
      </AuthForm>
    </div>
  );
}
