import { useState, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Wallet, LayoutDashboard, PiggyBank, BookOpen,
  TrendingUp, TrendingDown, Plus, Trash2, CheckCircle2,
  Target, ArrowRight, RefreshCw, Edit3, X, Save,
  AlertTriangle, AlertCircle, Sliders, Calendar,
  PieChart as PieChartIcon, BarChart3, Zap,
  Compass
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import toast from "react-hot-toast";
import {
  getTransactions, createTransaction, updateTransaction, deleteTransaction,
  getFinancialSummary, getSavingsGoals, createSavingsGoal,
  updateSavingsGoal, deleteSavingsGoal,
  getBudgetSettings, updateBudgetSettings, getFinancialAnalytics
} from "../../services/financeService";
import LoadingSpinner from "../../components/common/LoadingSpinner";

/* ─── colour tokens (matching app theme) ─── */
const C = {
  brand: "#8C3737",
  brandBg: "#F6EFEA",
  brandLight: "#FBF9F7",
  ink: "#1E1B18",
  muted: "#4F4A45",
  faint: "#78726B",
  border: "#EDE6E2",
  success: "#2D6A4F",
  successBg: "#D8F3DC",
  danger: "#BA2626",
  dangerBg: "#FDF2F2",
  incomeGreen: "#2D6A4F",
  expenseRed: "#BA2626",
};

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "budget",    label: "Budget Tracker", icon: Wallet },
  { id: "savings",   label: "Savings Goals", icon: PiggyBank },
  { id: "tips",      label: "Financial Tips", icon: BookOpen },
];

const EXPENSE_CATEGORIES = [
  "Food & Groceries","Rent & Housing","Utilities","Transport","Healthcare",
  "Education","Clothing","Entertainment","Savings","Investments","EMI / Loan",
  "Personal Care","Gifts & Donations","Business","Other",
];
const INCOME_CATEGORIES = [
  "Salary","Freelance","Business Income","Investments","Rental Income",
  "Scholarship / Grant","Gift","Other",
];

/* ── helpers ── */
const fmt = (n) => `₹${Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
const monthLabel = (m) => {
  if (!m) return "";
  const [y, mo] = m.split("-");
  return new Date(Number(y), Number(mo) - 1).toLocaleString("default", { month: "long", year: "numeric" });
};

/* ════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════ */
export default function FinancialCoach() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = useMemo(() => {
    const t = searchParams.get("tab");
    return TABS.find(x => x.id === t) ? t : "dashboard";
  }, [searchParams]);

  const setTab = (id) => setSearchParams({ tab: id });

  return (
    <div className="min-h-screen space-y-6" style={{ color: C.ink }}>
      <div className="mx-auto max-w-6xl space-y-6">

        {/* ── Header Banner ── */}
        <div className="rounded-xl border bg-white p-6 sm:p-8 shadow-xs" style={{ borderColor: C.border }}>
          <div className="mb-2 inline-flex items-center gap-2 rounded-md px-2.5 py-1 text-xs font-semibold"
            style={{ background: C.brandBg, color: C.brand }}>
            <Wallet className="h-3.5 w-3.5" />
            <span>Financial Empowerment</span>
          </div>
          <h1 className="font-serif text-2xl font-bold tracking-tight sm:text-3xl">Financial Coach</h1>
          <p className="mt-1 text-xs sm:text-sm" style={{ color: C.muted }}>
            Track income &amp; expenses, grow your savings, and build financial confidence — all in one place.
          </p>
        </div>

        {/* ── Tab Bar ── */}
        <div className="rounded-xl border bg-white p-2 shadow-xs" style={{ borderColor: C.border }}>
          <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
            {TABS.map(({ id, label, icon: Icon }) => {
              const active = activeTab === id;
              return (
                <button key={id} onClick={() => setTab(id)}
                  className="flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
                  style={active
                    ? { background: C.brand, color: "#fff" }
                    : { color: C.muted }}>
                  <Icon className="h-4 w-4" style={active ? { color: "#fff" } : { color: C.faint }} />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Tab Content ── */}
        <div className="rounded-xl border bg-white p-6 sm:p-8 shadow-xs" style={{ borderColor: C.border }}>
          {activeTab === "dashboard" && <DashboardTab />}
          {activeTab === "budget"    && <BudgetTab />}
          {activeTab === "savings"   && <SavingsTab />}
          {activeTab === "tips"      && <TipsTab />}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   DASHBOARD TAB
════════════════════════════════════════════════════════ */
function DashboardTab() {
  const [month, setMonth] = useState(currentMonth());
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentTx, setRecentTx] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, tx] = await Promise.all([
        getFinancialSummary(month),
        getTransactions({ month, limit: 5 }),
      ]);
      setSummary(s.summary);
      setRecentTx(tx.transactions || []);
    } catch {
      toast.error("Could not load financial summary.");
    } finally {
      setLoading(false);
    }
  }, [month]);

  if (loading) return <LoadingSpinner label="Loading your financial data…" />;

  const balance = summary?.balance ?? 0;
  const balancePositive = balance >= 0;

  return (
    <div className="space-y-6">
      {/* Month picker */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-xl font-bold" style={{ color: C.ink }}>Financial Overview</h2>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium" style={{ color: C.muted }}>Month</label>
          <input type="month" value={month} onChange={e => setMonth(e.target.value)}
            className="rounded-lg border px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2"
            style={{ borderColor: C.border, color: C.ink }} />
          <button onClick={load} className="rounded-lg p-1.5 transition hover:opacity-70"
            style={{ color: C.faint }} title="Refresh"><RefreshCw className="h-4 w-4" /></button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Total Income" value={fmt(summary?.totalIncome ?? 0)}
          icon={TrendingUp} iconColor={C.incomeGreen} bgColor="#D8F3DC" />
        <KpiCard label="Total Expenses" value={fmt(summary?.totalExpenses ?? 0)}
          icon={TrendingDown} iconColor={C.expenseRed} bgColor={C.dangerBg} />
        <KpiCard label="Net Balance" value={(balancePositive ? "+" : "-") + fmt(balance)}
          icon={Wallet} iconColor={balancePositive ? C.incomeGreen : C.expenseRed}
          bgColor={balancePositive ? "#D8F3DC" : C.dangerBg}
          highlight />
      </div>

      {/* Spending breakdown */}
      {summary?.breakdown?.length > 0 && (
        <div>
          <h3 className="mb-3 font-semibold text-sm" style={{ color: C.ink }}>Spending by Category</h3>
          <div className="space-y-2">
            {summary.breakdown.slice(0, 8).map(({ category, amount }) => {
              const pct = summary.totalExpenses > 0
                ? Math.round((amount / summary.totalExpenses) * 100) : 0;
              return (
                <div key={category}>
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: C.muted }}>{category}</span>
                    <span className="font-semibold" style={{ color: C.ink }}>{fmt(amount)} <span style={{ color: C.faint }}>({pct}%)</span></span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: C.brandBg }}>
                    <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: C.brand }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div>
        <h3 className="mb-3 font-semibold text-sm" style={{ color: C.ink }}>Recent Transactions</h3>
        {recentTx.length === 0
          ? <EmptyState icon={Wallet} message="No transactions for this month. Add one in the Budget Tracker tab." />
          : (
            <div className="divide-y" style={{ borderColor: C.border }}>
              {recentTx.map(tx => (
                <div key={tx._id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium" style={{ color: C.ink }}>{tx.category}</p>
                    {tx.description && <p className="text-xs" style={{ color: C.faint }}>{tx.description}</p>}
                    <p className="text-xs" style={{ color: C.faint }}>{new Date(tx.date).toLocaleDateString("en-IN")}</p>
                  </div>
                  <span className="text-sm font-bold" style={{ color: tx.type === "income" ? C.incomeGreen : C.expenseRed }}>
                    {tx.type === "income" ? "+" : "−"}{fmt(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
      </div>

      {summary?.transactionCount === 0 && (
        <div className="rounded-lg p-4 text-sm" style={{ background: C.brandBg, color: C.brand }}>
          💡 You haven't logged any transactions for {monthLabel(month)}. Switch to <strong>Budget Tracker</strong> to get started.
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   BUDGET TRACKER TAB (ENHANCED & DATA-DRIVEN)
════════════════════════════════════════════════════════ */
const CHART_COLORS = [
  "#8C3737", "#2D6A4F", "#D97706", "#2563EB", "#7C3AED",
  "#DB2777", "#059669", "#EA580C", "#4B5563", "#0891B2"
];

function BudgetTab() {
  const [txs, setTxs] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(currentMonth());
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  // Modals & form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [savingTx, setSavingTx] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  const [txForm, setTxForm] = useState({
    type: "expense",
    amount: "",
    category: EXPENSE_CATEGORIES[0],
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  const [settingsForm, setSettingsForm] = useState({
    monthlyIncome: "",
    monthlyBudget: "",
    savingsGoal: "",
    categoryBudgets: {},
  });

  // Load all financial data for active month
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const txParams = { month };
      if (filterType !== "all") txParams.type = filterType;
      if (filterCategory !== "all") txParams.category = filterCategory;

      const [txRes, analyticsRes, settingsRes] = await Promise.all([
        getTransactions(txParams),
        getFinancialAnalytics(month),
        getBudgetSettings(month),
      ]);

      setTxs(txRes.transactions || []);
      setAnalytics(analyticsRes.analytics || null);

      const b = settingsRes.budget || {};

      // Pre-fill settings form
      const catMap = {};
      if (Array.isArray(b.categoryBudgets)) {
        b.categoryBudgets.forEach((cb) => {
          if (cb.category) catMap[cb.category] = cb.limit || "";
        });
      }

      setSettingsForm({
        monthlyIncome: b.monthlyIncome !== undefined ? String(b.monthlyIncome) : "",
        monthlyBudget: b.monthlyBudget !== undefined ? String(b.monthlyBudget) : "",
        savingsGoal: b.savingsGoal !== undefined ? String(b.savingsGoal) : "",
        categoryBudgets: catMap,
      });
    } catch {
      toast.error("Could not load financial data.");
    } finally {
      setLoading(false);
    }
  }, [month, filterType, filterCategory]);

  // Create Transaction
  const handleCreateTx = async (e) => {
    e.preventDefault();
    if (!txForm.amount || parseFloat(txForm.amount) <= 0) {
      return toast.error("Enter a valid positive amount.");
    }
    setSavingTx(true);
    try {
      await createTransaction(txForm);
      toast.success("Transaction added!");
      setShowAddModal(false);
      setTxForm({
        type: "expense",
        amount: "",
        category: EXPENSE_CATEGORIES[0],
        description: "",
        date: new Date().toISOString().split("T")[0],
      });
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save transaction.");
    } finally {
      setSavingTx(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (tx) => {
    setEditingTx(tx);
    setTxForm({
      type: tx.type,
      amount: String(tx.amount),
      category: tx.category,
      description: tx.description || "",
      date: new Date(tx.date).toISOString().split("T")[0],
    });
  };

  // Update Transaction
  const handleUpdateTx = async (e) => {
    e.preventDefault();
    if (!editingTx) return;
    if (!txForm.amount || parseFloat(txForm.amount) <= 0) {
      return toast.error("Enter a valid positive amount.");
    }
    setSavingTx(true);
    try {
      await updateTransaction(editingTx._id, txForm);
      toast.success("Transaction updated!");
      setEditingTx(null);
      setTxForm({
        type: "expense",
        amount: "",
        category: EXPENSE_CATEGORIES[0],
        description: "",
        date: new Date().toISOString().split("T")[0],
      });
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update transaction.");
    } finally {
      setSavingTx(false);
    }
  };

  // Delete Transaction
  const handleDeleteTx = async (id) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;
    try {
      await deleteTransaction(id);
      toast.success("Transaction deleted.");
      await loadData();
    } catch {
      toast.error("Could not delete transaction.");
    }
  };

  // Save Budget Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const categoryBudgetsList = Object.entries(settingsForm.categoryBudgets)
        .filter(([cat, limit]) => cat && parseFloat(limit) > 0)
        .map(([category, limit]) => ({
          category,
          limit: parseFloat(limit),
        }));

      await updateBudgetSettings({
        month,
        monthlyIncome: parseFloat(settingsForm.monthlyIncome) || 0,
        monthlyBudget: parseFloat(settingsForm.monthlyBudget) || 0,
        savingsGoal: parseFloat(settingsForm.savingsGoal) || 0,
        categoryBudgets: categoryBudgetsList,
      });

      toast.success("Budget settings saved!");
      setShowSettingsModal(false);
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save budget settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  // Chart data preparation
  const comparisonBarData = analytics ? [
    { name: "Total Income", amount: analytics.totalIncome, fill: C.incomeGreen },
    { name: "Total Expenses", amount: analytics.totalExpenses, fill: C.expenseRed },
    ...(analytics.monthlyBudget > 0 ? [{ name: "Spending Budget", amount: analytics.monthlyBudget, fill: C.brand }] : []),
  ] : [];

  const categoryPieData = analytics?.categorySummaries
    ? analytics.categorySummaries
        .filter((c) => c.actualSpent > 0)
        .map((c, i) => ({
          name: c.category,
          value: c.actualSpent,
          color: CHART_COLORS[i % CHART_COLORS.length],
        }))
    : [];

  const activeCategories = txForm.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="space-y-6">
      {/* ── 1. Controls Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b" style={{ borderColor: C.border }}>
        <div>
          <h2 className="font-serif text-xl font-bold" style={{ color: C.ink }}>Budget Tracker</h2>
          <p className="text-xs" style={{ color: C.faint }}>
            Track real cash flow, monitor category caps, and view automated spending insights for {monthLabel(month)}.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Month selector */}
          <div className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 bg-white text-xs" style={{ borderColor: C.border }}>
            <Calendar className="h-3.5 w-3.5" style={{ color: C.brand }} />
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="focus:outline-none text-xs font-medium cursor-pointer"
              style={{ color: C.ink }}
            />
          </div>

          {/* Configure Budget Settings Button */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold bg-white transition hover:bg-[#F9F6F3]"
            style={{ borderColor: C.border, color: C.ink }}
          >
            <Sliders className="h-3.5 w-3.5" style={{ color: C.brand }} />
            <span>Budget Settings</span>
          </button>

          {/* Add Transaction Button */}
          <button
            onClick={() => {
              setEditingTx(null);
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 shadow-xs"
            style={{ background: C.brand }}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner label="Calculating financial analytics…" />
      ) : (
        <>
          {/* ── 2. Monthly Financial Overview Cards ── */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Income */}
            <div className="rounded-xl border p-4 bg-white shadow-xs" style={{ borderColor: C.border }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold" style={{ color: C.faint }}>Total Income</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-full" style={{ background: C.successBg }}>
                  <TrendingUp className="h-4 w-4" style={{ color: C.incomeGreen }} />
                </div>
              </div>
              <div className="mt-2 text-2xl font-bold font-serif" style={{ color: C.incomeGreen }}>
                +{fmt(analytics?.totalIncome ?? 0)}
              </div>
              <p className="mt-1 text-[11px]" style={{ color: C.faint }}>
                {analytics?.incomeCount ?? 0} income credits logged
              </p>
            </div>

            {/* Total Expenses */}
            <div className="rounded-xl border p-4 bg-white shadow-xs" style={{ borderColor: C.border }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold" style={{ color: C.faint }}>Total Expenses</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-full" style={{ background: C.dangerBg }}>
                  <TrendingDown className="h-4 w-4" style={{ color: C.expenseRed }} />
                </div>
              </div>
              <div className="mt-2 text-2xl font-bold font-serif" style={{ color: C.expenseRed }}>
                −{fmt(analytics?.totalExpenses ?? 0)}
              </div>
              <p className="mt-1 text-[11px]" style={{ color: C.faint }}>
                {analytics?.expenseCount ?? 0} expense debits logged
              </p>
            </div>

            {/* Net Cash Flow */}
            <div className="rounded-xl border p-4 bg-white shadow-xs" style={{ borderColor: C.border }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold" style={{ color: C.faint }}>Net Cash Flow</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-full" style={{ background: C.brandBg }}>
                  <Wallet className="h-4 w-4" style={{ color: C.brand }} />
                </div>
              </div>
              <div
                className="mt-2 text-2xl font-bold font-serif"
                style={{ color: (analytics?.netCashFlow ?? 0) >= 0 ? C.incomeGreen : C.expenseRed }}
              >
                {(analytics?.netCashFlow ?? 0) >= 0 ? "+" : "−"}{fmt(analytics?.netCashFlow ?? 0)}
              </div>
              <p className="mt-1 text-[11px]" style={{ color: C.faint }}>
                Income minus expenses this month
              </p>
            </div>

            {/* Remaining Spending Budget */}
            <div className="rounded-xl border p-4 bg-white shadow-xs" style={{ borderColor: C.border }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold" style={{ color: C.faint }}>Remaining Budget</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-full" style={{ background: "#EDE6E2" }}>
                  <Target className="h-4 w-4" style={{ color: C.brand }} />
                </div>
              </div>
              <div
                className="mt-2 text-2xl font-bold font-serif"
                style={{ color: (analytics?.remainingSpendingBudget ?? 0) >= 0 ? C.ink : C.expenseRed }}
              >
                {fmt(analytics?.remainingSpendingBudget ?? 0)}
              </div>
              <p className="mt-1 text-[11px]" style={{ color: C.faint }}>
                {analytics?.monthlyBudget > 0
                  ? `Limit: ${fmt(analytics.monthlyBudget)} (${analytics.budgetUtilizationPct}% used)`
                  : "No overall monthly budget set"}
              </p>
            </div>
          </div>

          {/* Savings Goal Progress Banner */}
          {analytics?.savingsGoal > 0 && (
            <div className="rounded-xl border p-4 bg-white shadow-xs" style={{ borderColor: C.border }}>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <PiggyBank className="h-4 w-4" style={{ color: C.brand }} />
                  <span className="text-xs font-bold" style={{ color: C.ink }}>
                    Monthly Savings Goal Progress: {fmt(analytics.savingsGoalProgress?.availableForSavings ?? 0)} / {fmt(analytics.savingsGoal)}
                  </span>
                </div>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    background: analytics.savingsGoalProgress?.progressPct >= 100 ? C.successBg : "#FEF3C7",
                    color: analytics.savingsGoalProgress?.progressPct >= 100 ? C.success : "#B45309",
                  }}
                >
                  {analytics.savingsGoalProgress?.progressPct}% Goal Achieved
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden mb-2" style={{ background: "#EDE6E2" }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.max(0, analytics.savingsGoalProgress?.progressPct ?? 0))}%`,
                    background: analytics.savingsGoalProgress?.progressPct >= 100 ? C.success : C.brand,
                  }}
                />
              </div>
              <p className="text-[11px] leading-relaxed" style={{ color: C.faint }}>
                ℹ️ {analytics.savingsGoalProgress?.description}
              </p>
            </div>
          )}

          {/* ── 3. Category Budgets & Spending Progress ── */}
          <div className="rounded-xl border p-5 bg-white shadow-xs" style={{ borderColor: C.border }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif text-base font-bold" style={{ color: C.ink }}>
                  Category Budgets &amp; Spending Caps
                </h3>
                <p className="text-xs" style={{ color: C.faint }}>
                  Real-time spending progress vs configured limits for {monthLabel(month)}.
                </p>
              </div>
              <button
                onClick={() => setShowSettingsModal(true)}
                className="text-xs font-medium hover:underline flex items-center gap-1"
                style={{ color: C.brand }}
              >
                <span>Edit Category Limits</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {(!analytics?.categorySummaries || analytics.categorySummaries.length === 0) ? (
              <p className="text-xs italic py-4 text-center" style={{ color: C.faint }}>
                No category activity recorded for this month. Log an expense or configure limits in Budget Settings.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {analytics.categorySummaries.map((catItem) => {
                  const isExceeded = catItem.status === "exceeded";
                  const isWarning = catItem.status === "warning";
                  const isUnbudgeted = catItem.status === "unbudgeted";

                  const barColor = isExceeded ? C.danger : isWarning ? "#D97706" : isUnbudgeted ? "#9CA3AF" : C.success;
                  return (
                    <div
                      key={catItem.category}
                      className="rounded-lg border p-3.5 space-y-2 transition-all hover:shadow-xs"
                      style={{ borderColor: isExceeded ? "#FCA5A5" : C.border, background: isExceeded ? "#FFF5F5" : "#FFFFFF" }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs truncate max-w-[150px]" style={{ color: C.ink }}>
                          {catItem.category}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {isExceeded && (
                            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-red-100 text-red-700">
                              Exceeded
                            </span>
                          )}
                          {isWarning && (
                            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                              Near Cap
                            </span>
                          )}
                          {isUnbudgeted && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                              No Cap
                            </span>
                          )}
                          <span className="text-xs font-bold" style={{ color: barColor }}>
                            {catItem.hasLimit ? `${catItem.percentUsed}%` : fmt(catItem.actualSpent)}
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#EDE6E2" }}>
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: catItem.hasLimit ? `${Math.min(100, Math.max(3, catItem.percentUsed))}%` : "100%",
                            background: barColor,
                          }}
                        />
                      </div>

                      {/* Footer numbers */}
                      <div className="flex items-center justify-between text-[11px]" style={{ color: C.faint }}>
                        <span>Spent: {fmt(catItem.actualSpent)}</span>
                        <span>
                          {catItem.hasLimit
                            ? isExceeded
                              ? `Over by ${fmt(catItem.actualSpent - catItem.budgetLimit)}`
                              : `${fmt(catItem.remaining)} left of ${fmt(catItem.budgetLimit)}`
                            : "Unbudgeted"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── 4. Spending Insights & Action Plan ── */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Real Spending Insights */}
            <div className="rounded-xl border p-5 bg-white shadow-xs space-y-3" style={{ borderColor: C.border }}>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" style={{ color: C.brand }} />
                <h3 className="font-serif text-base font-bold" style={{ color: C.ink }}>
                  Spending Insights
                </h3>
              </div>
              <p className="text-xs" style={{ color: C.faint }}>
                Automated patterns and observations grounded directly in your recorded transactions.
              </p>

              {(!analytics?.insights || analytics.insights.length === 0) ? (
                <p className="text-xs italic py-2" style={{ color: C.faint }}>No insights available.</p>
              ) : (
                <div className="space-y-2.5 mt-2">
                  {analytics.insights.map((insight, idx) => {
                    const isDanger = insight.severity === "danger";
                    const isWarn = insight.severity === "warning";
                    const isSuccess = insight.severity === "success";

                    return (
                      <div
                        key={idx}
                        className="rounded-lg border p-3 text-xs leading-relaxed"
                        style={{
                          borderColor: isDanger ? "#FECACA" : isWarn ? "#FDE68A" : isSuccess ? "#A7F3D0" : C.border,
                          background: isDanger ? "#FEF2F2" : isWarn ? "#FFFBEB" : isSuccess ? C.successBg : C.brandLight,
                        }}
                      >
                        <div className="flex items-center gap-1.5 font-bold mb-1">
                          {isDanger && <AlertCircle className="h-3.5 w-3.5 text-red-600" />}
                          {isWarn && <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />}
                          {isSuccess && <CheckCircle2 className="h-3.5 w-3.5 text-green-700" />}
                          <span style={{ color: isDanger ? "#991B1B" : isWarn ? "#92400E" : isSuccess ? "#065F46" : C.ink }}>
                            {insight.title}
                          </span>
                        </div>
                        <p style={{ color: isDanger ? "#7F1D1D" : isWarn ? "#78350F" : isSuccess ? "#047857" : C.muted }}>
                          {insight.message}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Actionable Monthly Budget Plan */}
            <div className="rounded-xl border p-5 bg-white shadow-xs space-y-3" style={{ borderColor: C.border }}>
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4" style={{ color: C.brand }} />
                <h3 className="font-serif text-base font-bold" style={{ color: C.ink }}>
                  Monthly Budget Action Plan
                </h3>
              </div>
              <p className="text-xs" style={{ color: C.faint }}>
                Day-to-day pacing guidance based on days left in {monthLabel(month)}.
              </p>

              {analytics?.actionPlan ? (
                <div className="space-y-3 mt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border p-3 text-center" style={{ borderColor: C.border, background: C.brandLight }}>
                      <span className="text-[11px] block" style={{ color: C.faint }}>Suggested Daily Allowance</span>
                      <span className="text-lg font-bold font-serif mt-0.5 block" style={{ color: C.brand }}>
                        {fmt(analytics.actionPlan.suggestedDailyAllowance)} / day
                      </span>
                      <span className="text-[10px]" style={{ color: C.faint }}>
                        {analytics.actionPlan.daysRemaining} days remaining
                      </span>
                    </div>

                    <div className="rounded-lg border p-3 text-center" style={{ borderColor: C.border, background: C.brandLight }}>
                      <span className="text-[11px] block" style={{ color: C.faint }}>Weekly Target Allowance</span>
                      <span className="text-lg font-bold font-serif mt-0.5 block" style={{ color: C.brand }}>
                        {fmt(analytics.actionPlan.suggestedWeeklyAllowance)} / week
                      </span>
                      <span className="text-[10px]" style={{ color: C.faint }}>
                        7-day spending pacing
                      </span>
                    </div>
                  </div>

                  <div className="rounded-lg border p-3 text-xs leading-relaxed" style={{ borderColor: C.border, background: "#FAF7F5" }}>
                    <div className="font-bold mb-1" style={{ color: C.ink }}>Practical Guidance:</div>
                    <p style={{ color: C.muted }}>{analytics.actionPlan.practicalRecommendation}</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs italic py-2" style={{ color: C.faint }}>No plan data available.</p>
              )}
            </div>
          </div>

          {/* ── 5. Charts & Visualizations ── */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Income vs Expenses Bar Chart */}
            <div className="rounded-xl border p-5 bg-white shadow-xs" style={{ borderColor: C.border }}>
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="h-4 w-4" style={{ color: C.brand }} />
                <h3 className="font-serif text-base font-bold" style={{ color: C.ink }}>
                  Cash Flow Comparison
                </h3>
              </div>
              {comparisonBarData.length === 0 || analytics?.totalIncome === 0 && analytics?.totalExpenses === 0 ? (
                <div className="h-48 flex items-center justify-center text-xs text-gray-400 italic">
                  Log income and expenses to view comparison chart
                </div>
              ) : (
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonBarData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${v}`} />
                      <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString("en-IN")}`, "Amount"]} />
                      <Bar dataKey="amount" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Expense Breakdown Donut Chart */}
            <div className="rounded-xl border p-5 bg-white shadow-xs" style={{ borderColor: C.border }}>
              <div className="flex items-center gap-2 mb-3">
                <PieChartIcon className="h-4 w-4" style={{ color: C.brand }} />
                <h3 className="font-serif text-base font-bold" style={{ color: C.ink }}>
                  Expense Category Distribution
                </h3>
              </div>
              {categoryPieData.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-xs text-gray-400 italic">
                  No expenses recorded for category breakdown
                </div>
              ) : (
                <div className="h-56 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                      >
                        {categoryPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString("en-IN")}`, "Spent"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* ── 6. Transaction History & Management ── */}
          <div className="rounded-xl border p-5 bg-white shadow-xs space-y-4" style={{ borderColor: C.border }}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-serif text-base font-bold" style={{ color: C.ink }}>
                  Transaction History ({txs.length})
                </h3>
                <p className="text-xs" style={{ color: C.faint }}>
                  Add, edit, or remove recorded debits and credits.
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="rounded-lg border px-2.5 py-1 text-xs bg-white focus:outline-none"
                  style={{ borderColor: C.border }}
                >
                  <option value="all">All Types</option>
                  <option value="income">Income Only</option>
                  <option value="expense">Expenses Only</option>
                </select>

                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="rounded-lg border px-2.5 py-1 text-xs bg-white focus:outline-none max-w-[140px]"
                  style={{ borderColor: C.border }}
                >
                  <option value="all">All Categories</option>
                  {[...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Transaction List */}
            {txs.length === 0 ? (
              <EmptyState icon={Wallet} message="No transactions match your current filters. Add one above." />
            ) : (
              <div className="divide-y rounded-xl border overflow-hidden" style={{ borderColor: C.border }}>
                {txs.map((tx) => (
                  <div key={tx._id} className="flex items-center gap-3 px-4 py-3 hover:bg-[#FAFAFA] transition-colors">
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                      style={{ background: tx.type === "income" ? C.successBg : C.dangerBg }}
                    >
                      {tx.type === "income" ? (
                        <TrendingUp className="h-4 w-4" style={{ color: C.incomeGreen }} />
                      ) : (
                        <TrendingDown className="h-4 w-4" style={{ color: C.expenseRed }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium" style={{ color: C.ink }}>{tx.category}</p>
                      {tx.description && <p className="truncate text-xs" style={{ color: C.faint }}>{tx.description}</p>}
                      <p className="text-xs" style={{ color: C.faint }}>
                        {new Date(tx.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <span
                      className="shrink-0 text-sm font-bold"
                      style={{ color: tx.type === "income" ? C.incomeGreen : C.expenseRed }}
                    >
                      {tx.type === "income" ? "+" : "−"}{fmt(tx.amount)}
                    </span>

                    {/* Edit & Delete Buttons */}
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => handleOpenEdit(tx)}
                        className="rounded-lg p-1.5 transition hover:bg-gray-100"
                        style={{ color: C.muted }}
                        title="Edit Transaction"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTx(tx._id)}
                        className="rounded-lg p-1.5 transition hover:bg-red-50 hover:text-red-600"
                        style={{ color: C.faint }}
                        title="Delete Transaction"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── ADD / EDIT TRANSACTION MODAL ── */}
      {(showAddModal || editingTx) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border animate-scaleUp" style={{ borderColor: C.border }}>
            <div className="flex items-center justify-between pb-3 border-b mb-4" style={{ borderColor: C.border }}>
              <h3 className="font-serif text-lg font-bold" style={{ color: C.ink }}>
                {editingTx ? "Edit Transaction" : "New Transaction"}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingTx(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={editingTx ? handleUpdateTx : handleCreateTx} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: C.muted }}>Type</label>
                  <select
                    value={txForm.type}
                    onChange={(e) =>
                      setTxForm((f) => ({
                        ...f,
                        type: e.target.value,
                        category: e.target.value === "income" ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0],
                      }))
                    }
                    className="w-full rounded-lg border px-3 py-2 text-sm bg-white focus:outline-none"
                    style={{ borderColor: C.border }}
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: C.muted }}>Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={txForm.amount}
                    onChange={(e) => setTxForm((f) => ({ ...f, amount: e.target.value }))}
                    placeholder="0.00"
                    className="w-full rounded-lg border px-3 py-2 text-sm bg-white focus:outline-none"
                    style={{ borderColor: C.border }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: C.muted }}>Category</label>
                <select
                  value={txForm.category}
                  onChange={(e) => setTxForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 text-sm bg-white focus:outline-none"
                  style={{ borderColor: C.border }}
                >
                  {activeCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: C.muted }}>Date</label>
                <input
                  type="date"
                  required
                  value={txForm.date}
                  onChange={(e) => setTxForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 text-sm bg-white focus:outline-none"
                  style={{ borderColor: C.border }}
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: C.muted }}>Description / Note (optional)</label>
                <input
                  type="text"
                  maxLength={200}
                  value={txForm.description}
                  onChange={(e) => setTxForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="e.g. Weekly grocery stock up"
                  className="w-full rounded-lg border px-3 py-2 text-sm bg-white focus:outline-none"
                  style={{ borderColor: C.border }}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: C.border }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingTx(null);
                  }}
                  className="rounded-lg border px-4 py-2 text-xs font-medium"
                  style={{ borderColor: C.border, color: C.muted }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTx}
                  className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white"
                  style={{ background: C.brand }}
                >
                  <Save className="h-3.5 w-3.5" />
                  {savingTx ? "Saving…" : editingTx ? "Update Transaction" : "Save Transaction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── BUDGET & GOALS SETTINGS MODAL ── */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border my-8 animate-scaleUp" style={{ borderColor: C.border }}>
            <div className="flex items-center justify-between pb-3 border-b mb-4" style={{ borderColor: C.border }}>
              <div>
                <h3 className="font-serif text-lg font-bold" style={{ color: C.ink }}>
                  Budget &amp; Savings Settings ({monthLabel(month)})
                </h3>
                <p className="text-xs" style={{ color: C.faint }}>
                  Customize your spending limits and goals for this month.
                </p>
              </div>
              <button onClick={() => setShowSettingsModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: C.muted }}>Expected Income (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={settingsForm.monthlyIncome}
                    onChange={(e) => setSettingsForm((f) => ({ ...f, monthlyIncome: e.target.value }))}
                    placeholder="e.g. 30000"
                    className="w-full rounded-lg border px-3 py-2 text-xs bg-white focus:outline-none"
                    style={{ borderColor: C.border }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: C.muted }}>Spending Budget (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={settingsForm.monthlyBudget}
                    onChange={(e) => setSettingsForm((f) => ({ ...f, monthlyBudget: e.target.value }))}
                    placeholder="e.g. 20000"
                    className="w-full rounded-lg border px-3 py-2 text-xs bg-white focus:outline-none"
                    style={{ borderColor: C.border }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: C.muted }}>Savings Goal (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={settingsForm.savingsGoal}
                    onChange={(e) => setSettingsForm((f) => ({ ...f, savingsGoal: e.target.value }))}
                    placeholder="e.g. 5000"
                    className="w-full rounded-lg border px-3 py-2 text-xs bg-white focus:outline-none"
                    style={{ borderColor: C.border }}
                  />
                </div>
              </div>

              {/* Category Spending Limits */}
              <div className="pt-2 border-t" style={{ borderColor: C.border }}>
                <h4 className="text-xs font-bold mb-2" style={{ color: C.ink }}>
                  Category Spending Limits (₹)
                </h4>
                <div className="grid gap-2 sm:grid-cols-2 max-h-56 overflow-y-auto pr-1">
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <div key={cat} className="flex items-center justify-between gap-2 p-1.5 rounded border" style={{ borderColor: C.border }}>
                      <span className="text-[11px] truncate" style={{ color: C.muted }}>{cat}</span>
                      <input
                        type="number"
                        min="0"
                        step="50"
                        value={settingsForm.categoryBudgets[cat] || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSettingsForm((f) => ({
                            ...f,
                            categoryBudgets: { ...f.categoryBudgets, [cat]: val },
                          }));
                        }}
                        placeholder="No limit"
                        className="w-24 rounded border px-2 py-1 text-xs text-right bg-white focus:outline-none"
                        style={{ borderColor: C.border }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t" style={{ borderColor: C.border }}>
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="rounded-lg border px-4 py-2 text-xs font-medium"
                  style={{ borderColor: C.border, color: C.muted }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white"
                  style={{ background: C.brand }}
                >
                  <Save className="h-3.5 w-3.5" />
                  {savingSettings ? "Saving…" : "Save Settings"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


/* ════════════════════════════════════════════════════════
   SAVINGS GOALS TAB
════════════════════════════════════════════════════════ */
function SavingsTab() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editGoal, setEditGoal] = useState(null); // goal being edited (for deposit)
  const [depositAmt, setDepositAmt] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", targetAmount: "", currentAmount: "", monthlyContribution: "", targetDate: "", notes: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await getSavingsGoals(); setGoals(r.goals || []); }
    catch { toast.error("Could not load savings goals."); }
    finally { setLoading(false); }
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.targetAmount) return toast.error("Name and target amount are required.");
    setSaving(true);
    try {
      await createSavingsGoal(form);
      toast.success("Goal created!");
      setShowForm(false);
      setForm({ name: "", targetAmount: "", currentAmount: "", monthlyContribution: "", targetDate: "", notes: "" });
      await load();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to create goal."); }
    finally { setSaving(false); }
  };

  const handleDeposit = async () => {
    if (!depositAmt || parseFloat(depositAmt) <= 0) return toast.error("Enter a valid amount.");
    const g = editGoal;
    const newAmt = g.currentAmount + parseFloat(depositAmt);
    try {
      await updateSavingsGoal(g._id, { currentAmount: newAmt });
      toast.success("Progress updated!");
      setEditGoal(null);
      setDepositAmt("");
      await load();
    } catch { toast.error("Could not update goal."); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this savings goal?")) return;
    try { await deleteSavingsGoal(id); toast.success("Goal deleted."); await load(); }
    catch { toast.error("Could not delete."); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl font-bold" style={{ color: C.ink }}>Savings Goals</h2>
        <button onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
          style={{ background: C.brand }}>
          <Plus className="h-3.5 w-3.5" /> New Goal
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="rounded-xl border p-5 space-y-4"
          style={{ borderColor: C.brand, background: C.brandBg }}>
          <h3 className="font-semibold text-sm" style={{ color: C.brand }}>New Savings Goal</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: "Goal Name", key: "name", type: "text", placeholder: "e.g. Emergency Fund" },
              { label: "Target Amount (₹)", key: "targetAmount", type: "number", placeholder: "50000" },
              { label: "Already Saved (₹)", key: "currentAmount", type: "number", placeholder: "0" },
              { label: "Monthly Contribution (₹)", key: "monthlyContribution", type: "number", placeholder: "2000" },
              { label: "Target Date", key: "targetDate", type: "date" },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-medium mb-1" style={{ color: C.muted }}>{label}</label>
                <input type={type} value={form[key]} placeholder={placeholder}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
                  style={{ borderColor: C.border }} />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: C.muted }}>Notes</label>
              <input type="text" value={form.notes} placeholder="Optional notes"
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
                style={{ borderColor: C.border }} />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)}
              className="rounded-lg border px-4 py-2 text-xs font-medium"
              style={{ borderColor: C.border, color: C.muted }}>Cancel</button>
            <button type="submit" disabled={saving}
              className="rounded-lg px-4 py-2 text-xs font-semibold text-white"
              style={{ background: C.brand }}>{saving ? "Saving…" : "Create Goal"}</button>
          </div>
        </form>
      )}

      {/* Deposit modal */}
      {editGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif font-bold text-base" style={{ color: C.ink }}>Add to "{editGoal.name}"</h3>
              <button onClick={() => { setEditGoal(null); setDepositAmt(""); }}><X className="h-4 w-4" style={{ color: C.faint }} /></button>
            </div>
            <p className="text-xs mb-3" style={{ color: C.muted }}>
              Current: {fmt(editGoal.currentAmount)} / {fmt(editGoal.targetAmount)}
            </p>
            <input type="number" min="1" value={depositAmt} placeholder="Amount to add (₹)"
              onChange={e => setDepositAmt(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2"
              style={{ borderColor: C.border }} />
            <button onClick={handleDeposit}
              className="w-full rounded-lg py-2 text-sm font-semibold text-white"
              style={{ background: C.brand }}>Add Savings</button>
          </div>
        </div>
      )}

      {loading ? <LoadingSpinner label="Loading goals…" /> : goals.length === 0
        ? <EmptyState icon={PiggyBank} message="No savings goals yet. Create one to start tracking your financial journey!" />
        : (
          <div className="grid gap-4 sm:grid-cols-2">
            {goals.map(g => {
              const pct = g.progressPct ?? 0;
              const complete = g.isCompleted;
              return (
                <div key={g._id} className="rounded-xl border p-5 flex flex-col gap-3"
                  style={{ borderColor: complete ? C.incomeGreen : C.border, background: complete ? "#F0FFF4" : C.brandLight }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {complete && <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: C.incomeGreen }} />}
                      <h3 className="font-semibold text-sm" style={{ color: C.ink }}>{g.name}</h3>
                    </div>
                    <div className="flex items-center gap-1">
                      {!complete && (
                        <button onClick={() => { setEditGoal(g); setDepositAmt(""); }}
                          className="rounded-lg p-1.5 transition hover:opacity-70"
                          style={{ color: C.brand }} title="Add savings">
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button onClick={() => handleDelete(g._id)}
                        className="rounded-lg p-1.5 transition hover:opacity-70"
                        style={{ color: C.faint }} title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span style={{ color: C.muted }}>{fmt(g.currentAmount)} saved</span>
                      <span className="font-semibold" style={{ color: C.ink }}>{pct}% · {fmt(g.targetAmount)} goal</span>
                    </div>
                    <div className="h-2 rounded-full" style={{ background: C.brandBg }}>
                      <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: complete ? C.incomeGreen : C.brand }} />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: C.faint }}>
                    {g.monthlyContribution > 0 && <span>₹{g.monthlyContribution.toLocaleString("en-IN")}/month</span>}
                    {g.targetDate && <span>Due {new Date(g.targetDate).toLocaleDateString("en-IN")}</span>}
                    {g.remaining > 0 && <span style={{ color: C.brand }}>{fmt(g.remaining)} to go</span>}
                  </div>
                  {g.notes && <p className="text-xs" style={{ color: C.muted }}>{g.notes}</p>}
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   FINANCIAL TIPS TAB (static, curated content)
════════════════════════════════════════════════════════ */
const TIPS = [
  { emoji: "💰", title: "50/30/20 Rule", desc: "Allocate 50% of income to needs, 30% to wants, and 20% to savings and debt repayment. A simple, proven budgeting framework." },
  { emoji: "🛡️", title: "Build an Emergency Fund", desc: "Aim to save 3–6 months of living expenses in a liquid, easily accessible account before investing." },
  { emoji: "📊", title: "Track Every Rupee", desc: "Use the Budget Tracker tab to log all income and expenses. Awareness is the first step to financial control." },
  { emoji: "📈", title: "Start Investing Early", desc: "Even small SIP investments of ₹500/month compounded over 20 years can grow significantly. Time is your greatest asset." },
  { emoji: "🎓", title: "Women & Financial Independence", desc: "Maintain a personal bank account and credit history separate from your spouse's. Financial independence is financial safety." },
  { emoji: "🏦", title: "Know Your Credit Score", desc: "Check your CIBIL score for free annually. A score above 750 opens better loan rates and financial opportunities." },
  { emoji: "🌱", title: "Pay Yourself First", desc: "Transfer a fixed savings amount the day you receive your salary — before spending on anything else." },
  { emoji: "🔍", title: "Review Subscriptions", desc: "Audit all recurring subscriptions every quarter. Cancelling unused ones is instant savings with zero effort." },
  { emoji: "📜", title: "Understand Your Benefits", desc: "If employed, check your employer's PF, gratuity, health insurance, and LTA benefits. These are part of your total compensation." },
  { emoji: "🏠", title: "Rent vs. Buy Wisely", desc: "Buying a home makes financial sense only if your EMI is ≤40% of monthly take-home and you plan to stay for 7+ years." },
  { emoji: "🎯", title: "Set SMART Financial Goals", desc: "Goals should be Specific, Measurable, Achievable, Relevant, and Time-bound. Vague goals rarely get achieved." },
  { emoji: "🤝", title: "Women's Specific Schemes", desc: "Explore Mahila Samridhi Yojana, Sukanya Samriddhi Yojana, and Pradhan Mantri Jan Dhan Yojana — designed to empower women financially." },
];

function TipsTab() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif text-xl font-bold" style={{ color: C.ink }}>Financial Tips for Women</h2>
        <p className="mt-1 text-sm" style={{ color: C.muted }}>
          Curated financial literacy guidance to help you build wealth, security, and independence.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {TIPS.map(({ emoji, title, desc }) => (
          <div key={title} className="rounded-xl border p-5 transition hover:shadow-md"
            style={{ borderColor: C.border, background: C.brandLight }}>
            <div className="text-2xl mb-2">{emoji}</div>
            <h3 className="font-semibold text-sm mb-1" style={{ color: C.ink }}>{title}</h3>
            <p className="text-xs leading-relaxed" style={{ color: C.muted }}>{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Shared sub-components ── */
function KpiCard({ label, value, icon: Icon, iconColor, bgColor, highlight }) {
  return (
    <div className="rounded-xl border p-5 flex items-start gap-4"
      style={{ borderColor: highlight ? iconColor : C.border, background: highlight ? bgColor : C.brandLight }}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ background: bgColor }}>
        <Icon className="h-5 w-5" style={{ color: iconColor }} />
      </div>
      <div>
        <p className="text-xs font-medium" style={{ color: C.muted }}>{label}</p>
        <p className="text-xl font-bold font-serif mt-0.5" style={{ color: highlight ? iconColor : C.ink }}>{value}</p>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, message }) {
  return (
    <div className="py-12 flex flex-col items-center gap-3 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: C.brandBg }}>
        <Icon className="h-6 w-6" style={{ color: C.brand }} />
      </div>
      <p className="text-sm max-w-xs" style={{ color: C.muted }}>{message}</p>
    </div>
  );
}
