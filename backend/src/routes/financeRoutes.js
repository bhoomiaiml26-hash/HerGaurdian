import express from 'express';
import protect from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import { computeFinancialAnalytics, getPreviousMonth } from '../services/financialAnalyticsService.js';

const router = express.Router();

router.get('/transactions', protect, async (req, res, next) => {
  try {
    const { month, type, category, page = 1, limit = 100 } = req.query;
    const where = { userId: req.user.id };
    if (month) where.month = month;
    if (type && ['income', 'expense'].includes(type)) where.type = type;
    if (category) where.category = category;

    const skip = (Number(page) - 1) * Number(limit);
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.transaction.count({ where }),
    ]);

    res.json({ success: true, transactions, total, page: Number(page) });
  } catch (err) {
    next(err);
  }
});

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

    const tx = await prisma.transaction.create({
      data: {
        userId: req.user.id,
        type,
        amount: parsedAmount,
        category: category.trim(),
        description: (description || '').trim().slice(0, 500),
        date: txDate,
        month: monthStr,
      },
    });

    res.status(201).json({ success: true, transaction: tx });
  } catch (err) {
    next(err);
  }
});

router.put('/transactions/:id', protect, async (req, res, next) => {
  try {
    const tx = await prisma.transaction.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!tx) return res.status(404).json({ success: false, message: 'Transaction not found' });

    const data = {};
    const { type, amount, category, description, date } = req.body;

    if (type && ['income', 'expense'].includes(type)) data.type = type;
    if (amount !== undefined) {
      const parsed = parseFloat(amount);
      if (!parsed || parsed <= 0) return res.status(400).json({ success: false, message: 'Amount must be positive' });
      data.amount = parsed;
    }
    if (category) data.category = category.trim();
    if (description !== undefined) data.description = description.trim().slice(0, 500);
    if (date) {
      const d = new Date(date);
      if (isNaN(d.getTime())) return res.status(400).json({ success: false, message: 'Invalid date' });
      data.date = d;
      data.month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }

    const updated = await prisma.transaction.update({
      where: { id: tx.id },
      data,
    });
    res.json({ success: true, transaction: updated });
  } catch (err) {
    next(err);
  }
});

router.delete('/transactions/:id', protect, async (req, res, next) => {
  try {
    const result = await prisma.transaction.deleteMany({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (result.count === 0) return res.status(404).json({ success: false, message: 'Transaction not found' });
    res.json({ success: true, message: 'Transaction deleted' });
  } catch (err) {
    next(err);
  }
});

router.get('/summary', protect, async (req, res, next) => {
  try {
    const { month } = req.query;
    const where = { userId: req.user.id };
    if (month) where.month = month;

    const transactions = await prisma.transaction.findMany({ where });

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

router.get('/budget-settings', protect, async (req, res, next) => {
  try {
    const { month } = req.query;
    const now = new Date();
    const targetMonth = month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    let budget = await prisma.monthlyBudget.findUnique({
      where: { userId_month: { userId: req.user.id, month: targetMonth } },
    });

    if (!budget) {
      const latest = await prisma.monthlyBudget.findFirst({
        where: { userId: req.user.id },
        orderBy: { month: 'desc' },
      });
      budget = {
        month: targetMonth,
        monthlyIncome: latest ? latest.monthlyIncome : 0,
        monthlyBudget: latest ? latest.monthlyBudget : 0,
        savingsGoal: latest ? latest.savingsGoal : 0,
        categoryBudgets: latest ? latest.categoryBudgets : [],
        isDefaultInherited: Boolean(latest),
      };
    }

    res.json({ success: true, budget });
  } catch (err) {
    next(err);
  }
});

router.post('/budget-settings', protect, async (req, res, next) => {
  try {
    const { month, monthlyIncome, monthlyBudget, savingsGoal, categoryBudgets } = req.body;

    const now = new Date();
    const targetMonth = month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const parsedIncome = Math.max(0, parseFloat(monthlyIncome) || 0);
    const parsedBudget = Math.max(0, parseFloat(monthlyBudget) || 0);
    const parsedGoal = Math.max(0, parseFloat(savingsGoal) || 0);

    const cleanCatBudgets = Array.isArray(categoryBudgets)
      ? categoryBudgets
          .filter((c) => c && c.category && typeof c.category === 'string')
          .map((c) => ({
            category: c.category.trim(),
            limit: Math.max(0, parseFloat(c.limit) || 0),
          }))
      : [];

    const updated = await prisma.monthlyBudget.upsert({
      where: { userId_month: { userId: req.user.id, month: targetMonth } },
      update: {
        monthlyIncome: parsedIncome,
        monthlyBudget: parsedBudget,
        savingsGoal: parsedGoal,
        categoryBudgets: cleanCatBudgets,
      },
      create: {
        userId: req.user.id,
        month: targetMonth,
        monthlyIncome: parsedIncome,
        monthlyBudget: parsedBudget,
        savingsGoal: parsedGoal,
        categoryBudgets: cleanCatBudgets,
      },
    });

    res.json({ success: true, budget: updated });
  } catch (err) {
    next(err);
  }
});

router.get('/analytics', protect, async (req, res, next) => {
  try {
    const { month } = req.query;
    const now = new Date();
    const targetMonth = month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prevMonth = getPreviousMonth(targetMonth);

    const [currentTxs, prevTxs, budgetDoc] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId: req.user.id, month: targetMonth },
        orderBy: { date: 'desc' },
      }),
      prevMonth ? prisma.transaction.findMany({
        where: { userId: req.user.id, month: prevMonth },
      }) : Promise.resolve([]),
      prisma.monthlyBudget.findUnique({
        where: { userId_month: { userId: req.user.id, month: targetMonth } },
      }),
    ]);

    let activeBudget = budgetDoc;
    if (!activeBudget) {
      activeBudget = await prisma.monthlyBudget.findFirst({
        where: { userId: req.user.id },
        orderBy: { month: 'desc' },
      });
    }

    const analytics = computeFinancialAnalytics({
      currentMonthTransactions: currentTxs,
      previousMonthTransactions: prevTxs,
      budgetConfig: activeBudget,
      month: targetMonth,
    });

    res.json({ success: true, analytics });
  } catch (err) {
    next(err);
  }
});

router.get('/goals', protect, async (req, res, next) => {
  try {
    const goals = await prisma.savingsGoal.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
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

    const goal = await prisma.savingsGoal.create({
      data: {
        userId: req.user.id,
        name: name.trim().slice(0, 200),
        targetAmount: parsedTarget,
        currentAmount: Math.max(0, parseFloat(currentAmount) || 0),
        monthlyContribution: Math.max(0, parseFloat(monthlyContribution) || 0),
        targetDate: targetDate ? new Date(targetDate) : null,
        notes: (notes || '').trim().slice(0, 1000),
      },
    });

    res.status(201).json({ success: true, goal });
  } catch (err) {
    next(err);
  }
});

router.put('/goals/:id', protect, async (req, res, next) => {
  try {
    const goal = await prisma.savingsGoal.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });

    const data = {};
    const { name, targetAmount, currentAmount, monthlyContribution, targetDate, notes, isCompleted } = req.body;
    if (name !== undefined) data.name = name.trim().slice(0, 200);
    if (targetAmount !== undefined) data.targetAmount = Math.max(1, parseFloat(targetAmount) || 1);
    if (currentAmount !== undefined) data.currentAmount = Math.max(0, parseFloat(currentAmount) || 0);
    if (monthlyContribution !== undefined) data.monthlyContribution = Math.max(0, parseFloat(monthlyContribution) || 0);
    if (targetDate !== undefined) data.targetDate = targetDate ? new Date(targetDate) : null;
    if (notes !== undefined) data.notes = notes.trim().slice(0, 1000);
    if (isCompleted !== undefined) data.isCompleted = Boolean(isCompleted);

    if (data.currentAmount !== undefined) {
      if (data.currentAmount >= (data.targetAmount !== undefined ? data.targetAmount : goal.targetAmount)) {
        data.isCompleted = true;
      }
    } else if (goal.currentAmount >= (data.targetAmount !== undefined ? data.targetAmount : goal.targetAmount)) {
      data.isCompleted = true;
    }

    const updated = await prisma.savingsGoal.update({
      where: { id: goal.id },
      data,
    });
    res.json({ success: true, goal: updated });
  } catch (err) {
    next(err);
  }
});

router.delete('/goals/:id', protect, async (req, res, next) => {
  try {
    const result = await prisma.savingsGoal.deleteMany({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (result.count === 0) return res.status(404).json({ success: false, message: 'Goal not found' });
    res.json({ success: true, message: 'Goal deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
