import { useState } from 'react';
import { requestBNPLPlan } from '../../services/householdService.js';
import { MoneyValue } from '../common/MoneyValue.jsx';

export function BNPLSimulator() {
  const [itemDescription, setItemDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);
  const [plan, setPlan] = useState(null);

  async function requestPlan() {
    const data = await requestBNPLPlan({ itemDescription, totalAmount: Number(totalAmount), numberOfInstallments: 4 });
    setPlan(data);
  }

  return (
    <div className="report">
      <h4>Family advance ("Pay in 4") simulation</h4>
      <p className="sub">This uses part of your future money — it is not real credit.</p>
      <label htmlFor="bnplItem">Item</label>
      <input id="bnplItem" type="text" value={itemDescription} onChange={(e) => setItemDescription(e.target.value)} />
      <label htmlFor="bnplAmount">Total amount</label>
      <input id="bnplAmount" type="number" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} />
      <button className="btn primary" style={{ marginTop: 10 }} onClick={requestPlan}>
        Ask parent to approve
      </button>
      {plan && (
        <ul style={{ marginTop: 12 }}>
          {plan.installments.map((i, idx) => (
            <li key={idx}>
              Week {idx + 1}: <MoneyValue amount={-i.amount} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
