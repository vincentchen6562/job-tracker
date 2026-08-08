import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    household: { type: mongoose.Schema.Types.ObjectId, ref: 'Household', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['deposit', 'bill_payment', 'spend', 'bnpl_repayment'], required: true },
    // Category only — merchant/product detail is intentionally not stored to protect teen privacy
    category: {
      type: String,
      enum: ['housing', 'food', 'transport', 'utilities', 'subscriptions', 'savings', 'entertainment', 'other'],
      required: true,
    },
    amount: { type: Number, required: true },
    bill: { type: mongoose.Schema.Types.ObjectId, ref: 'Bill' },
    description: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model('Transaction', transactionSchema);
