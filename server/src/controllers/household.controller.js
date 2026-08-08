import Household, { VISIBILITY_CATEGORY_OPTIONS } from '../models/Household.js';
import User from '../models/User.js';

// GET /api/household
export async function getHousehold(req, res, next) {
  try {
    const household = await Household.findById(req.user.household).populate('parents teens', 'name role');
    res.json(household);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/household — weekly deposit, savings target, visible categories
export async function updateHousehold(req, res, next) {
  try {
    const { weeklyDeposit, savingsTarget, visibleCategories } = req.body;
    if (visibleCategories) {
      const invalid = visibleCategories.filter((c) => !VISIBILITY_CATEGORY_OPTIONS.includes(c));
      if (invalid.length) {
        return res.status(400).json({ message: `Invalid categories: ${invalid.join(', ')}` });
      }
    }
    const household = await Household.findByIdAndUpdate(
      req.user.household,
      { $set: { weeklyDeposit, savingsTarget, visibleCategories } },
      { new: true, omitUndefined: true }
    );
    res.json(household);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/household/teens/:teenId/independence-level — graduated independence
export async function updateIndependenceLevel(req, res, next) {
  try {
    const { level } = req.body;
    if (![1, 2, 3].includes(level)) {
      return res.status(400).json({ message: 'Level must be 1, 2 or 3.' });
    }
    const teen = await User.findOneAndUpdate(
      { _id: req.params.teenId, household: req.user.household, role: 'teen' },
      { $set: { independenceLevel: level } },
      { new: true }
    );
    if (!teen) return res.status(404).json({ message: 'Teen not found in your household.' });
    res.json(teen);
  } catch (err) {
    next(err);
  }
}
