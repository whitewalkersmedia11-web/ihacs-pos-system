import { useMemo } from "react";
import { TrendingUp, DollarSign, AlertTriangle, Package, TrendingDown, Wallet, Banknote, CreditCard, Smartphone } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from "recharts";
import { salesHistory, weeklyRevenueData, categoryBreakdown, accessories, expenses } from "@/data/mockData";

const formatLKR = (value: number) => `Rs. ${value.toLocaleString("en-LK")}`;

const EXPENSE_COLORS = [
  "hsl(0, 72%, 55%)",
  "hsl(36, 90%, 55%)",
  "hsl(210, 60%, 50%)",
  "hsl(168, 60%, 38%)",
  "hsl(280, 60%, 50%)",
  "hsl(142, 60%, 42%)",
];

const PAYMENT_COLORS = [
  "hsl(142, 60%, 42%)",
  "hsl(210, 60%, 50%)",
  "hsl(280, 60%, 50%)",
];

const Dashboard = () => {
  const now = new Date();
  const thisMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const todayStr = now.toISOString().split("T")[0];

  const metrics = useMemo(() => {
    const todaySales = salesHistory.filter((s) => s.date.startsWith(todayStr));
    const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);
    const monthSales = salesHistory.filter((s) => s.date.startsWith(thisMonthStr));
    const monthRevenue = monthSales.reduce((sum, s) => sum + s.total, 0);
    const monthSalesCount = monthSales.length;
    const monthCOGS = monthSales.reduce((sum, s) =>
      sum + s.items.reduce((iSum, item) => iSum + (item.originalPrice * 0.7) * item.quantity, 0), 0
    );
    const grossProfit = monthRevenue - monthCOGS;
    const monthExpenses = expenses.filter((e) => e.date.startsWith(thisMonthStr));
    const totalExpenses = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = grossProfit - totalExpenses;
    const weekTotal = weeklyRevenueData.reduce((sum, d) => sum + d.revenue, 0);
    return { todayRevenue, grossProfit, totalSalesCount: monthSalesCount, weekTotal, monthRevenue, totalExpenses, netProfit, todaySalesCount: todaySales.length };
  }, []);

  const monthlyComparison = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr"];
    return months.map((m, i) => {
      const monthKey = `2026-${String(i + 1).padStart(2, "0")}`;
      const rev = salesHistory.filter((s) => s.date.startsWith(monthKey)).reduce((sum, s) => sum + s.total, 0);
      const exp = expenses.filter((e) => e.date.startsWith(monthKey)).reduce((sum, e) => sum + e.amount, 0);
      return { month: m, revenue: rev, expenses: exp };
    });
  }, []);

  const expenseCategoryData = useMemo(() => {
    const monthExpenses = expenses.filter((e) => e.date.startsWith(thisMonthStr));
    const catMap: Record<string, number> = {};
    monthExpenses.forEach((e) => { catMap[e.category] = (catMap[e.category] || 0) + e.amount; });
    return Object.entries(catMap).map(([name, value]) => ({ name, value }));
  }, []);

  const monthlyExpenseTrend = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr"];
    return months.map((m, i) => {
      const monthKey = `2026-${String(i + 1).padStart(2, "0")}`;
      const total = expenses.filter((e) => e.date.startsWith(monthKey)).reduce((sum, e) => sum + e.amount, 0);
      return { month: m, expenses: total };
    });
  }, []);

  const monthlySalesData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr"];
    return months.map((m, i) => {
      const monthKey = `2026-${String(i + 1).padStart(2, "0")}`;
      const count = salesHistory.filter((s) => s.date.startsWith(monthKey)).length;
      const revenue = salesHistory.filter((s) => s.date.startsWith(monthKey)).reduce((sum, s) => sum + s.total, 0);
      return { month: m, sales: count, revenue };
    });
  }, []);

  // Payment method breakdown
  const paymentMethodData = useMemo(() => {
    const monthSales = salesHistory.filter((s) => s.date.startsWith(thisMonthStr));
    const methodMap: Record<string, { count: number; total: number }> = {};
    monthSales.forEach((s) => {
      if (!methodMap[s.paymentMethod]) methodMap[s.paymentMethod] = { count: 0, total: 0 };
      methodMap[s.paymentMethod].count += 1;
      methodMap[s.paymentMethod].total += s.total;
    });
    return Object.entries(methodMap).map(([name, data]) => ({ name, value: data.total, count: data.count }));
  }, []);

  const lowStockItems = accessories.filter((a) => a.stock <= a.lowStockThreshold);
  const recentSales = salesHistory.slice(0, 5);

  const paymentIcons: Record<string, React.ElementType> = { "Cash": Banknote, "Card": CreditCard, "Mobile Pay": Smartphone };

  return (
    <div className="p-3 md:p-6 space-y-4 max-w-7xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-foreground">Dashboard</h2>
        <p className="text-xs text-muted-foreground">{new Date().toLocaleDateString("en-LK", { month: "long", year: "numeric" })}</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
        <MetricCard title="Monthly Revenue" value={formatLKR(metrics.monthRevenue)} icon={DollarSign} glowClass="bg-accent/10 border-accent/30" iconClass="text-accent" />
        <MetricCard title="Gross Profit" value={formatLKR(metrics.grossProfit)} icon={TrendingUp} glowClass="bg-success/10 border-success/30" iconClass="text-success" />
        <MetricCard title="Total Expenses" value={formatLKR(metrics.totalExpenses)} icon={TrendingDown} glowClass="bg-destructive/10 border-destructive/30" iconClass="text-destructive" />
        <MetricCard
          title="Net Profit"
          value={formatLKR(metrics.netProfit)}
          icon={Wallet}
          glowClass={metrics.netProfit >= 0 ? "bg-success/10 border-success/30" : "bg-destructive/10 border-destructive/30"}
          iconClass={metrics.netProfit >= 0 ? "text-success" : "text-destructive"}
          valueClass={metrics.netProfit >= 0 ? "text-success" : "text-destructive"}
        />
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-card border border-border rounded-xl p-2.5">
          <p className="text-[10px] text-muted-foreground">Today's Revenue</p>
          <p className="text-sm font-bold text-foreground">{formatLKR(metrics.todayRevenue)}</p>
          <p className="text-[9px] text-muted-foreground">{metrics.todaySalesCount} sales</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-2.5">
          <p className="text-[10px] text-muted-foreground">Monthly Sales</p>
          <p className="text-sm font-bold text-foreground">{metrics.totalSalesCount}</p>
          <p className="text-[9px] text-muted-foreground">transactions</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-2.5">
          <p className="text-[10px] text-muted-foreground">Weekly Revenue</p>
          <p className="text-sm font-bold text-foreground">{formatLKR(metrics.weekTotal)}</p>
        </div>
      </div>

      {/* Payment Method Breakdown */}
      <div className="bg-card border border-border rounded-xl p-3">
        <h3 className="text-sm font-semibold text-foreground mb-3">💳 Payment Methods (This Month)</h3>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {paymentMethodData.map((pm) => {
            const Icon = paymentIcons[pm.name] || Banknote;
            return (
              <div key={pm.name} className="bg-background rounded-xl p-3 text-center">
                <Icon className="w-6 h-6 mx-auto mb-1 text-primary" />
                <p className="text-xs font-semibold text-foreground">{pm.name}</p>
                <p className="text-sm font-bold text-foreground">{formatLKR(pm.value)}</p>
                <p className="text-[10px] text-muted-foreground">{pm.count} sales</p>
              </div>
            );
          })}
        </div>
        {paymentMethodData.length > 0 && (
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={paymentMethodData} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3}>
                {paymentMethodData.map((_, index) => (
                  <Cell key={index} fill={PAYMENT_COLORS[index % PAYMENT_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [formatLKR(value), "Amount"]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }} />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Monthly Sales Overview */}
      <div className="bg-card border border-border rounded-xl p-3">
        <h3 className="text-sm font-semibold text-foreground mb-3">Monthly Sales Overview</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={monthlySalesData}>
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
            <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
            <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(value: number, name: string) => [name === "revenue" ? formatLKR(value) : value, name === "revenue" ? "Revenue" : "Sales"]}
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }}
            />
            <Bar yAxisId="left" dataKey="revenue" fill="hsl(168, 60%, 38%)" radius={[4, 4, 0, 0]} name="Revenue" />
            <Line yAxisId="right" type="monotone" dataKey="sales" stroke="hsl(36, 90%, 55%)" strokeWidth={2} dot={{ r: 3 }} name="Sales" />
            <Legend wrapperStyle={{ fontSize: "11px" }} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue vs Expenses + Category Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-3">
          <h3 className="text-sm font-semibold text-foreground mb-3">Revenue vs Expenses</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyComparison}>
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value: number, name: string) => [formatLKR(value), name === "revenue" ? "Revenue" : "Expenses"]}
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }} />
              <Bar dataKey="revenue" fill="hsl(168, 60%, 38%)" radius={[4, 4, 0, 0]} name="Revenue" />
              <Bar dataKey="expenses" fill="hsl(0, 72%, 55%)" radius={[4, 4, 0, 0]} name="Expenses" />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card border border-border rounded-xl p-3">
          <h3 className="text-sm font-semibold text-foreground mb-3">Category Split</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={categoryBreakdown} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3}>
                {categoryBreakdown.map((entry, index) => (<Cell key={index} fill={entry.color} />))}
              </Pie>
              <Tooltip formatter={(value: number) => [`${value}%`, "Share"]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1 mt-1">
            {categoryBreakdown.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-muted-foreground">{cat.name}</span>
                </div>
                <span className="font-medium text-foreground">{cat.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Expense Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-xl p-3">
          <h3 className="text-sm font-semibold text-foreground mb-3">Expense Breakdown (This Month)</h3>
          {expenseCategoryData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={expenseCategoryData} dataKey="value" cx="50%" cy="50%" outerRadius={70} paddingAngle={2} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {expenseCategoryData.map((_, index) => (<Cell key={index} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [formatLKR(value), "Amount"]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-2">
                {expenseCategoryData.map((cat, i) => (
                  <div key={cat.name} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: EXPENSE_COLORS[i % EXPENSE_COLORS.length] }} />
                      <span className="text-muted-foreground">{cat.name}</span>
                    </div>
                    <span className="font-medium text-foreground">{formatLKR(cat.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No expenses this month</p>
          )}
        </div>
        <div className="bg-card border border-border rounded-xl p-3">
          <h3 className="text-sm font-semibold text-foreground mb-3">Monthly Expense Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyExpenseTrend}>
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value: number) => [formatLKR(value), "Expenses"]}
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }} />
              <Line type="monotone" dataKey="expenses" stroke="hsl(0, 72%, 55%)" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(0, 72%, 55%)" }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 7-Day Trend */}
      <div className="bg-card border border-border rounded-xl p-3">
        <h3 className="text-sm font-semibold text-foreground mb-3">7-Day Sales Trend</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={weeklyRevenueData}>
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
            <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(value: number) => [formatLKR(value), "Revenue"]}
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }} />
            <Bar dataKey="revenue" fill="hsl(168, 60%, 38%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-xl p-3">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <h3 className="text-sm font-semibold text-foreground">Low Stock Alerts</h3>
            <span className="bg-destructive/10 text-destructive text-[10px] font-bold px-1.5 py-0.5 rounded-full">{lowStockItems.length}</span>
          </div>
          <div className="space-y-1.5">
            {lowStockItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between bg-background rounded-lg p-2.5">
                <div className="flex items-center gap-2">
                  <span>{item.emoji}</span>
                  <div>
                    <p className="text-xs font-medium text-foreground">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground">SKU: {item.sku}</p>
                  </div>
                </div>
                <span className={`text-xs font-bold ${item.stock <= 3 ? "text-destructive" : "text-accent"}`}>{item.stock} left</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-3">
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Recent Transactions</h3>
          </div>
          <div className="space-y-1.5">
            {recentSales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between bg-background rounded-lg p-2.5">
                <div>
                  <p className="text-xs font-medium text-foreground">{sale.customerName || "Walk-in Customer"}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(sale.date).toLocaleString("en-LK", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    {" · "}{sale.paymentMethod}
                  </p>
                </div>
                <span className="text-xs font-bold text-foreground">{formatLKR(sale.total)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, icon: Icon, glowClass, iconClass, valueClass }: {
  title: string; value: string; icon: React.ElementType; glowClass: string; iconClass: string; valueClass?: string;
}) => (
  <div className={`rounded-xl border p-3 ${glowClass}`}>
    <div className="flex items-center justify-between mb-1">
      <span className="text-[10px] font-medium text-muted-foreground">{title}</span>
      <Icon className={`w-4 h-4 ${iconClass}`} />
    </div>
    <p className={`text-sm md:text-lg font-bold truncate ${valueClass || "text-foreground"}`}>{value}</p>
  </div>
);

export default Dashboard;
