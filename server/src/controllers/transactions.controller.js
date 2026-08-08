import Transaction from '../models/Transaction.js';
import { getBalance } from '../services/balanceService.js';
import { unpaidBillsTotal } from '../services/billsService.js';
import Household from '../models/Household.js';
import { safeToSpend } from '../services/safeToSpendService.js';
import { resolveTeenId } from '../utils/resolveTeen.js';
import { startOfCurrentPeriod } from '../utils/period.js';

// GET /api/transactions — recent transactions for the logged-in teen, or the
// whole household (category only — never merchant/product detail) for a parent
export async function listTransactions(req, res, next) {
  try {
    const filter = { household: req.user.household };
    if (req.user.role === 'teen') filter.user = req.user.id;
    const transactions = await Transaction.find(filter).sort({ createdAt: -1 }).limit(50);
    res.json(transactions);
  } catch (err) {
    next(err);
  }
}

// GET /api/transactions/summary — balance/bills/safe-to-spend for a teen.
// Teens get their own; parents pass ?teenId= (defaults to their first teen).
export async function getSummary(req, res, next) {
  try {
    const teenId = await resolveTeenId(req);
    const [balance, unpaidBills, household] = await Promise.all([
      getBalance(teenId),
      unpaidBillsTotal(teenId),
      Household.findById(req.user.household),
    ]);
    const savingsTarget = household.savingsTarget;

    res.json({
      teenId,
      balance,
      unpaidBills,
      savingsTarget,
      safeToSpend: safeToSpend({ balance, unpaidBills, savingsTarget }),
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/transactions/category-breakdown — this week's spend by category,
// filtered to whatever the parent has chosen to make visible (privacy by design)
export async function getCategoryBreakdown(req, res, next) {
  try {
    const teenId = await resolveTeenId(req);
    const household = await Household.findById(req.user.household);
    const periodStart = startOfCurrentPeriod();

    const transactions = await Transaction.find({
      user: teenId,
      type: { $in: ['spend', 'bill_payment'] },
      createdAt: { $gte: periodStart },
      category: { $in: household.visibleCategories },
    });

    const totals = {};
    for (const category of household.visibleCategories) totals[category] = 0;
    for (const t of transactions) totals[t.category] += t.amount;

    res.json(totals);
  } catch (err) {
    next(err);
  }
}

// POST /api/transactions/spend — teen logs discretionary spending
export async function createSpend(req, res, next) {
  try {
    const { category, amount, description } = req.body;
    const balance = await getBalance(req.user.id);
    if (amount > balance) {
      return res.status(400).json({ message: `You're short ${amount - balance} to cover this.` });
    }

    const transaction = await Transaction.create({
      household: req.user.household,
      user: req.user.id,
      type: 'spend',
      category,
      amount,
      description,
    });

    res.status(201).json(transaction);
  } catch (err) {
    next(err);
  }
}
