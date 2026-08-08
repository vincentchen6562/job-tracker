import { useCallback, useEffect, useState } from 'react';
import { useHousehold } from '../context/HouseholdContext.jsx';
import { getBills, payBill, getGoals } from '../services/householdService.js';
import { getSummary, createSpend } from '../services/transactionsService.js';
import { MyMoneyNow } from '../components/teen/MyMoneyNow.jsx';
import { BillsList } from '../components/teen/BillsList.jsx';
import { SavingsGoals } from '../components/teen/SavingsGoals.jsx';
import { WhatIfSimulator } from '../components/teen/WhatIfSimulator.jsx';
import { BNPLSimulator } from '../components/teen/BNPLSimulator.jsx';
import { PracticeZone } from '../components/teen/PracticeZone.jsx';
import { AICoachWidget } from '../components/teen/AICoachWidget.jsx';

export function TeenDashboard() {
  const { household } = useHousehold();
  const [bills, setBills] = useState([]);
  const [goals, setGoals] = useState([]);
  const [summary, setSummary] = useState({ balance: 0, unpaidBills: 0, savingsTarget: 0, safeToSpend: 0 });
  const [spendError, setSpendError] = useState('');

  const refresh = useCallback(async () => {
    const [billsData, summaryData] = await Promise.all([getBills(), getSummary()]);
    setBills(billsData);
    setSummary(summaryData);
  }, []);

  useEffect(() => {
    refresh();
    getGoals().then(setGoals);
  }, [refresh]);

  async function handlePay(billId) {
    setSpendError('');
    try {
      await payBill(billId);
      await refresh();
    } catch (err) {
      setSpendError(err.response?.data?.message || 'Could not pay that bill.');
    }
  }

  async function handleSpend(amount, category = 'entertainment', description = 'Discretionary spend') {
    setSpendError('');
    try {
      await createSpend({ amount, category, description });
      await refresh();
    } catch (err) {
      setSpendError(err.response?.data?.message || 'Could not log that spend.');
    }
  }

  if (!household) return <p>Loading…</p>;

  return (
    <div className="wrap">
      <h2>This week</h2>
      <div className="grid2">
        <MyMoneyNow
          balance={summary.balance}
          unpaidBills={summary.unpaidBills}
          savingsTarget={summary.savingsTarget}
          safeToSpend={summary.safeToSpend}
          carryMessage="No debt carried from last week."
        />
        <AICoachWidget
          context={{
            safeToSpend: summary.safeToSpend,
            unpaidBillsTotal: summary.unpaidBills,
            savingsTarget: summary.savingsTarget,
          }}
        />
        <div>
          <h4>Bills and responsibilities</h4>
          <BillsList bills={bills} onPay={handlePay} />
        </div>
        <SavingsGoals goals={goals} onGoalCreated={(goal) => setGoals((g) => [...g, goal])} />
        <WhatIfSimulator
          balance={summary.balance}
          unpaidBills={summary.unpaidBills}
          savingsTarget={summary.savingsTarget}
        />
        <BNPLSimulator />
        <PracticeZone />
        <div className="report">
          <h4>Log a spend</h4>
          <p className="sub">Simulate spending money right now (e.g. buying something fun).</p>
          <button className="btn primary" onClick={() => handleSpend(90)}>
            Simulate $90 fun spend
          </button>
          {spendError && <p className="danger" style={{ marginTop: 10 }}>{spendError}</p>}
        </div>
      </div>
    </div>
  );
}
