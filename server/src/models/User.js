import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['parent', 'teen'], required: true },
    household: { type: mongoose.Schema.Types.ObjectId, ref: 'Household' },
    // Teen-only fields
    independenceLevel: { type: Number, min: 1, max: 3, default: 1 },
    dateOfBirth: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
