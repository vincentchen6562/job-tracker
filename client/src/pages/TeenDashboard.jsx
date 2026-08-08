import { useEffect, useState } from 'react';
import { useHousehold } from '../context/HouseholdContext.jsx';
import { getBills, payBill, getGoals } from '../services/householdService.js';
import { MyMoneyNow } from '../components/teen/MyMoneyNow.jsx';
import { BillsList } from '../components/teen/BillsList.jsx';
import { SavingsGoals } from '../components/teen/SavingsGoals.jsx';
import { WhatIfSimulator } from '../components/teen/WhatIfSimulator.jsx';
import { BNPLSimulator } from '../components/teen/BNPLSimulator.jsx';
import { PracticeZone } from '../components/teen/PracticeZone.jsx';
import { AICoachWidget } from '../components/teen/AICoachWidget.jsx';
import { useSafeToSpend } from '../hooks/useSafeToSpend.js';

export function TeenDashboard() {
  const { household } = useHousehold();
  const [bills, setBills] = useState([]);
  const [goals, setGoals] = useState([]);
  const balance = household?.weeklyDeposit ?? 0; // TODO: replace with real running balance once Transaction totals are wired up

  useEffect(() => {
    getBills().then(setBills);
    getGoals().then(setGoals);
  }, []);

  const { unpaid, safeToSpend } = useSafeToSpend({
    balance,
    bills,
    savingsTarget: household?.savingsTarget ?? 0,
  });

  async function handlePay(billId) {
    await payBill(billId);
    setBills(await getBills());
  }

  if (!household) return <p>Loading…</p>;

  return (
    <div className="wrap">
      <h2>This week</h2>
      <div className="grid2">
        <MyMoneyNow
          balance={balance}
          unpaidBills={unpaid}
          savingsTarget={household.savingsTarget}
          safeToSpend={safeToSpend}
          carryMessage="No debt carried from last week."
        />
        <AICoachWidget context={{ safeToSpend, unpaidBillsTotal: unpaid, savingsTarget: household.savingsTarget }} />
        <div>
          <h4>Bills and responsibilities</h4>
          <BillsList bills={bills} onPay={handlePay} />
        </div>
        <SavingsGoals goals={goals} />
        <WhatIfSimulator balance={balance} unpaidBills={unpaid} savingsTarget={household.savingsTarget} />
        <BNPLSimulator />
        <PracticeZone />
      </div>
    </div>
  );
}
