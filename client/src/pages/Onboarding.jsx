import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerHousehold } from '../services/authService.js';
import { useAuth } from '../context/AuthContext.jsx';

export function Onboarding() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ householdName: '', parentName: '', email: '', password: '' });

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    await registerHousehold(form);
    await login(form.email, form.password);
    navigate('/parent');
  }

  return (
    <div className="wrap" style={{ maxWidth: 480, margin: '80px auto' }}>
      <h2>Create your household</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="householdName">Household name</label>
        <input id="householdName" value={form.householdName} onChange={update('householdName')} />
        <label htmlFor="parentName">Your name</label>
        <input id="parentName" value={form.parentName} onChange={update('parentName')} />
        <label htmlFor="email">Email</label>
        <input id="email" type="email" value={form.email} onChange={update('email')} />
        <label htmlFor="password">Password</label>
        <input id="password" type="password" value={form.password} onChange={update('password')} />
        <button className="btn primary" type="submit" style={{ marginTop: 16 }}>
          Create household
        </button>
      </form>
    </div>
  );
}
