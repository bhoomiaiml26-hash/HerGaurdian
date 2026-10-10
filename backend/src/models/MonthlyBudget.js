import mongoose from 'mongoose';

const monthlyBudgetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    month: {
      // Stored as YYYY-MM
      type: String,
      required: true,
    },
    monthlyIncome: {
      type: Number,
      default: 0,
      min: [0, 'Monthly income cannot be negative'],
    },
    monthlyBudget: {
      type: Number,
      default: 0,
      min: [0, 'Monthly spending budget cannot be negative'],
    },
    savingsGoal: {
      type: Number,
      default: 0,
      min: [0, 'Savings goal cannot be negative'],
    },
    categoryBudgets: [
      {
        category: { type: String, required: true, trim: true },
        limit: { type: Number, required: true, min: 0, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

monthlyBudgetSchema.index({ user: 1, month: 1 }, { unique: true });

const MonthlyBudget = mongoose.model('MonthlyBudget', monthlyBudgetSchema);
export default MonthlyBudget;
