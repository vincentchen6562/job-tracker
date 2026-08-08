/**
 * Core "safe-to-spend" math shared by the teen dashboard and the weekly payday job.
 * Transforms "how much money do I have" into "how much can I safely use".
 */

export function unpaidBillsTotal(bills) {
  return bills.filter((b) => !b.paid).reduce((sum, b) => sum + b.amount, 0);
}

export function safeToSpend({ balance, unpaidBills, savingsTarget }) {
  return balance - unpaidBills - savingsTarget;
}

/**
 * Applied at the start of each payday: unpaid obligations from last week come out
 * of the new deposit before the teen sees a balance.
 */
export function applyPayday({ weeklyDeposit, carriedDebt }) {
  const debt = Math.max(0, carriedDebt);
  return {
    newBalance: Math.max(0, weeklyDeposit - debt),
    debtCleared: Math.min(weeklyDeposit, debt),
  };
}
