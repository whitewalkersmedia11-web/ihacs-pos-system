import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Filter, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Expense, ExpenseCategory } from "@/data/types";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

const formatLKR = (v: number) => `Rs. ${v.toLocaleString("en-LK")}`;

const categories: ExpenseCategory[] = ["Rent", "Electricity", "Salary", "Transport", "Repair Parts", "Other"];
const categoryEmojis: Record<ExpenseCategory, string> = {
  Rent: "🏠", Electricity: "💡", Salary: "👤", Transport: "🚚", "Repair Parts": "🔧", Other: "📋",
};

const filterOptions = ["All", "This Month", ...categories] as const;

const Expenses = () => {
  const [expenseList, setExpenseList] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [filter, setFilter] = useState<string>("All");

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("expenses").select("*").order("date", { ascending: false });
      if (error) throw error;
      setExpenseList(data || []);
    } catch (error: any) {
      toast.error("Failed to load expenses: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  const thisMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const filtered = expenseList.filter((e) => {
    if (filter === "All") return true;
    if (filter === "This Month") return e.date.startsWith(thisMonthStr);
    return e.category === filter;
  });

  const totalFiltered = filtered.reduce((s, e) => s + Number(e.amount), 0);

  const saveExpense = async (exp: Expense) => {
    const expData = {
      category: exp.category,
      amount: exp.amount,
      date: exp.date,
      note: exp.note
    };

    try {
      if (isNew) {
        const { error } = await supabase.from("expenses").insert([expData]);
        if (error) throw error;
        toast.success("Expense added");
      } else {
        const { error } = await supabase.from("expenses").update(expData).eq("id", exp.id);
        if (error) throw error;
        toast.success("Expense updated");
      }
      fetchExpenses();
      setEditExpense(null);
      setIsNew(false);
    } catch (error: any) {
      toast.error("Error saving expense: " + error.message);
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
      toast.success("Expense deleted");
      fetchExpenses();
    } catch (error: any) {
      toast.error("Error deleting expense: " + error.message);
    }
  };

  const newExpense = (): Expense => ({
    id: "", category: "Other", amount: 0, date: new Date().toISOString().split("T")[0], note: "",
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse">Loading expenses...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Expenses</h2>
          <p className="text-sm text-muted-foreground">Track business expenses</p>
        </div>
        <Button onClick={() => { setIsNew(true); setEditExpense(newExpense()); }} className="gap-1.5">
          <Plus className="w-4 h-4" /> Add Expense
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {filterOptions.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Total */}
      <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {filter === "All" ? "All Expenses" : filter} ({filtered.length})
          </span>
        </div>
        <span className="text-lg font-bold text-destructive">{formatLKR(totalFiltered)}</span>
      </div>

      {/* Expense List */}
      <div className="space-y-2">
        {filtered.map((exp) => (
          <div key={exp.id} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
            <span className="text-2xl">{categoryEmojis[exp.category]}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{exp.category}</p>
              <p className="text-xs text-muted-foreground truncate">{exp.note}</p>
              <p className="text-[10px] text-muted-foreground">{new Date(exp.date).toLocaleDateString("en-LK", { month: "short", day: "numeric", year: "numeric" })}</p>
            </div>
            <span className="text-sm font-bold text-destructive">{formatLKR(exp.amount)}</span>
            <button onClick={() => { setIsNew(false); setEditExpense(exp); }} className="p-2 rounded-lg hover:bg-secondary">
              <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            <button onClick={() => deleteExpense(exp.id)} className="p-2 rounded-lg hover:bg-destructive/10">
              <Trash2 className="w-3.5 h-3.5 text-destructive" />
            </button>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">No expenses found</div>
        )}
      </div>

      {/* Edit/Add Dialog */}
      <ExpenseDialog
        expense={editExpense}
        isNew={isNew}
        onSave={saveExpense}
        onClose={() => { setEditExpense(null); setIsNew(false); }}
      />
    </div>
  );
};

const ExpenseDialog = ({ expense, isNew, onSave, onClose }: {
  expense: Expense | null; isNew: boolean; onSave: (e: Expense) => void; onClose: () => void;
}) => {
  const [form, setForm] = useState<Expense>(expense || {} as Expense);

  if (!expense) return null;

  if (expense && form.id !== expense.id && !isNew) setForm(expense);
  if (isNew && form.id !== "") setForm(expense);

  const update = (key: keyof Expense, val: string | number) => setForm((prev) => ({ ...prev, [key]: val }));

  return (
    <Dialog open={!!expense} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isNew ? "Add Expense" : "Edit Expense"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Category</label>
            <select
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {categories.map((c) => <option key={c} value={c}>{categoryEmojis[c]} {c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Amount (LKR)</label>
            <input
              type="number"
              value={form.amount || ""}
              onChange={(e) => update("amount", Number(e.target.value))}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => update("date", e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Note</label>
            <input
              value={form.note}
              onChange={(e) => update("note", e.target.value)}
              placeholder="Details about this expense"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(form)}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Expenses;
