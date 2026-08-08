import { simulatePurchase, buildBNPLInstallments } from '../services/simulationService.js';
import BNPLPlan from '../models/BNPLPlan.js';

// POST /api/simulate/purchase — "what if I buy this?" projection, no money moves
export async function simulateWhatIf(req, res, next) {
  try {
    const { balance, unpaidBills, savingsTarget, itemCost, goal } = req.body;
    const result = simulatePurchase({ balance, unpaidBills, savingsTarget, itemCost, goal });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

// POST /api/simulate/bnpl — teen requests a family advance, split into installments
export async function requestBNPLPlan(req, res, next) {
  try {
    const { itemDescription, totalAmount, numberOfInstallments } = req.body;
    const installments = buildBNPLInstallments({ totalAmount, numberOfInstallments });

    const plan = await BNPLPlan.create({
      user: req.user.id,
      household: req.user.household,
      itemDescription,
      totalAmount,
      installments,
      status: 'pending_approval',
    });

    res.status(201).json(plan);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/simulate/bnpl/:id/approve — parent approves the family advance
export async function approveBNPLPlan(req, res, next) {
  try {
    const plan = await BNPLPlan.findOneAndUpdate(
      { _id: req.params.id, household: req.user.household },
      { $set: { approvedByParent: true, status: 'active' } },
      { new: true }
    );
    if (!plan) return res.status(404).json({ message: 'Plan not found' });
    res.json(plan);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/simulate/bnpl/:id/decline
export async function declineBNPLPlan(req, res, next) {
  try {
    const plan = await BNPLPlan.findOneAndUpdate(
      { _id: req.params.id, household: req.user.household },
      { $set: { status: 'declined' } },
      { new: true }
    );
    if (!plan) return res.status(404).json({ message: 'Plan not found' });
    res.json(plan);
  } catch (err) {
    next(err);
  }
}

// GET /api/simulate/bnpl — plans for the household (parent review queue)
export async function listBNPLPlans(req, res, next) {
  try {
    const filter = { household: req.user.household };
    if (req.user.role === 'teen') filter.user = req.user.id;
    const plans = await BNPLPlan.find(filter).sort({ createdAt: -1 });
    res.json(plans);
  } catch (err) {
    next(err);
  }
}
