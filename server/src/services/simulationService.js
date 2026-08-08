import { safeToSpend } from './safeToSpendService.js';

/**
 * "What if I buy this?" — pure projection, no money actually moves.
 */
export function simulatePurchase({ balance, unpaidBills, savingsTarget, itemCost, goal }) {
  const newBalance = balance - itemCost;
  const newSafeToSpend = safeToSpend({ balance: newBalance, unpaidBills, savingsTarget });

  let goalDelayWeeks = null;
  if (goal && goal.weeklyContribution > 0) {
    const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
    const weeksBefore = Math.ceil(remaining / goal.weeklyContribution);
    const weeksAfter = Math.ceil(
      remaining / Math.max(1, goal.weeklyContribution - Math.min(goal.weeklyContribution, itemCost))
    );
    goalDelayWeeks = weeksAfter - weeksBefore;
  }

  return {
    newBalance,
    newSafeToSpend,
    goalDelayWeeks,
    wouldGoNegative: newSafeToSpend < 0,
  };
}

/**
 * Splits a "family advance" (BNPL-style) purchase into equal weekly repayments
 * that reduce future safe-to-spend, rather than granting real credit.
 */
export function buildBNPLInstallments({ totalAmount, numberOfInstallments = 4, startDate = new Date() }) {
  const perInstallment = Math.round((totalAmount / numberOfInstallments) * 100) / 100;
  return Array.from({ length: numberOfInstallments }, (_, i) => {
    const dueDate = new Date(startDate);
    dueDate.setDate(dueDate.getDate() + 7 * (i + 1));
    return { dueDate, amount: perInstallment, paid: false };
  });
}
