import cron from 'node-cron';
import Household from '../models/Household.js';
import Bill from '../models/Bill.js';
import Transaction from '../models/Transaction.js';
import { unpaidBillsTotal, applyPayday } from '../services/safeToSpendService.js';

/**
 * Runs every Monday at 00:05: for each household, carries forward any unpaid
 * bills from the past week by deducting them from the new weekly deposit,
 * then logs the deposit as a transaction. This is what makes missed bills
 * "carry into the next payday" instead of just disappearing.
 */
export async function runPayday() {
  const households = await Household.find();

  for (const household of households) {
    const bills = await Bill.find({ household: household._id, active: true });
    // NOTE: paid-status tracking per billing period belongs on a per-period
    // record once that model exists; this is a placeholder using bill.amount.
    const carriedDebt = unpaidBillsTotal(bills.map((b) => ({ amount: b.amount, paid: false })));
    const { newBalance, debtCleared } = applyPayday({
      weeklyDeposit: household.weeklyDeposit,
      carriedDebt,
    });

    for (const teenId of household.teens) {
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
