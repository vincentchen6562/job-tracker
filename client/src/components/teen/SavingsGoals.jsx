import { useState } from 'react';
import { Card } from '../common/Card.jsx';
import { ProgressBar } from '../common/ProgressBar.jsx';
import { MoneyValue } from '../common/MoneyValue.jsx';
import { createGoal } from '../../services/householdService.js';

export function SavingsGoals({ goals, onGoalCreated }) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const goal = await createGoal({ name, targetAmount: Number(targetAmount) });
      onGoalCreated(goal);
      setName('');
      setTargetAmount('');
      setShowForm(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create goal.');
    }
  }

  return (
    <Card>
      <h4>Savings goals</h4>
      {goals.length === 0 && <p className="sub">No goals yet — what are you saving for?</p>}
      {goals.map((goal) => (
        <div key={goal._id} style={{ marginBottom: 14 }}>
          <div className="summary-row">
            <span>{goal.name}</span>
            <span><MoneyValue amount={goal.currentAmount} /> / <MoneyValue amount={goal.targetAmount} /></span>
          </div>
          <ProgressBar value={goal.currentAmount} max={goal.targetAmount} />
        </div>
      ))}

      {showForm ? (
        <form onSubmit={handleSubmit}>
          <label htmlFor="goalName">Goal</label>
          <input id="goalName" value={name} onChange={(e) => setName(e.target.value)} required />
          <label htmlFor="goalTarget">Target amount</label>
          <input
            id="goalTarget"
            type="number"
            min="1"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            required
          />
          {error && <p className="danger">{error}</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button className="btn primary" type="submit">Save goal</button>
            <button className="btn secondary" type="button" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      ) : (
        <button className="btn secondary" onClick={() => setShowForm(true)}>
          + New goal
        </button>
      )}
    </Card>
  );
}
