/**
 * financialAnalyticsService.js
 * Centralized, verifiable financial calculation and insights engine for HerGuardian AI.
 *
 * Rules:
 * - All monetary calculations happen deterministically server-side.
 * - Every insight is traceable to recorded transactions or verified budget configuration.
 * - No transaction is double-counted.
 * - Never assume income or goals; handle zero and empty budgets safely.
 */

/**
 * Get previous month string in YYYY-MM format.
 */
export function getPreviousMonth(monthStr) {
  if (!monthStr || !monthStr.includes('-')) return '';
  const [y, m] = monthStr.split('-').map(Number);
  const prevDate = new Date(y, m - 2, 1);
  return `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Calculate days remaining in the specified month.
 */
export function getDaysRemainingInMonth(monthStr) {
  const now = new Date();
  const currentYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  if (!monthStr || monthStr !== currentYm) {
    // If historical or future month, calculate total days in that month
    const [y, m] = (monthStr || currentYm).split('-').map(Number);
    return new Date(y, m, 0).getDate();
  }

  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();
  return Math.max(1, daysInMonth - currentDay + 1);
}

/**
 * Central financial analytics calculation engine.
 *
 * @param {Array} currentMonthTransactions - transactions for the active month
 * @param {Array} previousMonthTransactions - transactions for the previous month (optional)
 * @param {Object} budgetConfig - MonthlyBudget document or object { monthlyIncome, monthlyBudget, savingsGoal, categoryBudgets }
 * @param {String} month - 'YYYY-MM'
 * @returns {Object} Comprehensive, verified financial summary
 */
export function computeFinancialAnalytics({
  currentMonthTransactions = [],
  previousMonthTransactions = [],
  budgetConfig = null,
  month = '',
}) {
  const incomeTxs = [];
  const expenseTxs = [];

  let totalIncome = 0;
  let totalExpenses = 0;
  const categoryExpenses = {};

  for (const tx of currentMonthTransactions) {
    const amt = parseFloat(tx.amount) || 0;
    if (tx.type === 'income') {
      totalIncome += amt;
      incomeTxs.push(tx);
    } else {
      totalExpenses += amt;
      expenseTxs.push(tx);
      const cat = tx.category || 'Other';
      if (!categoryExpenses[cat]) {
        categoryExpenses[cat] = { amount: 0, count: 0, transactions: [] };
      }
      categoryExpenses[cat].amount += amt;
      categoryExpenses[cat].count += 1;
      categoryExpenses[cat].transactions.push(tx);
    }
  }

  // Budget settings
  const configuredIncome = budgetConfig?.monthlyIncome ? parseFloat(budgetConfig.monthlyIncome) : 0;
  const spendingBudget = budgetConfig?.monthlyBudget ? parseFloat(budgetConfig.monthlyBudget) : 0;
  const savingsGoal = budgetConfig?.savingsGoal ? parseFloat(budgetConfig.savingsGoal) : 0;
  const configuredCategoryBudgets = budgetConfig?.categoryBudgets || [];

  // Core metrics
  const netCashFlow = totalIncome - totalExpenses;
  const remainingSpendingBudget = spendingBudget > 0 ? spendingBudget - totalExpenses : 0;
  const budgetUtilizationPct = spendingBudget > 0
    ? Math.round((totalExpenses / spendingBudget) * 1000) / 10
    : 0;

  const savingsRatePct = totalIncome > 0
    ? Math.max(0, Math.round(((totalIncome - totalExpenses) / totalIncome) * 1000) / 10)
    : 0;

  // Savings Goal Progress
  const savingsProgressPct = savingsGoal > 0
    ? Math.min(100, Math.max(0, Math.round((netCashFlow / savingsGoal) * 100)))
    : 0;

  const savingsProgressDescription = savingsGoal > 0
    ? `₹${Math.max(0, netCashFlow).toLocaleString('en-IN')} available net cash flow compared with the ₹${savingsGoal.toLocaleString('en-IN')} goal, assuming there are no other relevant transactions or commitments.`
    : 'No monthly savings goal configured yet. Set a goal in budget settings.';

  // Category breakdown & budget tracking
  const categoryLimitsMap = new Map();
  for (const cb of configuredCategoryBudgets) {
    if (cb.category) {
      categoryLimitsMap.set(cb.category.trim(), parseFloat(cb.limit) || 0);
    }
  }

  const categorySummaries = [];
  const allEncounteredCategories = new Set([
    ...categoryLimitsMap.keys(),
    ...Object.keys(categoryExpenses),
  ]);

  for (const cat of allEncounteredCategories) {
    const actualSpent = categoryExpenses[cat]?.amount || 0;
    const txCount = categoryExpenses[cat]?.count || 0;
    const hasLimit = categoryLimitsMap.has(cat);
    const limit = hasLimit ? categoryLimitsMap.get(cat) : 0;
    const remaining = hasLimit && limit > 0 ? limit - actualSpent : null;
    const percentUsed = hasLimit && limit > 0 ? Math.round((actualSpent / limit) * 100) : 0;

    let status = 'safe';
    if (!hasLimit || limit === 0) {
      status = 'unbudgeted';
    } else if (actualSpent > limit) {
      status = 'exceeded';
    } else if (percentUsed >= 80) {
      status = 'warning';
    }

    categorySummaries.push({
      category: cat,
      actualSpent,
      budgetLimit: hasLimit ? limit : 0,
      hasLimit: hasLimit && limit > 0,
      remaining,
      percentUsed,
      transactionCount: txCount,
      percentageOfTotalExpenses: totalExpenses > 0 ? Math.round((actualSpent / totalExpenses) * 100) : 0,
      status,
    });
  }

  // Sort: highest spent first
  categorySummaries.sort((a, b) => b.actualSpent - a.actualSpent);

  // Previous month comparison
  let previousMonthSummary = null;
  if (previousMonthTransactions.length > 0) {
    let prevIncome = 0;
    let prevExpenses = 0;
    for (const tx of previousMonthTransactions) {
      const amt = parseFloat(tx.amount) || 0;
      if (tx.type === 'income') prevIncome += amt;
      else prevExpenses += amt;
    }

    const expenseDelta = totalExpenses - prevExpenses;
    const expenseDeltaPct = prevExpenses > 0
      ? Math.round(((totalExpenses - prevExpenses) / prevExpenses) * 1000) / 10
      : null;

    previousMonthSummary = {
      previousTotalIncome: prevIncome,
      previousTotalExpenses: prevExpenses,
      expenseDelta,
      expenseDeltaPct,
      hasData: true,
    };
  } else {
    previousMonthSummary = {
      previousTotalIncome: 0,
      previousTotalExpenses: 0,
      expenseDelta: 0,
      expenseDeltaPct: null,
      hasData: false,
    };
  }

  // Generate verified spending insights
  const insights = [];

  // Insight 1: Highest spending category
  if (categorySummaries.length > 0 && categorySummaries[0].actualSpent > 0) {
    const top = categorySummaries[0];
    insights.push({
      type: 'top_category',
      severity: 'info',
      title: `Top Spending Category: ${top.category}`,
      message: `${top.category} represents ₹${top.actualSpent.toLocaleString('en-IN')} (${top.percentageOfTotalExpenses}% of your total spending this month across ${top.transactionCount} transactions).`,
      traceableValue: top.actualSpent,
    });
  }

  // Insight 2: Over-budget categories
  const exceededCats = categorySummaries.filter((c) => c.status === 'exceeded');
  for (const c of exceededCats) {
    const overAmt = c.actualSpent - c.budgetLimit;
    insights.push({
      type: 'budget_exceeded',
      severity: 'danger',
      title: `${c.category} Budget Exceeded`,
      message: `You spent ₹${c.actualSpent.toLocaleString('en-IN')} against a ₹${c.budgetLimit.toLocaleString('en-IN')} limit, exceeding the budget by ₹${overAmt.toLocaleString('en-IN')} (${c.percentUsed}% used).`,
      traceableValue: overAmt,
    });
  }

  // Insight 3: Near-budget categories
  const warningCats = categorySummaries.filter((c) => c.status === 'warning');
  for (const c of warningCats) {
    insights.push({
      type: 'budget_warning',
      severity: 'warning',
      title: `${c.category} Near Limit`,
      message: `You have consumed ${c.percentUsed}% of your ${c.category} budget (₹${c.actualSpent.toLocaleString('en-IN')} of ₹${c.budgetLimit.toLocaleString('en-IN')}). ₹${c.remaining.toLocaleString('en-IN')} remaining.`,
      traceableValue: c.remaining,
    });
  }

  // Insight 4: Large single expenses (> 30% of total expenses or > ₹5,000)
  for (const tx of expenseTxs) {
    if (totalExpenses > 0 && tx.amount >= totalExpenses * 0.35 && totalExpenses > 2000) {
      insights.push({
        type: 'large_expense',
        severity: 'info',
        title: `Significant Single Expense: ${tx.category}`,
        message: `A single expense of ₹${tx.amount.toLocaleString('en-IN')} on ${new Date(tx.date).toLocaleDateString('en-IN')}${tx.description ? ` ("${tx.description}")` : ''} accounts for ${Math.round((tx.amount / totalExpenses) * 100)}% of your monthly expenses.`,
        traceableValue: tx.amount,
      });
      break; // highlight the top single expense
    }
  }

  // Insight 5: Month-over-month comparison
  if (previousMonthSummary.hasData && previousMonthSummary.expenseDeltaPct !== null) {
    const delta = previousMonthSummary.expenseDelta;
    const deltaPct = previousMonthSummary.expenseDeltaPct;
    if (Math.abs(delta) > 0) {
      insights.push({
        type: 'month_comparison',
        severity: delta > 0 ? 'warning' : 'success',
        title: delta > 0 ? 'Monthly Spending Increased' : 'Monthly Spending Decreased',
        message: delta > 0
          ? `Expenses are ₹${Math.abs(delta).toLocaleString('en-IN')} (+${deltaPct}%) higher than last month's ₹${previousMonthSummary.previousTotalExpenses.toLocaleString('en-IN')}.`
          : `Great job! Expenses are ₹${Math.abs(delta).toLocaleString('en-IN')} (${deltaPct}%) lower than last month's ₹${previousMonthSummary.previousTotalExpenses.toLocaleString('en-IN')}.`,
        traceableValue: delta,
      });
    }
  }

  // Insight 6: Savings goal achievement
  if (savingsGoal > 0) {
    if (netCashFlow >= savingsGoal) {
      insights.push({
        type: 'savings_achievement',
        severity: 'success',
        title: 'Monthly Savings Target Achievable',
        message: `Your net cash flow (₹${netCashFlow.toLocaleString('en-IN')}) currently covers your monthly savings target of ₹${savingsGoal.toLocaleString('en-IN')}.`,
        traceableValue: netCashFlow,
      });
    } else if (netCashFlow > 0) {
      const shortfall = savingsGoal - netCashFlow;
      insights.push({
        type: 'savings_gap',
        severity: 'warning',
        title: 'Savings Goal Shortfall',
        message: `Current net cash flow (₹${netCashFlow.toLocaleString('en-IN')}) is ₹${shortfall.toLocaleString('en-IN')} short of your ₹${savingsGoal.toLocaleString('en-IN')} savings goal.`,
        traceableValue: shortfall,
      });
    } else if (totalExpenses > totalIncome && totalIncome > 0) {
      insights.push({
        type: 'negative_cashflow',
        severity: 'danger',
        title: 'Deficit Alert',
        message: `Expenses exceed income by ₹${Math.abs(netCashFlow).toLocaleString('en-IN')}. Consider reducing non-essential expenses to avoid dipping into past reserves.`,
        traceableValue: netCashFlow,
      });
    }
  }

  // If no transactions logged yet
  if (currentMonthTransactions.length === 0) {
    insights.push({
      type: 'no_data',
      severity: 'info',
      title: 'No Transactions Logged',
      message: 'Log your daily income and expenses using the "Add Transaction" button to activate automated insights, category tracking, and cash-flow analytics.',
      traceableValue: 0,
    });
  }

  // Actionable monthly budget plan
  const daysRemaining = getDaysRemainingInMonth(month);
  const remainingAllowance = spendingBudget > 0 ? remainingSpendingBudget : netCashFlow;
  const suggestedDailyAllowance = remainingAllowance > 0
    ? Math.max(0, Math.round(remainingAllowance / daysRemaining))
    : 0;
  const suggestedWeeklyAllowance = suggestedDailyAllowance * 7;

  const actionPlan = {
    daysRemaining,
    remainingBudget: remainingSpendingBudget,
    hasSpendingBudget: spendingBudget > 0,
    suggestedDailyAllowance,
    suggestedWeeklyAllowance,
    allowanceBasis: spendingBudget > 0 ? 'Configured monthly spending budget' : 'Current net cash flow',
    focusCategories: exceededCats.length > 0
      ? exceededCats.map((c) => c.category)
      : warningCats.map((c) => c.category),
    practicalRecommendation: exceededCats.length > 0
      ? `Pause discretionary purchases in ${exceededCats.map((c) => c.category).join(', ')} for the remaining ${daysRemaining} days to bring spending back in line.`
      : suggestedDailyAllowance > 0
      ? `Maintain spending under ₹${suggestedDailyAllowance.toLocaleString('en-IN')}/day for the remaining ${daysRemaining} days to stay comfortably within your targets.`
      : 'Review your budget limits or log upcoming income to plan your daily spending allowance.',
  };

  return {
    month: month || 'current',
    totalIncome,
    totalExpenses,
    netCashFlow,
    monthlyIncomeConfigured: configuredIncome,
    monthlyBudget: spendingBudget,
    remainingSpendingBudget,
    budgetUtilizationPct,
    savingsRatePct,
    savingsGoal,
    savingsGoalProgress: {
      availableForSavings: Math.max(0, netCashFlow),
      targetAmount: savingsGoal,
      progressPct: savingsProgressPct,
      description: savingsProgressDescription,
    },
    categorySummaries,
    previousMonthComparison: previousMonthSummary,
    insights,
    actionPlan,
    transactionCount: currentMonthTransactions.length,
    incomeCount: incomeTxs.length,
    expenseCount: expenseTxs.length,
  };
}
