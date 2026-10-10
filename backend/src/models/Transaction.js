import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: [true, 'Transaction type is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
    month: {
      // Stored as YYYY-MM for quick monthly aggregation
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

transactionSchema.index({ user: 1, month: 1 });
transactionSchema.index({ user: 1, date: -1 });

// Auto-derive month from date before saving
transactionSchema.pre('save', function (next) {
  const d = this.date instanceof Date ? this.date : new Date(this.date);
  this.month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  next();
});

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;
