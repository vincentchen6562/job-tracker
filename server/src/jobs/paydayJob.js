import cron from 'node-cron';
import Household from '../models/Household.js';
import Transaction from '../models/Transaction.js';
import { applyPayday } from '../services/safeToSpendService.js';
import { unpaidBillsTotal } from '../services/billsService.js';
import { startOfCurrentPeriod } from '../utils/period.js';

/**
 * Runs every Monday at 00:05: for each teen, whatever's still unpaid from the
 * week that just ended (per services/billsService.js) is deducted from this
 * week's deposit before it's credited. Bills themselves aren't "reset" —
 * paid-status is always derived from bill_payment transactions since the
 * current period started, so once this Monday begins, last week's payments
 * simply fall outside the new period and every bill reads as due again.
 */
export async function runPayday() {
  const periodEnd = startOfCurrentPeriod();
  const periodStart = new Date(periodEnd);
  periodStart.setDate(periodStart.getDate() - 7);

  const households = await Household.find();

  for (const household of households) {
    for (const teenId of household.teens) {
      const carriedDebt = await unpaidBillsTotal(teenId, periodStart, periodEnd);
      const { newBalance, debtCleared } = applyPayday({
        weeklyDeposit: household.weeklyDeposit,
        carriedDebt,
      });

      await Transaction.create({
        household: household._id,
        user: teenId,
        type: 'deposit',
        category: 'other',
        amount: newBalance,
        description: debtCleared > 0 ? `Payday deposit (after $${debtCleared} carried debt)` : 'Payday deposit',
      });
    }
  }
}

export function schedulePaydayJob() {
  cron.schedule('5 0 * * 1', () => {
    runPayday().catch((err) => console.error('Payday job failed:', err));
  });
}
