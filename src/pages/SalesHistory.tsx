import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { Search, Calendar, ChevronRight, Printer, Share2, Trash2, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";

const formatLKR = (v: number) => `Rs. ${v.toLocaleString("en-LK")}`;

const SalesHistory = () => {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const { data, error } = await supabase
        .from("sales")
        .select("*")
        .order("date", { ascending: false });
      if (error) throw error;
      setSales(data || []);
    } catch (error: any) {
      toast.error("Failed to load history: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const parseItems = (items: any) => {
    if (!items) return [];
    if (Array.isArray(items)) return items;
    try { return JSON.parse(items); } catch (e) { console.error("Parse fail:", e); return []; }
  };

  const handleDelete = async (id: string, invoiceData?: any) => {
    if (!window.confirm("Are you sure you want to delete this invoice permanently? This will RESTOCK all items back into your inventory.")) return;
    setIsDeleting(true);
    try {
      const itemsToRestock = parseItems(invoiceData?.items);
      
      for (const item of itemsToRestock) {
        if (item.type === "phone") {
          await supabase.from("phones").update({ status: "In Stock" }).eq("id", item.id);
        } else {
          const { data: acc } = await supabase.from("accessories").select("stock").eq("id", item.id).single();
          if (acc) {
            await supabase.from("accessories").update({ stock: acc.stock + item.quantity }).eq("id", item.id);
          }
        }
      }

      const { error } = await supabase.from("sales").delete().eq("id", id);
      if (error) throw error;

      toast.success("Invoice deleted & Items restocked");
      setSelected(null);
      fetchSales();
    } catch (error: any) {
      toast.error("Process Fail: " + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const updateStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "Paid" ? "Pending" : "Paid";
    try {
      const { error } = await supabase.from("sales").update({ payment_status: nextStatus }).eq("id", id);
      if (error) throw error;
      toast.success(`Marked as ${nextStatus}`);
      if (selected) setSelected({ ...selected, payment_status: nextStatus });
      fetchSales();
    } catch (error: any) {
      toast.error("Update fail: " + error.message);
    }
  };

  const handleWhatsApp = (data: any) => {
    const items = parseItems(data.items);
    const lines = [
      `🧾 *iHacs Receipt*`, `Ref: ${data.id}`, `Date: ${new Date(data.date).toLocaleString("en-LK")}`, ``,
      ...items.map((i: any) => `${i.name} x${i.quantity} - ${formatLKR(i.price * i.quantity)}`), ``,
      `*Total: ${formatLKR(data.total)}*`, `Status: ${data.payment_status || "Paid"}`
    ].join("\n");
    const phone = data.customer_phone ? data.customer_phone.replace(/^0/, "94") : "";
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(lines)}`, "_blank");
  };

  const filtered = sales.filter((s) => `${s.customer_name || ""} ${s.id} ${s.payment_method}`.toLowerCase().includes(search.toLowerCase()));

  const grouped = filtered.reduce((acc, sale) => {
    const day = (sale.date as string).split("T")[0];
    if (!acc[day]) acc[day] = [];
    acc[day].push(sale);
    return acc;
  }, {} as Record<string, any[]>);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="w-10 h-10 text-[#f36c21] animate-spin" />
      <p className="text-muted-foreground font-bold">Syncing history...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 leading-none">Invoice Hub</h2>
          <p className="text-[10px] uppercase font-bold text-[#f36c21] tracking-[0.2em] mt-2">Manage History & Stock</p>
        </div>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-[#f36c21] transition-colors" />
        <input placeholder="Search invoices..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-sm focus:ring-4 focus:ring-orange-500/5 focus:border-[#f36c21] transition-all" />
      </div>

      <div className="space-y-8">
        {Object.entries(grouped).map(([date, salesGroup]) => {
          const salesArray = salesGroup as any[];
          return (
            <div key={date}>
              <div className="flex items-center gap-3 mb-4 px-1">
                <div className="p-2 bg-slate-100 rounded-xl"><Calendar className="w-4 h-4 text-slate-500" /></div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest leading-none">{new Date(date).toLocaleDateString("en-LK", { weekday: "short", day: "numeric", month: "long" })}</h3>
                  <p className="text-[9px] font-bold text-[#f36c21] tracking-wider mt-1 uppercase">{salesArray.length} INVOICES · {formatLKR(salesArray.reduce((s, t) => s + Number(t.total), 0))}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {salesArray.map((sale) => (
                  <button key={sale.id} onClick={() => setSelected(sale)} className="group w-full bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 hover:border-[#f36c21] hover:shadow-xl transition-all text-left">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-xl grayscale group-hover:grayscale-0 border border-slate-100">{sale.payment_method === "Cash" ? "💵" : sale.payment_method === "Card" ? "💳" : "📲"}</div>
                    <div className="flex-1 min-w-0"><p className="text-sm font-black text-slate-900 truncate">{sale.customer_name || "Walk-in Guest"}</p><p className="text-[9px] font-bold text-slate-400 uppercase mt-1">REF: {sale.id.slice(-6).toUpperCase()}</p></div>
                    <div className="text-right"><p className="text-sm font-black text-slate-900">{formatLKR(sale.total)}</p><span className={`inline-block w-2.5 h-2.5 rounded-full mt-1.5 ${sale.payment_status === 'Pending' ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} /></div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="sm:max-w-md max-h-[95vh] overflow-y-auto bg-white border-none rounded-3xl p-0 shadow-2xl">
          {selected && (
            <div className="relative">
              <div className="p-6 pb-2 text-center">
                 <div className="w-16 h-16 rounded-3xl bg-slate-50 mx-auto flex items-center justify-center p-3 border border-slate-100 mb-4">
                    <img src="434757956_122139159188124564_4746025914570679797_n.jpg" alt="Logo" className="w-full h-full object-contain" />
                 </div>
                 <h2 className="text-xl font-black text-slate-900">iHacs Solutions</h2>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 mb-6">Commercial Invoice</p>
              </div>

              <div className="grid grid-cols-4 gap-2 px-6 mb-8">
                 <button onClick={() => updateStatus(selected.id, selected.payment_status)} className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all active:scale-95 ${selected.payment_status === 'Paid' ? 'bg-emerald-50 border border-emerald-100' : 'bg-slate-50 border border-slate-100'}`}>
                    <CheckCircle2 className={`w-5 h-5 ${selected.payment_status === 'Paid' ? 'text-emerald-500' : 'text-slate-400'}`} />
                    <span className="text-[8px] font-black uppercase text-slate-500">Status</span>
                 </button>
                 <button onClick={() => window.print()} className="flex flex-col items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-2xl hover:bg-blue-100 active:scale-95 transition-all">
                    <Printer className="w-5 h-5 text-blue-500" />
                    <span className="text-[8px] font-black uppercase text-blue-600">Print</span>
                 </button>
                 <button onClick={() => handleWhatsApp(selected)} className="flex flex-col items-center gap-2 p-3 bg-orange-50 border border-orange-100 rounded-2xl hover:bg-orange-100 active:scale-95 transition-all">
                    <Share2 className="w-5 h-5 text-[#f36c21]" />
                    <span className="text-[8px] font-black uppercase text-[#f36c21]">Share</span>
                 </button>
                 <button onClick={() => handleDelete(selected.id, selected)} disabled={isDeleting} className="flex flex-col items-center gap-2 p-3 bg-rose-50 border border-rose-100 rounded-2xl hover:bg-rose-100 active:scale-95 transition-all group">
                    <Trash2 className="w-5 h-5 text-rose-500" />
                    <span className="text-[8px] font-black uppercase text-rose-500">Delete</span>
                 </button>
              </div>

              <div className="px-8 space-y-6 pb-10">
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Items Purchased</p>
                  {parseItems(selected.items).map((item: any, i: number) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center font-bold text-xs text-slate-400 border border-slate-100">{item.emoji || '📦'}</div>
                      <div className="flex-1"><p className="text-sm font-black text-slate-800 leading-tight">{item.name}</p><p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Qty: {item.quantity} · {formatLKR(item.price)} ea</p></div>
                      <p className="text-sm font-black text-slate-900">{formatLKR(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-slate-100 space-y-2">
                  <div className="flex justify-between items-end pt-2">
                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none mb-1">Invoice Total</p>
                    <p className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{formatLKR(selected.total)}</p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between">
                   <div>
                     <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Payment Method</p>
                     <p className="text-[11px] font-black text-slate-800">{selected.payment_method} · {selected.payment_status || 'Paid'}</p>
                   </div>
                   <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selected.payment_status === 'Pending' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                      {selected.payment_status === 'Pending' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                   </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalesHistory;
