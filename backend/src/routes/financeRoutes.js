import express from 'express';
import protect from '../middleware/auth.js';
import Transaction from '../models/Transaction.js';
import SavingsGoal from '../models/SavingsGoal.js';

const router = express.Router();

// ── TRANSACTIONS ─────────────────────────────────────────────────────────────

/**
 * GET /api/finance/transactions
 * List transactions for the authenticated user.
 * Query: month (YYYY-MM), type (income|expense), category, page, limit
 */
router.get('/transactions', protect, async (req, res, next) => {
  try {
    const { month, type, category, page = 1, limit = 100 } = req.query;
    const filter = { user: req.user._id };
    if (month) filter.month = month;
    if (type && ['income', 'expense'].includes(type)) filter.type = type;
    if (category) filter.category = category;

    const skip = (Number(page) - 1) * Number(limit);
    const [transactions, total] = await Promise.all([
      Transaction.find(filter).sort({ date: -1 }).skip(skip).limit(Number(limit)).lean(),
      Transaction.countDocuments(filter),
    ]);

    res.json({ success: true, transactions, total, page: Number(page) });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/finance/transactions
 * Create a transaction.
 */
router.post('/transactions', protect, async (req, res, next) => {
  try {
    const { type, amount, category, description, date } = req.body;

    if (!type || !['income', 'expense'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Type must be "income" or "expense"' });
    }
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be a positive number' });
    }
    if (!category || typeof category !== 'string' || !category.trim()) {
      return res.status(400).json({ success: false, message: 'Category is required' });
    }

    const txDate = date ? new Date(date) : new Date();
    if (isNaN(txDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid date' });
    }

    const monthStr = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;

    const tx = await Transaction.create({
      user: req.user._id,
      type,
      amount: parsedAmount,
      category: category.trim(),
      description: (description || '').trim().slice(0, 500),
      date: txDate,
      month: monthStr,
    });

    res.status(201).json({ success: true, transaction: tx });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/finance/transactions/:id
 * Update a transaction (only the owner can update).
 */
router.put('/transactions/:id', protect, async (req, res, next) => {
  try {
    const { type, amount, category, description, date } = req.body;

    const tx = await Transaction.findOne({ _id: req.params.id, user: req.user._id });
    if (!tx) return res.status(404).json({ success: false, message: 'Transaction not found' });

    if (type && ['income', 'expense'].includes(type)) tx.type = type;
    if (amount !== undefined) {
      const parsed = parseFloat(amount);
      if (!parsed || parsed <= 0) return res.status(400).json({ success: false, message: 'Amount must be positive' });
      tx.amount = parsed;
    }
    if (category) tx.category = category.trim();
    if (description !== undefined) tx.description = description.trim().slice(0, 500);
    if (date) {
      const d = new Date(date);
      if (isNaN(d.getTime())) return res.status(400).json({ success: false, message: 'Invalid date' });
      tx.date = d;
      tx.month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }

    await tx.save();
    res.json({ success: true, transaction: tx });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/finance/transactions/:id
 */
router.delete('/transactions/:id', protect, async (req, res, next) => {
  try {
    const tx = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!tx) return res.status(404).json({ success: false, message: 'Transaction not found' });
    res.json({ success: true, message: 'Transaction deleted' });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/finance/summary
 * Returns income, expenses, balance, and category breakdown for a given month.
 * Uses code-based aggregation — never AI-invented totals.
 */
router.get('/summary', protect, async (req, res, next) => {
  try {
    const { month } = req.query;
    const filter = { user: req.user._id };
    if (month) filter.month = month;

    const transactions = await Transaction.find(filter).lean();

    let totalIncome = 0;
    let totalExpenses = 0;
    const categoryBreakdown = {};

    for (const tx of transactions) {
      if (tx.type === 'income') {
        totalIncome += tx.amount;
      } else {
        totalExpenses += tx.amount;
        categoryBreakdown[tx.category] = (categoryBreakdown[tx.category] || 0) + tx.amount;
      }
    }

    const balance = totalIncome - totalExpenses;
    const breakdown = Object.entries(categoryBreakdown)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);

    res.json({
      success: true,
      summary: {
        totalIncome,
        totalExpenses,
        balance,
        breakdown,
        month: month || 'all',
        transactionCount: transactions.length,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── SAVINGS GOALS ─────────────────────────────────────────────────────────────

router.get('/goals', protect, async (req, res, next) => {
  try {
    const goals = await SavingsGoal.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
    // Compute progress percentage server-side for accuracy
    const goalsWithProgress = goals.map((g) => ({
      ...g,
      progressPct: g.targetAmount > 0 ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) : 0,
      remaining: Math.max(0, g.targetAmount - g.currentAmount),
    }));
    res.json({ success: true, goals: goalsWithProgress });
  } catch (err) {
    next(err);
  }
});

router.post('/goals', protect, async (req, res, next) => {
  try {
    const { name, targetAmount, currentAmount, monthlyContribution, targetDate, notes } = req.body;

    if (!name || !name.trim()) return res.status(400).json({ success: false, message: 'Goal name is required' });
    const parsedTarget = parseFloat(targetAmount);
    if (!parsedTarget || parsedTarget < 1) return res.status(400).json({ success: false, message: 'Target amount must be at least 1' });

    const goal = await SavingsGoal.create({
      user: req.user._id,
      name: name.trim().slice(0, 200),
      targetAmount: parsedTarget,
      currentAmount: Math.max(0, parseFloat(currentAmount) || 0),
      monthlyContribution: Math.max(0, parseFloat(monthlyContribution) || 0),
      targetDate: targetDate ? new Date(targetDate) : null,
      notes: (notes || '').trim().slice(0, 1000),
    });

    res.status(201).json({ success: true, goal });
  } catch (err) {
    next(err);
  }
});

router.put('/goals/:id', protect, async (req, res, next) => {
  try {
    const goal = await SavingsGoal.findOne({ _id: req.params.id, user: req.user._id });
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });

    const { name, targetAmount, currentAmount, monthlyContribution, targetDate, notes, isCompleted } = req.body;
    if (name !== undefined) goal.name = name.trim().slice(0, 200);
    if (targetAmount !== undefined) goal.targetAmount = Math.max(1, parseFloat(targetAmount) || 1);
    if (currentAmount !== undefined) goal.currentAmount = Math.max(0, parseFloat(currentAmount) || 0);
    if (monthlyContribution !== undefined) goal.monthlyContribution = Math.max(0, parseFloat(monthlyContribution) || 0);
    if (targetDate !== undefined) goal.targetDate = targetDate ? new Date(targetDate) : null;
    if (notes !== undefined) goal.notes = notes.trim().slice(0, 1000);
    if (isCompleted !== undefined) goal.isCompleted = Boolean(isCompleted);

    // Auto-mark complete if current >= target
    if (goal.currentAmount >= goal.targetAmount) goal.isCompleted = true;

    await goal.save();
    res.json({ success: true, goal });
  } catch (err) {
    next(err);
  }
});

router.delete('/goals/:id', protect, async (req, res, next) => {
  try {
    const goal = await SavingsGoal.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });
    res.json({ success: true, message: 'Goal deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
