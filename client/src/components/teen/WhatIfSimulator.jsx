import { useState } from 'react';
import { simulatePurchase } from '../../services/householdService.js';
import { MoneyValue } from '../common/MoneyValue.jsx';

export function WhatIfSimulator({ balance, unpaidBills, savingsTarget }) {
  const [itemCost, setItemCost] = useState(0);
  const [result, setResult] = useState(null);

  async function runSimulation() {
    const data = await simulatePurchase({ balance, unpaidBills, savingsTarget, itemCost: Number(itemCost) });
    setResult(data);
  }

  return (
    <div className="report">
      <h4>What-if simulator</h4>
      <label htmlFor="itemCost">If I buy this for...</label>
      <input id="itemCost" type="number" value={itemCost} onChange={(e) => setItemCost(e.target.value)} />
      <button className="btn primary" style={{ marginTop: 10 }} onClick={runSimulation}>
        See the impact
      </button>
      {result && (
        <div style={{ marginTop: 12 }}>
          <div className="summary-row"><span>New balance</span><MoneyValue amount={result.newBalance} /></div>
          <div className="summary-row"><span>New safe-to-spend</span><MoneyValue amount={result.newSafeToSpend} /></div>
          {result.goalDelayWeeks != null && (
            <div className="summary-row"><span>Goal delay</span><span>{result.goalDelayWeeks} week(s)</span></div>
          )}
        </div>
      )}
    </div>
  );
}
