import Bill from '../models/Bill.js';
import Transaction from '../models/Transaction.js';

// GET /api/bills — bills for the logged-in teen, or the whole household for a parent
export async function listBills(req, res, next) {
  try {
    const filter = { household: req.user.household };
    if (req.user.role === 'teen') filter.assignedTo = req.user.id;
    const bills = await Bill.find(filter);
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

// POST /api/bills/:id/pay — teen pays a bill from their balance
export async function payBill(req, res, next) {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) return res.status(404).json({ message: 'Bill not found' });

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
