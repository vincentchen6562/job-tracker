import mongoose from 'mongoose';

const VISIBILITY_CATEGORIES = [
  'housing',
  'food',
  'transport',
  'utilities',
  'subscriptions',
  'savings',
];

const householdSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    parents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    teens: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    weeklyDeposit: { type: Number, required: true, default: 0 },
    savingsTarget: { type: Number, default: 0 },
    // Categories the parent has chosen to expose to the teen (privacy by design)
    visibleCategories: {
      type: [String],
      enum: VISIBILITY_CATEGORIES,
      default: ['food', 'transport', 'subscriptions', 'savings'],
    },
  },
  { timestamps: true }
);

export const VISIBILITY_CATEGORY_OPTIONS = VISIBILITY_CATEGORIES;
export default mongoose.model('Household', householdSchema);
