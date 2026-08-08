import mongoose from 'mongoose';

const weeklyReportSchema = new mongoose.Schema(
  {
    household: { type: mongoose.Schema.Types.ObjectId, ref: 'Household', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    weekStart: { type: Date, required: true },
    weekEnd: { type: Date, required: true },
    billsPaidOnTime: { type: Number, default: 0 },
    billsMissed: { type: Number, default: 0 },
    totalSpend: { type: Number, default: 0 },
    savingsContribution: { type: Number, default: 0 },
    debtCarriedForward: { type: Number, default: 0 },
    // AI-generated narrative summary + conversation prompt for this week
    aiSummary: { type: String },
    conversationPrompt: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model('WeeklyReport', weeklyReportSchema);
