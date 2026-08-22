const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  category: { type: String },
  type: { type: String, enum: ['Income', 'Expense', 'income', 'expense'], default: 'Expense' },
  status: { type: String, default: 'Completed' },

  // Recurring Transaction Logic
  isRecurring: { type: Boolean, default: false },
  recurrenceInterval: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly', null], default: null },
  nextOccurrence: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
