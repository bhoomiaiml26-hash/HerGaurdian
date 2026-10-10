/**
 * budgetMultiUserIsolation.test.js
 * Multi-user privacy and data isolation tests for HerGuardian AI Budget Tracker.
 *
 * Verifies that:
 * 1. Transactions created by User A are strictly invisible to User B.
 * 2. User B cannot edit or delete User A's transactions.
 * 3. Budget settings configured by User A are isolated from User B.
 * 4. Financial analytics computed for User B never leak User A's numbers.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Transaction from '../src/models/Transaction.js';
import MonthlyBudget from '../src/models/MonthlyBudget.js';
import { computeFinancialAnalytics } from '../src/services/financialAnalyticsService.js';

describe('Budget Tracker — Multi-User Data Isolation', () => {
  let mongoServer;
  const userAId = new mongoose.Types.ObjectId();
  const userBId = new mongoose.Types.ObjectId();
  const testMonth = '2026-10';

  before(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  after(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('Strictly isolates transactions, budgets, and calculations between User A and User B', async () => {
    // 1. User A sets up budget and adds transactions
    await MonthlyBudget.create({
      user: userAId,
      month: testMonth,
      monthlyIncome: 30000,
      monthlyBudget: 20000,
      savingsGoal: 5000,
      categoryBudgets: [{ category: 'Food & Groceries', limit: 5000 }],
    });

    const txA1 = await Transaction.create({
      user: userAId,
      type: 'income',
      amount: 30000,
      category: 'Salary',
      date: new Date('2026-10-01'),
      month: testMonth,
    });

    const txA2 = await Transaction.create({
      user: userAId,
      type: 'expense',
      amount: 2000,
      category: 'Food & Groceries',
      date: new Date('2026-10-05'),
      month: testMonth,
    });

    // 2. User B queries transactions — must see 0 transactions
    const userBTxs = await Transaction.find({ user: userBId, month: testMonth }).lean();
    assert.equal(userBTxs.length, 0, 'User B must see 0 transactions');

    // 3. User B queries budget settings — must see no budget doc
    const userBBudget = await MonthlyBudget.findOne({ user: userBId, month: testMonth }).lean();
    assert.equal(userBBudget, null, 'User B must not see User A budget settings');

    // 4. User B attempts to update User A's transaction using route query { _id, user }
    const unauthorizedUpdate = await Transaction.findOneAndUpdate(
      { _id: txA2._id, user: userBId },
      { amount: 99999 },
      { new: true }
    );
    assert.equal(unauthorizedUpdate, null, 'User B cannot update User A transaction');

    // 5. User B attempts to delete User A's transaction
    const unauthorizedDelete = await Transaction.findOneAndDelete({ _id: txA2._id, user: userBId });
    assert.equal(unauthorizedDelete, null, 'User B cannot delete User A transaction');

    // Verify User A's transaction is still intact
    const originalTx = await Transaction.findById(txA2._id).lean();
    assert.equal(originalTx.amount, 2000, 'User A transaction amount remained untouched');

    // 6. User B computes analytics on their own empty data
    const analyticsB = computeFinancialAnalytics({
      currentMonthTransactions: userBTxs,
      budgetConfig: userBBudget,
      month: testMonth,
    });

    assert.equal(analyticsB.totalIncome, 0, 'User B income must be 0');
    assert.equal(analyticsB.totalExpenses, 0, 'User B expenses must be 0');
    assert.equal(analyticsB.remainingSpendingBudget, 0, 'User B budget remaining must be 0');

    // 7. User A computes analytics — User A's numbers are fully correct
    const userATxs = await Transaction.find({ user: userAId, month: testMonth }).lean();
    const userABudget = await MonthlyBudget.findOne({ user: userAId, month: testMonth }).lean();
    const analyticsA = computeFinancialAnalytics({
      currentMonthTransactions: userATxs,
      budgetConfig: userABudget,
      month: testMonth,
    });

    assert.equal(analyticsA.totalIncome, 30000);
    assert.equal(analyticsA.totalExpenses, 2000);
    assert.equal(analyticsA.netCashFlow, 28000);
    assert.equal(analyticsA.remainingSpendingBudget, 18000);
  });
});
