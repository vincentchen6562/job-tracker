import Bill from '../models/Bill.js';
import Transaction from '../models/Transaction.js';
import { getBillsWithStatus } from '../services/billsService.js';
import { getBalance } from '../services/balanceService.js';
import { resolveTeenId } from '../utils/resolveTeen.js';

// GET /api/bills — this week's bills + paid status for a teen. Teens get
// their own; parents pass ?teenId= (defaults to their first teen).
export async function listBills(req, res, next) {
  try {
    const teenId = await resolveTeenId(req);
    res.json(await getBillsWithStatus(teenId));
  } catch (err) {
    next(err);
  }
}

// GET /api/bills/definitions — raw bill definitions for the household (parent
// management view, independent of any one week's paid status)
export async function listBillDefinitions(req, res, next) {
  try {
    const bills = await Bill.find({ household: req.user.household });
    res.json(bills);
  } catch (err) {
    next(err);
  }
}

// POST /api/bills — parent creates a bill/responsibility
export async function createBill(req, res, next) {
  try {
    const bill = await Bill.create({ ...req.body, household: req.user.household });
    res.status(201).json(bill);
  } catch (err) {
    next(err);
  }
}

// POST /api/bills/:id/pay — teen pays a bill from their real balance
export async function payBill(req, res, next) {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill || bill.assignedTo.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    const [billsWithStatus, balance] = await Promise.all([
      getBillsWithStatus(req.user.id),
      getBalance(req.user.id),
    ]);
    const current = billsWithStatus.find((b) => b._id.toString() === bill._id.toString());
    if (current?.paid) {
      return res.status(400).json({ message: 'This bill is already paid for this week.' });
    }
    if (balance < bill.amount) {
      return res.status(400).json({ message: `You're short ${bill.amount - balance} to cover this bill.` });
    }

    const transaction = await Transaction.create({
      household: bill.household,
      user: req.user.id,
      type: 'bill_payment',
      category: bill.category,
      amount: bill.amount,
      bill: bill._id,
      description: bill.name,
    });

    res.status(201).json(transaction);
  } catch (err) {
    next(err);
  }
}
