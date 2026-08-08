/**
 * Client-side mirror of server/src/services/safeToSpendService.js, used for
 * instant UI feedback (e.g. the what-if simulator) before the API confirms it.
 */

export function unpaidBillsTotal(bills) {
  return bills.filter((b) => !b.paid).reduce((sum, b) => sum + b.amount, 0);
}

export function safeToSpend({ balance, unpaidBills, savingsTarget }) {
  return balance - unpaidBills - savingsTarget;
}
