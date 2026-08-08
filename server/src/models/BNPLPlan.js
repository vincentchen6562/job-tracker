import mongoose from 'mongoose';

const installmentSchema = new mongoose.Schema(
  {
    dueDate: { type: Date, required: true },
    amount: { type: Number, required: true },
    paid: { type: Boolean, default: false },
  },
  { _id: false }
);

const bnplPlanSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    household: { type: mongoose.Schema.Types.ObjectId, ref: 'Household', required: true },
    itemDescription: { type: String, required: true },
    totalAmount: { type: Number, required: true },
    installments: { type: [installmentSchema], required: true },
    status: { type: String, enum: ['pending_approval', 'active', 'completed', 'declined'], default: 'pending_approval' },
    approvedByParent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('BNPLPlan', bnplPlanSchema);
