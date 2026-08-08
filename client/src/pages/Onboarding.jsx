import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerHousehold } from '../services/authService.js';
import { useAuth } from '../context/AuthContext.jsx';

export function Onboarding() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ householdName: '', parentName: '', email: '', password: '' });
  const [error, setError] = useState('');

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await registerHousehold(form);
      await login(form.email, form.password);
      navigate('/parent');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create household.');
    }
  }

  return (
    <div className="wrap" style={{ maxWidth: 480, margin: '80px auto' }}>
      <h2>Create your household</h2>
      <p className="sub">
        This creates your parent login. Once you're in, invite your teen from the parent
        dashboard — they don't sign up themselves.
      </p>
      <form onSubmit={handleSubmit}>
        <label htmlFor="householdName">Household name</label>
        <input id="householdName" value={form.householdName} onChange={update('householdName')} required />
        <label htmlFor="parentName">Your name</label>
        <input id="parentName" value={form.parentName} onChange={update('parentName')} required />
        <label htmlFor="email">Email</label>
        <input id="email" type="email" value={form.email} onChange={update('email')} required />
        <label htmlFor="password">Password</label>
        <input id="password" type="password" value={form.password} onChange={update('password')} required minLength={8} />
        {error && <p className="danger">{error}</p>}
        <button className="btn primary" type="submit" style={{ marginTop: 16 }}>
          Create household
        </button>
      </form>
      <p className="sub" style={{ marginTop: 16 }}>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}
