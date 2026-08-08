import SavingsGoal from '../models/SavingsGoal.js';

// GET /api/goals
export async function listGoals(req, res, next) {
  try {
    const goals = await SavingsGoal.find({ user: req.user.id });
    res.json(goals);
  } catch (err) {
    next(err);
  }
}

// POST /api/goals
export async function createGoal(req, res, next) {
  try {
    const goal = await SavingsGoal.create({ ...req.body, user: req.user.id });
    res.status(201).json(goal);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/goals/:id — e.g. contribute to a goal
export async function updateGoal(req, res, next) {
  try {
    const goal = await SavingsGoal.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $set: req.body },
      { new: true }
    );
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    res.json(goal);
  } catch (err) {
    next(err);
  }
}
