import { useEffect, useState } from "react";
import { Search, ChevronRight, Calendar, Loader2, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SaleTransaction } from "@/data/types";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const formatLKR = (v: number) => `Rs. ${v.toLocaleString("en-LK")}`;

const SalesHistory = () => {
  const [search, setSearch] = useState("");
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("sales").select("*").order("date", { ascending: false });
      if (error) throw error;
      setSales(data || []);
    } catch (error: any) {
      toast.error("Error loading sales: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filtered = sales.filter((s) =>
    `${s.customer_name || ""} ${s.id} ${s.payment_method}`.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce((acc, sale) => {
    const day = (sale.date as string).split("T")[0];
    if (!acc[day]) acc[day] = [];
    acc[day].push(sale);
    return acc;
  }, {} as Record<string, any[]>);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground">Loading transactions...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Sales History</h2>
        <p className="text-sm text-muted-foreground">View past transactions</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          placeholder="Search by customer, ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div className="space-y-6">
        {Object.entries(grouped).map(([date, salesGroup]) => {
          const salesArray = salesGroup as any[];
          return (
            <div key={date}>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-muted-foreground">
                  {new Date(date).toLocaleDateString("en-LK", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </h3>
                <span className="text-xs text-muted-foreground">({salesArray.length} sales · {formatLKR(salesArray.reduce((s, t) => s + Number(t.total), 0))})</span>
              </div>
              <div className="space-y-2">
                {salesArray.map((sale) => (
                  <button
                    key={sale.id}
                    onClick={() => setSelected(sale)}
                    className="w-full bg-card border border-border rounded-xl p-3 md:p-4 flex items-center gap-3 hover:border-primary/40 hover:shadow-sm transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                      {sale.payment_method === "Cash" ? "💵" : sale.payment_method === "Card" ? "💳" : "📲"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {sale.customer_name || "Walk-in Customer"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(sale.date).toLocaleTimeString("en-LK", { hour: "2-digit", minute: "2-digit" })}
                        {" · "}{sale.payment_method}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">{formatLKR(sale.total)}</p>
                      {sale.trade_in_value > 0 && (
                        <p className="text-[10px] text-primary">Trade-in applied</p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto bg-white border-2">
          <DialogHeader>
            <DialogTitle className="text-center font-bold text-xl text-black">📄 Invoice Details</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 py-2">
              <div className="text-center border-b border-dashed border-zinc-300 pb-4 text-black">
                <img src="434757956_122139159188124564_4746025914570679797_n.jpg" alt="Logo" className="h-20 w-20 mx-auto mb-2 object-contain" />
                <p className="text-xl font-black">iHacs Solutions</p>
                <p className="text-[11px] font-semibold text-zinc-600">Pussellawa, Sri Lanka</p>
                <p className="text-[11px] font-semibold text-zinc-600">076 902 9003 / 075 098 5291</p>
                <p className="text-[10px] text-zinc-500">ihackssolution@gmail.com</p>
                <div className="mt-3 py-1 bg-zinc-100 rounded text-[10px] font-bold text-zinc-700">
                  {new Date(selected.date).toLocaleString("en-LK")}
                </div>
                <p className="text-[9px] text-zinc-400 mt-1">Ref: {selected.id}</p>
              </div>

              {selected.customer_name && (
                <div className="text-xs text-muted-foreground">
                  Customer: {selected.customer_name}
                  {selected.customer_phone && ` · ${selected.customer_phone}`}
                </div>
              )}

              <div className="space-y-2">
                {selected.items && Array.isArray(selected.items) && selected.items.length > 0 ? (
                  selected.items.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm">
                      <div>
                        <p className="text-foreground font-semibold">{item.name} ×{item.quantity}</p>
                        {item.imei && <p className="text-[10px] text-muted-foreground">IMEI: {item.imei}</p>}
                        {item.warranty && <p className="text-[10px] text-primary">Warranty: {item.warranty}</p>}
                      </div>
                      <span className="font-medium text-foreground">{formatLKR((item.price || 0) * (item.quantity || 1))}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-4 text-xs text-muted-foreground italic">No item details recorded</p>
                )}
              </div>

              <div className="border-t border-dashed border-border pt-3 space-y-1 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span><span>{formatLKR(selected.subtotal)}</span>
                </div>
                {selected.discount > 0 && (
                  <div className="flex justify-between text-accent">
                    <span>Discount ({selected.discount_type === "flat" ? "Flat" : `${selected.discount}%`})</span>
                    <span>-{formatLKR(selected.discount_type === "flat" ? selected.discount : selected.subtotal * selected.discount / 100)}</span>
                  </div>
                )}
                {selected.trade_in_value > 0 && (
                  <div className="flex justify-between text-primary">
                    <span>Trade-in ({selected.trade_in_device})</span>
                    <span>-{formatLKR(selected.trade_in_value)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg text-foreground pt-1">
                  <span>Total</span><span>{formatLKR(selected.total)}</span>
                </div>
                <p className="text-xs text-muted-foreground text-center pt-1">Paid via {selected.payment_method}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalesHistory;
