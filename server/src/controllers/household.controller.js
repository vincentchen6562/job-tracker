import Household, { VISIBILITY_CATEGORY_OPTIONS } from '../models/Household.js';

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
