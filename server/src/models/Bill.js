import mongoose from 'mongoose';

const billSchema = new mongoose.Schema(
  {
    household: { type: mongoose.Schema.Types.ObjectId, ref: 'Household', required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    category: {
      type: String,
      enum: ['housing', 'food', 'transport', 'utilities', 'subscriptions', 'other'],
      required: true,
    },
    amount: { type: Number, required: true },
    frequency: { type: String, enum: ['weekly', 'monthly'], default: 'weekly' },
    dueDayOfWeek: { type: Number, min: 0, max: 6 }, // 0 = Sunday, for weekly bills
    consequenceNote: { type: String }, // shown to teen: what happens if missed
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Bill', billSchema);
