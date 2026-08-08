import { Card } from '../common/Card.jsx';
import { MoneyValue } from '../common/MoneyValue.jsx';

export function WeeklyOverview({ weeklyDeposit, billsTotal, savingsTarget, safeToSpend, outstanding }) {
  return (
    <Card className="account-card">
      <h3>This week's overview</h3>
      <div className="summary-row"><span>Weekly deposit</span><MoneyValue amount={weeklyDeposit} /></div>
      <div className="summary-row"><span>Bills and responsibilities</span><MoneyValue amount={billsTotal} /></div>
      <div className="summary-row"><span>Savings progress target</span><MoneyValue amount={savingsTarget} /></div>
      <div className="summary-row"><span>Safe-to-spend</span><MoneyValue amount={safeToSpend} /></div>
      <div className="summary-row"><span>Outstanding commitments</span><MoneyValue amount={outstanding} /></div>
    </Card>
  );
}
