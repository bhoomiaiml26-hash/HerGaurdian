/**
 * Financial Coach API service.
 * All monetary calculations happen server-side — never client-side or AI-invented.
 */
import api from './api';

// ── TRANSACTIONS ────────────────────────────────────────────────────────────

export const getTransactions = (params = {}) =>
  api.get('/finance/transactions', { params }).then((r) => r.data);

export const createTransaction = (data) =>
  api.post('/finance/transactions', data).then((r) => r.data);

export const updateTransaction = (id, data) =>
  api.put(`/finance/transactions/${id}`, data).then((r) => r.data);

export const deleteTransaction = (id) =>
  api.delete(`/finance/transactions/${id}`).then((r) => r.data);

// ── SUMMARY ─────────────────────────────────────────────────────────────────

export const getFinancialSummary = (month) =>
  api.get('/finance/summary', { params: month ? { month } : {} }).then((r) => r.data);

// ── SAVINGS GOALS ────────────────────────────────────────────────────────────

export const getSavingsGoals = () =>
  api.get('/finance/goals').then((r) => r.data);

export const createSavingsGoal = (data) =>
  api.post('/finance/goals', data).then((r) => r.data);

export const updateSavingsGoal = (id, data) =>
  api.put(`/finance/goals/${id}`, data).then((r) => r.data);

export const deleteSavingsGoal = (id) =>
  api.delete(`/finance/goals/${id}`).then((r) => r.data);

// ── BUDGET CONFIGURATION & ANALYTICS ─────────────────────────────────────────

export const getBudgetSettings = (month) =>
  api.get('/finance/budget-settings', { params: month ? { month } : {} }).then((r) => r.data);

export const updateBudgetSettings = (data) =>
  api.post('/finance/budget-settings', data).then((r) => r.data);

export const getFinancialAnalytics = (month) =>
  api.get('/finance/analytics', { params: month ? { month } : {} }).then((r) => r.data);

