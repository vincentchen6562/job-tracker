import { MoneyValue } from '../common/MoneyValue.jsx';

export function BNPLApprovals({ plans, onApprove, onDecline }) {
  const pending = plans.filter((p) => p.status === 'pending_approval');

  return (
    <div className="report">
      <h4>Family advance requests</h4>
      {pending.length === 0 && <p className="sub">No pending requests.</p>}
      {pending.map((plan) => (
        <div key={plan._id} style={{ marginBottom: 14 }}>
          <div className="summary-row">
            <span>{plan.itemDescription}</span>
            <MoneyValue amount={plan.totalAmount} />
          </div>
          <p className="sub">
            Repaid over {plan.installments.length} weeks, ~
            <MoneyValue amount={plan.installments[0]?.amount ?? 0} /> each.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn primary" onClick={() => onApprove(plan._id)}>Approve</button>
            <button className="btn secondary" onClick={() => onDecline(plan._id)}>Decline</button>
          </div>
        </div>
      ))}
    </div>
  );
}
