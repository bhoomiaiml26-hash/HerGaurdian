import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Wallet, LayoutDashboard, PiggyBank, BookOpen,
  TrendingUp, TrendingDown, Plus, Trash2, CheckCircle2,
  Target, ArrowRight, RefreshCw, ChevronDown, Edit3, X, Save
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getTransactions, createTransaction, deleteTransaction,
  getFinancialSummary, getSavingsGoals, createSavingsGoal,
  updateSavingsGoal, deleteSavingsGoal
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

  useEffect(() => { load(); }, [load]);

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
   BUDGET TRACKER TAB
════════════════════════════════════════════════════════ */
function BudgetTab() {
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(currentMonth());
  const [filterType, setFilterType] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ type: "expense", amount: "", category: EXPENSE_CATEGORIES[0], description: "", date: new Date().toISOString().split("T")[0] });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { month };
      if (filterType !== "all") params.type = filterType;
      const res = await getTransactions(params);
      setTxs(res.transactions || []);
    } catch { toast.error("Could not load transactions."); }
    finally { setLoading(false); }
  }, [month, filterType]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || parseFloat(form.amount) <= 0) return toast.error("Enter a valid amount.");
    setSaving(true);
    try {
      await createTransaction(form);
      toast.success("Transaction added!");
      setShowForm(false);
      setForm({ type: "expense", amount: "", category: EXPENSE_CATEGORIES[0], description: "", date: new Date().toISOString().split("T")[0] });
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save transaction.");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this transaction?")) return;
    try {
      await deleteTransaction(id);
      toast.success("Deleted.");
      await load();
    } catch { toast.error("Could not delete."); }
  };

  const cats = form.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="space-y-5">
      {/* Controls row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-xl font-bold" style={{ color: C.ink }}>Budget Tracker</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <input type="month" value={month} onChange={e => setMonth(e.target.value)}
            className="rounded-lg border px-3 py-1.5 text-xs focus:outline-none"
            style={{ borderColor: C.border, color: C.ink }} />
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="rounded-lg border px-3 py-1.5 text-xs focus:outline-none"
            style={{ borderColor: C.border, color: C.ink }}>
            <option value="all">All</option>
            <option value="income">Income</option>
            <option value="expense">Expenses</option>
          </select>
          <button onClick={() => setShowForm(s => !s)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
            style={{ background: C.brand }}>
            <Plus className="h-3.5 w-3.5" /> Add Transaction
          </button>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border p-5 space-y-4"
          style={{ borderColor: C.brand, background: C.brandBg }}>
          <h3 className="font-semibold text-sm" style={{ color: C.brand }}>New Transaction</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: C.muted }}>Type</label>
              <select value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value, category: e.target.value === "income" ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0] }))}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                style={{ borderColor: C.border }}>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: C.muted }}>Amount (₹)</label>
              <input type="number" min="0.01" step="0.01" value={form.amount} required
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="0.00"
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                style={{ borderColor: C.border }} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: C.muted }}>Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
                style={{ borderColor: C.border }}>
                {cats.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: C.muted }}>Date</label>
              <input type="date" value={form.date} required
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
                style={{ borderColor: C.border }} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1" style={{ color: C.muted }}>Note (optional)</label>
              <input type="text" value={form.description} maxLength={200}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="e.g. Monthly rent payment"
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
                style={{ borderColor: C.border }} />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)}
              className="rounded-lg border px-4 py-2 text-xs font-medium"
              style={{ borderColor: C.border, color: C.muted }}>Cancel</button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90"
              style={{ background: C.brand }}>
              <Save className="h-3.5 w-3.5" />{saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      )}

      {/* Transaction list */}
      {loading ? <LoadingSpinner label="Loading transactions…" /> : txs.length === 0
        ? <EmptyState icon={Wallet} message="No transactions found. Add one using the button above." />
        : (
          <div className="divide-y rounded-xl border overflow-hidden" style={{ borderColor: C.border }}>
            {txs.map(tx => (
              <div key={tx._id} className="flex items-center gap-3 px-4 py-3 hover:bg-[#FAFAFA] transition-colors">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                  style={{ background: tx.type === "income" ? "#D8F3DC" : C.dangerBg }}>
                  {tx.type === "income"
                    ? <TrendingUp className="h-4 w-4" style={{ color: C.incomeGreen }} />
                    : <TrendingDown className="h-4 w-4" style={{ color: C.expenseRed }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium" style={{ color: C.ink }}>{tx.category}</p>
                  {tx.description && <p className="truncate text-xs" style={{ color: C.faint }}>{tx.description}</p>}
                  <p className="text-xs" style={{ color: C.faint }}>{new Date(tx.date).toLocaleDateString("en-IN")}</p>
                </div>
                <span className="shrink-0 text-sm font-bold"
                  style={{ color: tx.type === "income" ? C.incomeGreen : C.expenseRed }}>
                  {tx.type === "income" ? "+" : "−"}{fmt(tx.amount)}
                </span>
                <button onClick={() => handleDelete(tx._id)}
                  className="ml-1 rounded-lg p-1.5 transition hover:opacity-70"
                  style={{ color: C.faint }} title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
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

  useEffect(() => { load(); }, [load]);

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
