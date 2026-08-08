import { useState } from 'react';

export function InviteTeenForm({ onInvite }) {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    try {
      await onInvite(form);
      setForm({ name: '', email: '', password: '' });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create teen login.');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="report">
      <h4>Invite your teen</h4>
      <p className="sub">Creates a separate login your teen uses to see their own dashboard.</p>
      <label htmlFor="teenName">Teen's name</label>
      <input id="teenName" value={form.name} onChange={update('name')} required />
      <label htmlFor="teenEmail">Email</label>
      <input id="teenEmail" type="email" value={form.email} onChange={update('email')} required />
      <label htmlFor="teenPassword">Password</label>
      <input id="teenPassword" type="password" value={form.password} onChange={update('password')} required minLength={8} />
      {error && <p className="danger">{error}</p>}
      {success && <p className="safe">Teen login created.</p>}
      <button className="btn primary" type="submit" style={{ marginTop: 12 }}>
        Create teen login
      </button>
    </form>
  );
}
