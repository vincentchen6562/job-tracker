import mongoose from 'mongoose';

const habitsScoreSchema = new mongoose.Schema(
  {
    household: { type: mongoose.Schema.Types.ObjectId, ref: 'Household', required: true },
    weekOf: { type: Date, required: true },
    score: { type: Number, required: true }, // behaviour-based, not wealth-based
    factors: {
      savingConsistency: { type: Number, default: 0 },
      billsPaidOnTime: { type: Number, default: 0 },
      goalProgress: { type: Number, default: 0 },
      plannedVsUnplannedSpend: { type: Number, default: 0 },
      impulsePurchasesReconsidered: { type: Number, default: 0 },
      responsibleFutureMoneyUse: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

export default mongoose.model('HabitsScore', habitsScoreSchema);
