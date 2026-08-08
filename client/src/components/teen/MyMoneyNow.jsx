import { Card } from '../common/Card.jsx';
import { MoneyValue } from '../common/MoneyValue.jsx';
import { ProgressBar } from '../common/ProgressBar.jsx';

export function MyMoneyNow({ balance, unpaidBills, savingsTarget, safeToSpend, carryMessage }) {
  return (
    <Card className="account-card">
      <div className="headline-money">
        <div>
          <div className="sub">Bank balance</div>
          <div className="big"><MoneyValue amount={balance} /></div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="sub">Safe to spend</div>
          <div className="big safe"><MoneyValue amount={Math.max(0, safeToSpend)} /></div>
        </div>
      </div>
      <ProgressBar value={Math.max(0, safeToSpend)} max={balance} />
      <div className="sub">{carryMessage}</div>
      <div className="summary-row"><span>Upcoming bills</span><MoneyValue amount={-unpaidBills} /></div>
      <div className="summary-row"><span>Savings commitment</span><MoneyValue amount={-savingsTarget} /></div>
    </Card>
  );
}
