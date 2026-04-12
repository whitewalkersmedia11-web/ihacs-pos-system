import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Plus, Trash2, Printer, CheckCircle2, User, Phone as PhoneIcon,
  Calendar, Smartphone, Package, UserPlus, ShoppingBag,
  ChevronDown, ChevronUp, Clock, ArrowLeft, X
} from "lucide-react";
import { Phone, Accessory, Seller } from "@/data/types";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { offlineSync } from "@/lib/offlineSync";

const formatLKR = (v: number) => `Rs. ${v.toLocaleString("en-LK")}`;

type PurchaseItem = { type: "phone"; data: Phone } | { type: "accessory"; data: Accessory };

interface Purchase {
  id: string; invoice_no: string; seller_name: string;
  seller_phone: string; date: string; total: number; items: PurchaseItem[];
}

/* ════════════════════════════════
   MAIN PAGE
════════════════════════════════ */
const Sellers = () => {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<Purchase[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showPurchaseFlow, setShowPurchaseFlow] = useState(false);
  const [showAddSeller, setShowAddSeller] = useState(false);
  const [newSellerName, setNewSellerName] = useState("");
  const [newSellerPhone, setNewSellerPhone] = useState("");
  // Invoice view
  const [completedPurchase, setCompletedPurchase] = useState<Purchase | null>(null);

  useEffect(() => { fetchSellers(); fetchPurchaseHistory(); }, []);

  const fetchSellers = async () => {
    try {
      const { data } = await supabase.from("sellers").select("*");
      if (data) setSellers(data);
    } catch (e) { console.warn("sellers fetch failed", e); }
  };

  const fetchPurchaseHistory = async () => {
    try {
      const { data } = await supabase.from("purchases").select("*").order("date", { ascending: false });
      if (data) setPurchaseHistory(data.map(p => ({ ...p, items: JSON.parse(p.items || "[]") })));
    } catch (e) { console.warn("purchases fetch failed", e); }
  };

  const handleAddNewSeller = async () => {
    if (!newSellerName.trim()) return toast.error("Please enter a name");
    try {
      const { data, error } = await supabase.from("sellers").insert([{ name: newSellerName.trim(), phone: newSellerPhone.trim(), joined_date: new Date().toISOString() }]).select();
      if (error) throw error;
      toast.success(`Seller "${newSellerName}" added!`);
      setNewSellerName(""); setNewSellerPhone(""); setShowAddSeller(false);
      await fetchSellers();
    } catch (e: any) { toast.error("Error: " + e.message); }
  };

  const handlePurchaseComplete = async (purchase: Purchase) => {
    setShowPurchaseFlow(false);
    setCompletedPurchase(purchase);
    fetchPurchaseHistory();
  };

  /* ── Invoice View ── */
  if (completedPurchase) {
    const p = completedPurchase;
    return (
      <div className="p-3 md:p-6 max-w-4xl mx-auto">
        <div className="mb-4 flex justify-between items-center print:hidden">
          <Button variant="outline" onClick={() => setCompletedPurchase(null)}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <Button onClick={() => window.print()} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
            <Printer className="w-4 h-4" /> Print Invoice
          </Button>
        </div>
        <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-xl print:shadow-none print:border-none print:p-0 max-w-2xl mx-auto">
          <div className="text-center pb-5 border-b border-dashed border-slate-200 mb-6">
            <div className="w-32 h-32 rounded-[2.5rem] bg-white mx-auto flex items-center justify-center p-1 border border-slate-100 mb-6 shadow-sm">
              <img src="434757956_122139159188124564_4746025914570679797_n.jpg" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <h2 className="text-3xl font-black text-slate-900">iHacs Solutions</h2>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Pussellawa, Sri Lanka</p>
            <p className="text-[10px] font-black text-slate-500 tracking-wider">076 902 9003 / 075 098 5291</p>
            <p className="text-[10px] font-black text-[#f36c21] lowercase">ihackssolution@gmail.com</p>
            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mt-4 border-t border-slate-50 pt-3">Purchase Invoice</p>
          </div>
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Seller Details</h3>
              <p className="text-lg font-black text-slate-900">{p.seller_name}</p>
              {p.seller_phone && <p className="text-sm text-slate-500 font-bold">{p.seller_phone}</p>}
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">NO: <span className="text-slate-900 ml-1">{p.invoice_no}</span></p>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Date: <span className="text-slate-900 ml-1">{new Date(p.date).toLocaleDateString("en-GB")}</span></p>
            </div>
          </div>
          <InvoiceTable items={p.items} />
          <div className="flex justify-end pt-4 mb-10">
            <div className="w-full max-w-xs">
              <div className="flex justify-between items-end border-t border-dashed border-slate-200 pt-3">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Total Amount</span>
                <span className="text-2xl font-black text-slate-900">{formatLKR(p.total)}</span>
              </div>
            </div>
          </div>
          <div className="mt-8 flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
            <div className="w-40 border-t-2 border-dashed border-slate-300 pt-2 shrink-0">Seller Signature</div>
            <div className="w-40 border-t-2 border-dashed border-slate-300 pt-2 shrink-0">Authorized By</div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Main Page ── */
  return (
    <div className="p-3 md:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-bold text-foreground">Sellers &amp; Purchases</h2>
          <p className="text-xs text-muted-foreground">Manage purchase history and add new stock from sellers.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowAddSeller(true)} size="sm" className="gap-1.5">
            <UserPlus className="w-4 h-4" /> Add Seller
          </Button>
          <Button onClick={() => setShowPurchaseFlow(true)} className="bg-[#f36c21] hover:bg-[#e05b10] text-white gap-1.5">
            <ShoppingBag className="w-4 h-4" /> Buy New Items
          </Button>
        </div>
      </div>

      {/* Purchase History */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4" /> Purchase History ({purchaseHistory.length})
        </h3>
        {purchaseHistory.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-bold">No purchases yet</p>
            <p className="text-xs mt-1">Click "Buy New Items" to record your first purchase</p>
          </div>
        ) : (
          <div className="space-y-3">
            {purchaseHistory.map((p) => (
              <div key={p.id} className="border border-slate-100 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                  className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-orange-50/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0">
                      <ShoppingBag className="w-5 h-5 text-[#f36c21]" />
                    </div>
                    <div>
                      <p className="font-black text-slate-800 text-sm">{p.seller_name}</p>
                      <p className="text-[10px] text-slate-400 font-bold">
                        {p.invoice_no} • {new Date(p.date).toLocaleDateString("en-GB")} • {p.items.length} item{p.items.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <p className="font-black text-slate-900">{formatLKR(p.total)}</p>
                    {expandedId === p.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </button>
                {expandedId === p.id && (
                  <div className="px-4 pb-4 pt-2 bg-white">
                    <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                      <span>🗓 {new Date(p.date).toLocaleString("en-GB")}</span>
                      {p.seller_phone && <span>📞 {p.seller_phone}</span>}
                    </div>
                    <div className="space-y-2">
                      {p.items.map((item, idx) => (
                        <div key={idx} className="flex items-start justify-between py-2.5 border-b border-slate-50 last:border-0">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{item.type === "phone" ? (item.data.brand === "Apple" ? "🍎" : "🤖") : item.data.emoji}</span>
                            <div>
                              {item.type === "phone" ? (
                                <>
                                  <p className="text-sm font-bold text-slate-800">{item.data.brand} {item.data.model}</p>
                                  <p className="text-[10px] text-slate-400">{item.data.storage} • {item.data.color} • {item.data.condition}</p>
                                  <p className="text-[10px] text-slate-400 font-mono">IMEI: {item.data.imei}</p>
                                  <p className="text-[10px] text-slate-400">Warranty: {item.data.warranty}</p>
                                </>
                              ) : (
                                <>
                                  <p className="text-sm font-bold text-slate-800">{item.data.name}</p>
                                  <p className="text-[10px] text-slate-400">{item.data.category} • SKU: {item.data.sku} • Qty: {item.data.stock}</p>
                                </>
                              )}
                            </div>
                          </div>
                          <p className="font-black text-slate-900 text-sm shrink-0 mt-1">
                            {formatLKR(item.type === "phone" ? item.data.cost : item.data.cost * item.data.stock)}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-dashed border-slate-200">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total</span>
                      <span className="font-black text-[#f36c21] text-xl">{formatLKR(p.total)}</span>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <Button size="sm" onClick={() => setCompletedPurchase(p)} variant="outline" className="gap-1.5 text-xs">
                        <Printer className="w-3.5 h-3.5" /> Print Invoice
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Purchase Flow Dialog (full session) */}
      <PurchaseFlowDialog
        open={showPurchaseFlow}
        sellers={sellers}
        onClose={() => setShowPurchaseFlow(false)}
        onComplete={handlePurchaseComplete}
        onAddSellerRequest={() => setShowAddSeller(true)}
      />

      {/* Add Seller Dialog */}
      <Dialog open={showAddSeller} onOpenChange={setShowAddSeller}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><UserPlus className="w-5 h-5 text-[#f36c21]" /> Add New Seller</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <FI label="Seller / Business Name *" value={newSellerName} onChange={setNewSellerName} placeholder="Enter name" icon={<User className="w-4 h-4 text-slate-400" />} />
            <FI label="Contact Number (Optional)" value={newSellerPhone} onChange={setNewSellerPhone} placeholder="Enter phone" icon={<PhoneIcon className="w-4 h-4 text-slate-400" />} />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowAddSeller(false)}>Cancel</Button>
            <Button onClick={handleAddNewSeller} className="bg-[#f36c21] hover:bg-[#e05b10] text-white"><UserPlus className="w-4 h-4 mr-1" /> Save Seller</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* ════════════════════════════════
   PURCHASE FLOW DIALOG
   (Seller → Add Items → View → Complete & Print)
════════════════════════════════ */
const PurchaseFlowDialog = ({ open, sellers, onClose, onComplete, onAddSellerRequest }: {
  open: boolean; sellers: Seller[]; onClose: () => void;
  onComplete: (p: Purchase) => void; onAddSellerRequest: () => void;
}) => {
  const [sellerName, setSellerName] = useState(sellers[0]?.name || "");
  const [sellerPhone, setSellerPhone] = useState(sellers[0]?.phone || "");
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [addTab, setAddTab] = useState<"phone" | "accessory">("phone");
  const [view, setView] = useState<"add" | "items">("add");
  const [saving, setSaving] = useState(false);
  const date = new Date().toLocaleDateString("en-GB");

  // Sync seller when sellers list loads
  useEffect(() => {
    if (sellers.length > 0 && !sellerName) {
      setSellerName(sellers[0].name);
      setSellerPhone(sellers[0].phone || "");
    }
  }, [sellers]);

  // Phone form
  const [phone, setPhone] = useState<Phone>({ id: "", brand: "", model: "", imei: "", price: 0, cost: 0, warranty: "6 months", color: "", storage: "128GB", condition: "New", status: "In Stock", addedDate: new Date().toISOString(), category: "iPhone" });
  const [acc, setAcc] = useState<Accessory>({ id: "", name: "", sku: "", category: "Cases", price: 0, cost: 0, stock: 1, lowStockThreshold: 5, emoji: "📦" });

  const upP = (k: keyof Phone, v: string | number) => setPhone(p => ({ ...p, [k]: v }));
  const upA = (k: keyof Accessory, v: string | number) => setAcc(a => ({ ...a, [k]: v }));

  const addPhone = () => {
    if (!phone.brand || !phone.model || !phone.imei || !phone.cost) return toast.error("Fill in Brand, Model, IMEI and Cost");
    setItems(prev => [...prev, { type: "phone", data: { ...phone, id: crypto.randomUUID() } }]);
    setPhone({ id: "", brand: "", model: "", imei: "", price: 0, cost: 0, warranty: "6 months", color: "", storage: "128GB", condition: "New", status: "In Stock", addedDate: new Date().toISOString(), category: "iPhone" });
    toast.success("Phone added to purchase!");
  };

  const addAcc = () => {
    if (!acc.name || !acc.cost) return toast.error("Fill in Name and Cost");
    setItems(prev => [...prev, { type: "accessory", data: { ...acc, id: crypto.randomUUID() } }]);
    setAcc({ id: "", name: "", sku: "", category: "Cases", price: 0, cost: 0, stock: 1, lowStockThreshold: 5, emoji: "📦" });
    toast.success("Accessory added to purchase!");
  };

  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));

  const totalCost = items.reduce((s, i) => s + (i.type === "phone" ? i.data.cost : i.data.cost * i.data.stock), 0);

  const completePurchase = async () => {
    if (!sellerName) return toast.error("Please select a seller");
    if (items.length === 0) return toast.error("Please add at least one item");
    setSaving(true);
    try {
      const invoiceNo = `PUR-${Date.now().toString().slice(-6)}`;
      const phones = items.filter(i => i.type === "phone").map(i => { const p = (i as any).data as Phone; return { brand: p.brand, model: p.model, imei: p.imei, price: p.price, cost: p.cost, warranty: p.warranty, color: p.color, storage: p.storage, condition: p.condition, status: p.status, category: p.category, seller_name: sellerName }; });
      const accessories = items.filter(i => i.type === "accessory").map(i => { const a = (i as any).data as Accessory; return { name: a.name, sku: a.sku, category: a.category, price: a.price, cost: a.cost, stock: a.stock, low_stock_threshold: a.lowStockThreshold, emoji: a.emoji, seller_name: sellerName }; });
      if (phones.length > 0) { const { error } = await supabase.from("phones").insert(phones); if (error) throw error; }
      if (accessories.length > 0) { const { error } = await supabase.from("accessories").insert(accessories); if (error) throw error; }

      const purchase: Purchase = { id: crypto.randomUUID(), invoice_no: invoiceNo, seller_name: sellerName, seller_phone: sellerPhone, date: new Date().toISOString(), total: totalCost, items };
      try {
        await supabase.from("purchases").insert([{ ...purchase, items: JSON.stringify(items) }]);
      } catch (e) { console.warn("purchases table missing — run SQL to create it"); }

      const { data: pData } = await supabase.from("phones").select("*");
      const { data: aData } = await supabase.from("accessories").select("*");
      if (pData) offlineSync.cacheInventory({ phones: pData.map(p => ({ ...p, addedDate: p.added_date })), accessories: aData?.map(a => ({ ...a, lowStockThreshold: a.low_stock_threshold })) || [] });

      setItems([]); setPhone({ id: "", brand: "", model: "", imei: "", price: 0, cost: 0, warranty: "6 months", color: "", storage: "128GB", condition: "New", status: "In Stock", addedDate: new Date().toISOString(), category: "iPhone" });
      toast.success("Purchase saved!");
      onComplete(purchase);
    } catch (e: any) { toast.error("Error: " + e.message); }
    finally { setSaving(false); }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-black text-slate-900 text-base">Buy New Items</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{date}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Seller Selection */}
          <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Select Seller</label>
            <div className="flex gap-2">
              <select
                value={sellerName}
                onChange={e => { const s = sellers.find(x => x.name === e.target.value); setSellerName(e.target.value); setSellerPhone(s?.phone || ""); }}
                className="flex-1 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-[#f36c21] focus:ring-2 focus:ring-orange-500/20"
              >
                {sellers.length === 0 ? <option value="">No sellers — add one first</option>
                  : sellers.map(s => <option key={s.id} value={s.name}>{s.name}{s.phone ? ` (${s.phone})` : ""}</option>)}
              </select>
              <button onClick={() => { onClose(); onAddSellerRequest(); }} className="px-3 py-2.5 bg-white border border-dashed border-orange-300 text-[#f36c21] rounded-xl text-xs font-black hover:bg-orange-50 transition-all flex items-center gap-1">
                <UserPlus className="w-3.5 h-3.5" /> New
              </button>
            </div>
          </div>

          {/* Tab Switch: Add / View Items */}
          <div className="flex gap-2">
            <button onClick={() => setView("add")} className={`flex-1 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${view === "add" ? "bg-[#f36c21] text-white shadow-sm" : "bg-slate-100 text-slate-400 hover:text-slate-600"}`}>
              <Plus className="w-4 h-4" /> Add Item
            </button>
            <button onClick={() => setView("items")} className={`flex-1 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${view === "items" ? "bg-[#f36c21] text-white shadow-sm" : "bg-slate-100 text-slate-400 hover:text-slate-600"}`}>
              <ShoppingBag className="w-4 h-4" /> View Items ({items.length})
            </button>
          </div>

          {/* ── ADD ITEM VIEW ── */}
          {view === "add" && (
            <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-4">
              {/* Phone / Accessory tab */}
              <div className="flex gap-2">
                <button onClick={() => setAddTab("phone")} className={`flex-1 py-2 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${addTab === "phone" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400"}`}>
                  <Smartphone className="w-4 h-4" /> Phone
                </button>
                <button onClick={() => setAddTab("accessory")} className={`flex-1 py-2 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${addTab === "accessory" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400"}`}>
                  <Package className="w-4 h-4" /> Accessory
                </button>
              </div>

              {addTab === "phone" && (
                <div className="grid grid-cols-2 gap-3">
                  <SF label="Category" value={phone.category} options={["iPhone", "Android", "Other"]} onChange={v => upP("category", v)} cls="col-span-2" />
                  <F label="Brand" value={phone.brand} onChange={v => upP("brand", v)} />
                  <F label="Model" value={phone.model} onChange={v => upP("model", v)} />
                  <F label="IMEI" value={phone.imei} onChange={v => upP("imei", v)} cls="col-span-2" />
                  <F label="Price (LKR)" value={String(phone.price)} onChange={v => upP("price", Number(v))} type="number" />
                  <F label="Cost (LKR)" value={String(phone.cost)} onChange={v => upP("cost", Number(v))} type="number" />
                  <F label="Color" value={phone.color} onChange={v => upP("color", v)} />
                  <F label="Storage" value={phone.storage} onChange={v => upP("storage", v)} />
                  <SF label="Warranty" value={phone.warranty} options={["3 months", "6 months", "1 year", "2 years"]} onChange={v => upP("warranty", v)} />
                  <SF label="Condition" value={phone.condition} options={["New", "Used", "Refurbished"]} onChange={v => upP("condition", v)} />
                  <Button onClick={addPhone} className="col-span-2 bg-[#f36c21] hover:bg-[#e05b10] text-white h-11">
                    <Plus className="w-4 h-4 mr-1" /> Add Phone to Purchase
                  </Button>
                </div>
              )}

              {addTab === "accessory" && (
                <div className="grid grid-cols-2 gap-3">
                  <F label="Name" value={acc.name} onChange={v => upA("name", v)} cls="col-span-2" />
                  <F label="SKU (Optional)" value={acc.sku} onChange={v => upA("sku", v)} />
                  <SF label="Category" value={acc.category} options={["Cases", "Chargers", "Cables", "Audio", "Power Banks", "Other"]} onChange={v => upA("category", v)} />
                  <F label="Emoji" value={acc.emoji} onChange={v => upA("emoji", v)} />
                  <F label="Price (LKR)" value={String(acc.price)} onChange={v => upA("price", Number(v))} type="number" />
                  <F label="Cost (LKR)" value={String(acc.cost)} onChange={v => upA("cost", Number(v))} type="number" />
                  <F label="Quantity" value={String(acc.stock)} onChange={v => upA("stock", Number(v))} type="number" />
                  <F label="Low Stock Alert" value={String(acc.lowStockThreshold)} onChange={v => upA("lowStockThreshold", Number(v))} type="number" />
                  <Button onClick={addAcc} className="col-span-2 bg-[#f36c21] hover:bg-[#e05b10] text-white h-11">
                    <Plus className="w-4 h-4 mr-1" /> Add Accessory to Purchase
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* ── VIEW / REVIEW ITEMS ── */}
          {view === "items" && (
            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
              {items.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p className="text-sm font-bold">No items yet</p>
                  <p className="text-xs">Switch to "Add Item" tab to add phones or accessories</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3 group hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{item.type === "phone" ? (item.data.brand === "Apple" ? "🍎" : "🤖") : item.data.emoji}</span>
                        <div>
                          {item.type === "phone" ? (
                            <>
                              <p className="font-bold text-sm text-slate-800">{item.data.brand} {item.data.model}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{item.data.storage} • {item.data.color} • IMEI: {item.data.imei}</p>
                            </>
                          ) : (
                            <>
                              <p className="font-bold text-sm text-slate-800">{item.data.name}</p>
                              <p className="text-[10px] text-slate-400">{item.data.category} • Qty: {item.data.stock}</p>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <p className="font-black text-slate-900 text-sm">{formatLKR(item.type === "phone" ? item.data.cost : item.data.cost * item.data.stock)}</p>
                        <button onClick={() => removeItem(i)} className="p-1.5 text-rose-400 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Total + Complete & Print */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Total</p>
              <p className="text-2xl font-black text-white">{formatLKR(totalCost)}</p>
            </div>
            <Button
              onClick={completePurchase}
              disabled={items.length === 0 || !sellerName || saving}
              className="h-12 px-6 bg-[#f36c21] hover:bg-[#e05b10] text-white rounded-xl font-bold uppercase tracking-wide active:scale-95 transition-all disabled:opacity-50"
            >
              <Printer className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Complete & Print"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* ── Invoice Table ── */
const InvoiceTable = ({ items }: { items: PurchaseItem[] }) => (
  <table className="w-full mb-8 text-sm">
    <thead>
      <tr className="border-b-2 border-slate-100">
        <th className="py-3 text-left font-bold text-slate-400 uppercase tracking-wider text-xs">Item</th>
        <th className="py-3 text-center font-bold text-slate-400 uppercase tracking-wider text-xs">IMEI / SKU</th>
        <th className="py-3 text-right font-bold text-slate-400 uppercase tracking-wider text-xs">Cost (LKR)</th>
      </tr>
    </thead>
    <tbody>
      {items.map((item, i) =>
        item.type === "phone" ? (
          <tr key={i} className="border-b border-slate-50">
            <td className="py-3"><p className="font-bold text-slate-800">{item.data.brand} {item.data.model}</p><p className="text-xs text-slate-400">{item.data.storage} • {item.data.color} • {item.data.condition}</p></td>
            <td className="py-3 text-center text-xs font-mono text-slate-500">{item.data.imei}</td>
            <td className="py-3 text-right font-bold text-slate-800">{item.data.cost.toLocaleString("en-LK")}</td>
          </tr>
        ) : (
          <tr key={i} className="border-b border-slate-50">
            <td className="py-3"><p className="font-bold text-slate-800">{item.data.emoji} {item.data.name}</p><p className="text-xs text-slate-400">{item.data.category} • Qty: {item.data.stock}</p></td>
            <td className="py-3 text-center text-xs font-mono text-slate-500">{item.data.sku}</td>
            <td className="py-3 text-right font-bold text-slate-800">{(item.data.cost * item.data.stock).toLocaleString("en-LK")}</td>
          </tr>
        )
      )}
    </tbody>
  </table>
);

/* ── Reusable Field Components ── */
const F = ({ label, value, onChange, type = "text", cls = "" }: { label: string; value: string; onChange: (v: string) => void; type?: string; cls?: string }) => (
  <div className={cls}><label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label><input type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
);
const SF = ({ label, value, options, onChange, cls = "" }: { label: string; value: string; options: string[]; onChange: (v: string) => void; cls?: string }) => (
  <div className={cls}><label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label><select value={value} onChange={e => onChange(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">{options.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></div>
);
const FI = ({ label, value, onChange, placeholder, icon }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; icon?: React.ReactNode }) => (
  <div><label className="text-xs font-bold text-slate-500 mb-1 block">{label}</label><div className="relative">{icon && <span className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</span>}<input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={`w-full ${icon ? "pl-9" : "px-3"} pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-[#f36c21]`} /></div></div>
);

export default Sellers;
