import Bill from '../models/Bill.js';
import Transaction from '../models/Transaction.js';
import { startOfCurrentPeriod } from '../utils/period.js';

/**
 * Bills are recurring definitions (see models/Bill.js) with no paid/unpaid
 * field of their own — "paid this week" is derived from whether a
 * bill_payment Transaction exists for that bill since the current period
 * started. This is what lets bills correctly reset to "due" every payday.
 *
 * `periodEnd` bounds which bills even count for a given period: a bill
 * created mid-week shouldn't be treated as an obligation for weeks before it
 * existed (otherwise the payday job would wrongly "carry over" debt for a
 * bill that was only just added).
 */
export async function getBillsWithStatus(teenId, periodStart = startOfCurrentPeriod(), periodEnd = null) {
  const billFilter = { assignedTo: teenId, active: true };
  if (periodEnd) billFilter.createdAt = { $lt: periodEnd };

  const bills = await Bill.find(billFilter).lean();
  if (bills.length === 0) return [];

  const payments = await Transaction.find({
    user: teenId,
    type: 'bill_payment',
    bill: { $in: bills.map((b) => b._id) },
    createdAt: { $gte: periodStart },
  }).distinct('bill');

  const paidBillIds = new Set(payments.map((id) => id.toString()));
  return bills.map((bill) => ({ ...bill, paid: paidBillIds.has(bill._id.toString()) }));
}

export async function unpaidBillsTotal(teenId, periodStart = startOfCurrentPeriod(), periodEnd = null) {
  const bills = await getBillsWithStatus(teenId, periodStart, periodEnd);
  return bills.filter((b) => !b.paid).reduce((sum, b) => sum + b.amount, 0);
}
