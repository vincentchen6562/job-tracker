import mongoose from 'mongoose';

const savingsGoalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    targetAmount: { type: Number, required: true },
    currentAmount: { type: Number, default: 0 },
    targetDate: { type: Date },
    achieved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('SavingsGoal', savingsGoalSchema);
