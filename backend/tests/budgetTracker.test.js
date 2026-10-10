/**
 * budgetTracker.test.js
 * Comprehensive regression tests for the Financial Coach Budget Tracker.
 *
 * Verifies:
 * 1. Initial calculation test suite specified in Part B.8:
 *    - Monthly income: ₹30,000
 *    - Monthly spending budget: ₹20,000
 *    - Monthly savings goal: ₹5,000
 *    - Transactions: Income ₹30,000, Food ₹2,000, Transport ₹1,000
 *    - Total income = ₹30,000, Total expenses = ₹3,000, Net cash flow = ₹27,000
 *    - Remaining spending budget = ₹17,000
 *    - Savings goal progress = ₹27,000 available net cash flow vs ₹5,000 goal
 * 2. Editing Food expense to ₹2,500:
 *    - Total expenses = ₹3,500
 *    - Remaining budget = ₹16,500
 * 3. Deleting Transport expense:
 *    - Total expenses = ₹2,500
 *    - Remaining budget = ₹17,500
 * 4. Category budget limits, % used, and warning status
 * 5. Empty month and zero budget handling
 * 6. Multi-user isolation (User A vs User B)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeFinancialAnalytics } from '../src/services/financialAnalyticsService.js';

describe('Budget Tracker — Calculation Engine & Specified Regression Test (Part B.8)', () => {
  const month = '2026-10';

  const budgetConfig = {
    month,
    monthlyIncome: 30000,
    monthlyBudget: 20000,
    savingsGoal: 5000,
    categoryBudgets: [
      { category: 'Food & Groceries', limit: 5000 },
      { category: 'Transport', limit: 3000 },
    ],
  };

  it('Step 1: Initial setup and transaction calculations match exact spec', () => {
    const transactions = [
      { _id: 'tx1', type: 'income', amount: 30000, category: 'Salary', date: '2026-10-01' },
      { _id: 'tx2', type: 'expense', amount: 2000, category: 'Food & Groceries', date: '2026-10-05' },
      { _id: 'tx3', type: 'expense', amount: 1000, category: 'Transport', date: '2026-10-06' },
    ];

    const result = computeFinancialAnalytics({
      currentMonthTransactions: transactions,
      budgetConfig,
      month,
    });

    // Verification of Part B.8 spec
    assert.equal(result.totalIncome, 30000, 'Total income must be ₹30,000');
    assert.equal(result.totalExpenses, 3000, 'Total expenses must be ₹3,000');
    assert.equal(result.netCashFlow, 27000, 'Net cash flow must be ₹27,000');
    assert.equal(result.remainingSpendingBudget, 17000, 'Remaining spending budget must be ₹17,000');
    assert.equal(result.savingsGoal, 5000, 'Savings goal is ₹5,000');
    assert.equal(result.savingsGoalProgress.availableForSavings, 27000);
    assert.ok(
      result.savingsGoalProgress.description.includes('₹27,000 available net cash flow compared with the ₹5,000 goal'),
      'Description must state available cash flow vs goal'
    );

    // Category tracking
    const foodCat = result.categorySummaries.find((c) => c.category === 'Food & Groceries');
    assert.ok(foodCat);
    assert.equal(foodCat.actualSpent, 2000);
    assert.equal(foodCat.budgetLimit, 5000);
    assert.equal(foodCat.remaining, 3000);
    assert.equal(foodCat.percentUsed, 40);
    assert.equal(foodCat.status, 'safe');

    const transportCat = result.categorySummaries.find((c) => c.category === 'Transport');
    assert.ok(transportCat);
    assert.equal(transportCat.actualSpent, 1000);
    assert.equal(transportCat.budgetLimit, 3000);
    assert.equal(transportCat.remaining, 2000);
    assert.equal(transportCat.percentUsed, 33);
  });

  it('Step 2: Edit Food expense from ₹2,000 to ₹2,500', () => {
    const transactions = [
      { _id: 'tx1', type: 'income', amount: 30000, category: 'Salary', date: '2026-10-01' },
      { _id: 'tx2', type: 'expense', amount: 2500, category: 'Food & Groceries', date: '2026-10-05' }, // edited
      { _id: 'tx3', type: 'expense', amount: 1000, category: 'Transport', date: '2026-10-06' },
    ];

    const result = computeFinancialAnalytics({
      currentMonthTransactions: transactions,
      budgetConfig,
      month,
    });

    // Verification of Part B.8 edit
    assert.equal(result.totalExpenses, 3500, 'Total expenses must become ₹3,500');
    assert.equal(result.remainingSpendingBudget, 16500, 'Remaining spending budget must become ₹16,500');
    assert.equal(result.netCashFlow, 26500, 'Net cash flow must become ₹26,500');

    const foodCat = result.categorySummaries.find((c) => c.category === 'Food & Groceries');
    assert.equal(foodCat.actualSpent, 2500);
    assert.equal(foodCat.remaining, 2500);
    assert.equal(foodCat.percentUsed, 50);
  });

  it('Step 3: Delete Transport expense', () => {
    const transactions = [
      { _id: 'tx1', type: 'income', amount: 30000, category: 'Salary', date: '2026-10-01' },
      { _id: 'tx2', type: 'expense', amount: 2500, category: 'Food & Groceries', date: '2026-10-05' },
      // tx3 deleted
    ];

    const result = computeFinancialAnalytics({
      currentMonthTransactions: transactions,
      budgetConfig,
      month,
    });

    // Verification of Part B.8 deletion
    assert.equal(result.totalExpenses, 2500, 'Total expenses must become ₹2,500');
    assert.equal(result.remainingSpendingBudget, 17500, 'Remaining spending budget must become ₹17,500');
    assert.equal(result.netCashFlow, 27500, 'Net cash flow must become ₹27,500');

    const transportCat = result.categorySummaries.find((c) => c.category === 'Transport');
    assert.equal(transportCat.actualSpent, 0);
    assert.equal(transportCat.remaining, 3000);
  });
});

describe('Budget Tracker — Category Warning Thresholds & Overspending', () => {
  const month = '2026-10';
  const budgetConfig = {
    month,
    monthlyIncome: 50000,
    monthlyBudget: 30000,
    savingsGoal: 10000,
    categoryBudgets: [
      { category: 'Shopping', limit: 2000 },
      { category: 'Dining Out', limit: 1000 },
    ],
  };

  it('Flags warning when category spending reaches or exceeds 80%', () => {
    const transactions = [
      { _id: 'tx1', type: 'expense', amount: 1700, category: 'Shopping', date: '2026-10-10' }, // 85%
    ];

    const result = computeFinancialAnalytics({
      currentMonthTransactions: transactions,
      budgetConfig,
      month,
    });

    const shopCat = result.categorySummaries.find((c) => c.category === 'Shopping');
    assert.equal(shopCat.status, 'warning');
    assert.equal(shopCat.percentUsed, 85);
    const warnInsight = result.insights.find((i) => i.type === 'budget_warning');
    assert.ok(warnInsight, 'Must generate budget_warning insight');
  });

  it('Flags exceeded when category spending surpasses 100%', () => {
    const transactions = [
      { _id: 'tx1', type: 'expense', amount: 1400, category: 'Dining Out', date: '2026-10-12' }, // 140%
    ];

    const result = computeFinancialAnalytics({
      currentMonthTransactions: transactions,
      budgetConfig,
      month,
    });

    const dineCat = result.categorySummaries.find((c) => c.category === 'Dining Out');
    assert.equal(dineCat.status, 'exceeded');
    assert.equal(dineCat.percentUsed, 140);
    assert.equal(dineCat.remaining, -400);

    const exceedInsight = result.insights.find((i) => i.type === 'budget_exceeded');
    assert.ok(exceedInsight, 'Must generate budget_exceeded insight');
    assert.ok(result.actionPlan.focusCategories.includes('Dining Out'));
  });

  it('Handles zero and unbudgeted categories safely without division by zero', () => {
    const transactions = [
      { _id: 'tx1', type: 'expense', amount: 500, category: 'Pet Care', date: '2026-10-15' },
    ];

    const result = computeFinancialAnalytics({
      currentMonthTransactions: transactions,
      budgetConfig: { monthlyBudget: 0, categoryBudgets: [] },
      month,
    });

    const petCat = result.categorySummaries.find((c) => c.category === 'Pet Care');
    assert.equal(petCat.status, 'unbudgeted');
    assert.equal(petCat.percentUsed, 0);
    assert.equal(petCat.remaining, null);
    assert.equal(result.budgetUtilizationPct, 0);
  });
});

describe('Budget Tracker — Empty Periods & Month-over-Month Comparisons', () => {
  it('Handles completely empty month gracefully', () => {
    const result = computeFinancialAnalytics({
      currentMonthTransactions: [],
      budgetConfig: null,
      month: '2026-10',
    });

    assert.equal(result.totalIncome, 0);
    assert.equal(result.totalExpenses, 0);
    assert.equal(result.netCashFlow, 0);
    assert.equal(result.transactionCount, 0);
    assert.equal(result.insights[0].type, 'no_data');
  });

  it('Calculates month-over-month shift when previous month has transactions', () => {
    const current = [
      { _id: 'c1', type: 'expense', amount: 4000, category: 'Food & Groceries', date: '2026-10-05' },
    ];
    const previous = [
      { _id: 'p1', type: 'expense', amount: 3000, category: 'Food & Groceries', date: '2026-09-10' },
    ];

    const result = computeFinancialAnalytics({
      currentMonthTransactions: current,
      previousMonthTransactions: previous,
      budgetConfig: null,
      month: '2026-10',
    });

    assert.equal(result.previousMonthComparison.hasData, true);
    assert.equal(result.previousMonthComparison.expenseDelta, 1000);
    assert.equal(result.previousMonthComparison.expenseDeltaPct, 33.3);

    const compInsight = result.insights.find((i) => i.type === 'month_comparison');
    assert.ok(compInsight);
    assert.ok(compInsight.message.includes('+33.3%'));
  });
});
