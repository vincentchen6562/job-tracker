import { useState } from 'react';

const CATEGORIES = ['housing', 'food', 'transport', 'utilities', 'subscriptions', 'other'];

export function CreateBillForm({ teens, onCreate }) {
  const [form, setForm] = useState({
    name: '',
    category: 'housing',
    amount: '',
    frequency: 'weekly',
    assignedTo: teens[0]?._id || '',
  });
  const [error, setError] = useState('');

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await onCreate({ ...form, amount: Number(form.amount) });
      setForm((f) => ({ ...f, name: '', amount: '' }));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create bill.');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="report">
      <h4>Add a bill / responsibility</h4>
      <label htmlFor="billName">Name</label>
      <input id="billName" value={form.name} onChange={update('name')} required />
      <div className="row2">
        <div>
          <label htmlFor="billCategory">Category</label>
          <select id="billCategory" value={form.category} onChange={update('category')}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="billAmount">Amount</label>
          <input id="billAmount" type="number" min="0" value={form.amount} onChange={update('amount')} required />
        </div>
      </div>
      {teens.length > 1 && (
        <>
          <label htmlFor="billAssignee">Assign to</label>
          <select id="billAssignee" value={form.assignedTo} onChange={update('assignedTo')}>
            {teens.map((t) => (
              <option key={t._id} value={t._id}>{t.name}</option>
            ))}
          </select>
        </>
      )}
      {error && <p className="danger">{error}</p>}
      <button className="btn primary" type="submit" style={{ marginTop: 12 }}>
        Add bill
      </button>
    </form>
  );
}
