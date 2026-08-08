import { Card } from '../common/Card.jsx';
import { ProgressBar } from '../common/ProgressBar.jsx';
import { MoneyValue } from '../common/MoneyValue.jsx';

export function SavingsGoals({ goals, onCreate }) {
  return (
    <Card>
      <h4>Savings goals</h4>
      {goals.map((goal) => (
        <div key={goal._id} style={{ marginBottom: 14 }}>
          <div className="summary-row">
            <span>{goal.name}</span>
            <span><MoneyValue amount={goal.currentAmount} /> / <MoneyValue amount={goal.targetAmount} /></span>
          </div>
          <ProgressBar value={goal.currentAmount} max={goal.targetAmount} />
        </div>
      ))}
      {onCreate && (
        <button className="btn secondary" onClick={onCreate}>
          + New goal
        </button>
      )}
    </Card>
  );
}
