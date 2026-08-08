import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const user = await login(email, password);
      navigate(user.role === 'parent' ? '/parent' : '/teen');
    } catch {
      setError('Invalid email or password.');
    }
  }

  return (
    <div className="wrap" style={{ maxWidth: 420, margin: '80px auto' }}>
      <h2>Log in</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="email">Email</label>
        <input id="email" type="text" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label htmlFor="password">Password</label>
        <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="danger">{error}</p>}
        <button className="btn primary" type="submit" style={{ marginTop: 16 }}>
          Log in
        </button>
      </form>
    </div>
  );
}
