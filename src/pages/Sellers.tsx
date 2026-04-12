import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, Printer, CheckCircle2, User, Phone as PhoneIcon, Calendar, Smartphone, Package, UserPlus, ShoppingBag } from "lucide-react";
import { Phone, Accessory, Seller } from "@/data/types";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { offlineSync } from "@/lib/offlineSync";

const formatLKR = (v: number) => `Rs. ${v.toLocaleString("en-LK")}`;

type PurchaseItem =
  | { type: "phone"; data: Phone }
  | { type: "accessory"; data: Accessory };

const Sellers = () => {
  const [sellerName, setSellerName] = useState("");
  const [sellerPhone, setSellerPhone] = useState("");
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [purchaseInvoiceNo, setPurchaseInvoiceNo] = useState("");
  const [date] = useState(new Date().toLocaleDateString("en-GB"));
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [showAddSeller, setShowAddSeller] = useState(false);
  const [newSellerName, setNewSellerName] = useState("");
  const [newSellerPhone, setNewSellerPhone] = useState("");

  useEffect(() => { fetchSellers(); }, []);

  const fetchSellers = async () => {
    try {
      const { data } = await supabase.from("sellers").select("*");
      if (data) {
        setSellers(data);
        if (data.length > 0) {
          setSellerName(data[0].name);
          setSellerPhone(data[0].phone || "");
        }
      }
    } catch (error) {
      console.warn("Could not fetch sellers", error);
    }
  };

  const handleAddNewSeller = async () => {
    if (!newSellerName.trim()) return toast.error("Please enter a seller name");
    try {
      const { data, error } = await supabase
        .from("sellers")
        .insert([{ name: newSellerName.trim(), phone: newSellerPhone.trim(), joined_date: new Date().toISOString() }])
        .select();
      if (error) throw error;
      toast.success(`Seller "${newSellerName}" added!`);
      setNewSellerName("");
      setNewSellerPhone("");
      setShowAddSeller(false);
      await fetchSellers();
      if (data && data[0]) {
        setSellerName(data[0].name);
        setSellerPhone(data[0].phone || "");
      }
    } catch (error: any) {
      toast.error("Error adding seller: " + error.message);
    }
  };

  const handleAddItem = (item: PurchaseItem) => {
    setItems(prev => [...prev, item]);
    setIsAddingItem(false);
  };

  const removeItem = (index: number) => setItems(prev => prev.filter((_, i) => i !== index));

  const totalCost = items.reduce((sum, item) =>
    sum + Number(item.type === "phone" ? item.data.cost : item.data.cost * item.data.stock)
  , 0);

  const completePurchase = async () => {
    if (!sellerName) return toast.error("Please select a seller");
    if (items.length === 0) return toast.error("Please add at least one item");
    try {
      const invoiceNo = `PUR-${Date.now().toString().slice(-6)}`;
      setPurchaseInvoiceNo(invoiceNo);

      const phones = items.filter(i => i.type === "phone").map(i => {
        const p = (i as { type: "phone"; data: Phone }).data;
        return {
          brand: p.brand, model: p.model, imei: p.imei, price: p.price,
          cost: p.cost, warranty: p.warranty, color: p.color, storage: p.storage,
          condition: p.condition, status: p.status, category: p.category,
          seller_name: sellerName,
        };
      });
      const accessories = items.filter(i => i.type === "accessory").map(i => {
        const a = (i as { type: "accessory"; data: Accessory }).data;
        return {
          name: a.name, sku: a.sku, category: a.category, price: a.price,
          cost: a.cost, stock: a.stock, low_stock_threshold: a.lowStockThreshold,
          emoji: a.emoji, seller_name: sellerName,
        };
      });

      if (phones.length > 0) {
        const { error } = await supabase.from("phones").insert(phones);
        if (error) throw error;
      }
      if (accessories.length > 0) {
        const { error } = await supabase.from("accessories").insert(accessories);
        if (error) throw error;
      }

      // Refresh offline cache
      const { data: pData } = await supabase.from("phones").select("*");
      const { data: aData } = await supabase.from("accessories").select("*");
      if (pData) {
        offlineSync.cacheInventory({
          phones: pData.map(p => ({ ...p, addedDate: p.added_date })),
          accessories: aData?.map(a => ({ ...a, lowStockThreshold: a.low_stock_threshold })) || [],
        });
      }

      toast.success("Purchase completed and items added to inventory!");
      setIsComplete(true);
    } catch (error: any) {
      toast.error("Error saving purchase: " + error.message);
    }
  };

  const resetPage = () => {
    setItems([]);
    setIsComplete(false);
    setPurchaseInvoiceNo("");
    if (sellers.length > 0) {
      setSellerName(sellers[0].name);
      setSellerPhone(sellers[0].phone || "");
    } else {
      setSellerName("");
      setSellerPhone("");
    }
  };

  /* ──────────────────── INVOICE VIEW ──────────────────── */
  if (isComplete) {
    return (
      <div className="p-3 md:p-6 max-w-4xl mx-auto">
        <div className="mb-4 flex justify-between items-center print:hidden">
          <Button variant="outline" onClick={resetPage}>Start New Purchase</Button>
          <Button onClick={() => window.print()} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
            <Printer className="w-4 h-4" /> Print Invoice
          </Button>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-xl print:shadow-none print:border-none print:p-0 max-w-2xl mx-auto">
          <div className="text-center pb-5 border-b border-dashed border-slate-200 mb-6">
            <div className="w-32 h-32 rounded-[2.5rem] bg-white mx-auto flex items-center justify-center p-1 border border-slate-100 mb-6 shadow-sm">
              <img src="434757956_122139159188124564_4746025914570679797_n.jpg" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 leading-none">iHacs Solutions</h2>
            <div className="mt-2 space-y-0.5">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pussellawa, Sri Lanka</p>
              <p className="text-[10px] font-black text-slate-500 tracking-wider">076 902 9003 / 075 098 5291</p>
              <p className="text-[10px] font-black text-[#f36c21] lowercase">ihackssolution@gmail.com</p>
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mt-4 border-t border-slate-50 pt-3">Purchase Invoice</p>
          </div>

          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Seller Details</h3>
              <p className="text-lg font-black text-slate-900">{sellerName}</p>
              {sellerPhone && <p className="text-sm text-slate-500 font-bold">{sellerPhone}</p>}
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-500 mt-1 uppercase tracking-widest">NO: <span className="text-slate-900 ml-1">{purchaseInvoiceNo}</span></p>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Date: <span className="text-slate-900 ml-1">{date}</span></p>
            </div>
          </div>

          <table className="w-full mb-8 text-sm">
            <thead>
              <tr className="border-b-2 border-slate-100">
                <th className="py-3 text-left font-bold text-slate-400 uppercase tracking-wider text-xs">Item Description</th>
                <th className="py-3 text-center font-bold text-slate-400 uppercase tracking-wider text-xs">IMEI / SKU</th>
                <th className="py-3 text-right font-bold text-slate-400 uppercase tracking-wider text-xs">Cost (LKR)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) =>
                item.type === "phone" ? (
                  <tr key={index} className="border-b border-slate-50">
                    <td className="py-3">
                      <p className="font-bold text-slate-800">{item.data.brand} {item.data.model}</p>
                      <p className="text-xs text-slate-400">{item.data.storage} • {item.data.color} • {item.data.condition}</p>
                    </td>
                    <td className="py-3 text-center text-slate-600 font-medium text-xs font-mono">{item.data.imei}</td>
                    <td className="py-3 text-right font-bold text-slate-800">{item.data.cost.toLocaleString("en-LK")}</td>
                  </tr>
                ) : (
                  <tr key={index} className="border-b border-slate-50">
                    <td className="py-3">
                      <p className="font-bold text-slate-800">{item.data.emoji} {item.data.name}</p>
                      <p className="text-xs text-slate-400">{item.data.category} • Qty: {item.data.stock}</p>
                    </td>
                    <td className="py-3 text-center text-slate-600 font-medium text-xs font-mono">{item.data.sku}</td>
                    <td className="py-3 text-right font-bold text-slate-800">{(item.data.cost * item.data.stock).toLocaleString("en-LK")}</td>
                  </tr>
                )
              )}
            </tbody>
          </table>

          <div className="flex justify-end pt-4 mb-10">
            <div className="w-full max-w-xs">
              <div className="flex justify-between items-end border-t border-dashed border-slate-200 pt-3">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Amount</span>
                <span className="text-2xl font-black text-slate-900 leading-none">{formatLKR(totalCost)}</span>
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

  /* ──────────────────── MAIN VIEW ──────────────────── */
  return (
    <div className="p-3 md:p-6 max-w-5xl mx-auto space-y-6">
      <div className="mb-2">
        <h2 className="text-xl font-bold text-foreground">Sellers &amp; Purchases</h2>
        <p className="text-xs text-muted-foreground">Add bulk inventory from sellers and generate purchase invoices.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ── Left Column ── */}
        <div className="md:col-span-1 space-y-4">

          {/* Seller Card — with Add New Seller */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <User className="w-4 h-4" /> Select Seller
            </h3>

            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">Seller / Business</label>
              <select
                value={sellerName}
                onChange={(e) => {
                  const s = sellers.find(x => x.name === e.target.value);
                  setSellerName(e.target.value);
                  setSellerPhone(s?.phone || "");
                }}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-[#f36c21] focus:ring-2 focus:ring-orange-500/20"
              >
                {sellers.length === 0 ? (
                  <option value="" disabled>No sellers yet — add one below</option>
                ) : (
                  sellers.map(s => (
                    <option key={s.id} value={s.name}>{s.name}{s.phone ? ` (${s.phone})` : ""}</option>
                  ))
                )}
              </select>
            </div>

            {/* Add New Seller — inside seller card */}
            <button
              onClick={() => setShowAddSeller(true)}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border-2 border-dashed border-orange-200 text-[#f36c21] text-xs font-black uppercase tracking-wider hover:bg-orange-50 transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" /> Add New Seller
            </button>

            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input value={date} disabled className="w-full pl-9 pr-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 cursor-not-allowed" />
              </div>
            </div>
          </div>

          {/* Dark Action Box */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-xl">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Total Purchase</h3>
            <p className="text-4xl font-black tracking-tight mb-5">{formatLKR(totalCost)}</p>

            {/* Green: Buy New Items — opens dialog */}
            <button
              onClick={() => setIsAddingItem(true)}
              className="w-full mb-3 h-11 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold uppercase tracking-wide text-sm active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" /> Buy New Items
            </button>

            {/* Orange: Complete & Print */}
            <Button
              onClick={completePurchase}
              disabled={items.length === 0 || !sellerName}
              className="w-full h-11 bg-[#f36c21] hover:bg-[#e05b10] text-white rounded-xl font-bold uppercase tracking-wide text-sm active:scale-95 transition-all disabled:opacity-50"
            >
              <Printer className="w-4 h-4 mr-2" /> Complete &amp; Print
            </Button>
          </div>
        </div>

        {/* ── Right Column: Items ── */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm min-h-[500px] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" /> Purchased Items ({items.length})
              </h3>
              <Button
                onClick={() => setIsAddingItem(true)}
                size="sm"
                className="bg-[#f36c21] hover:bg-[#e05b10] text-white rounded-lg text-xs gap-1"
              >
                <Plus className="w-4 h-4" /> Buy New Items
              </Button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto pr-2 pb-4">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 mt-20">
                  <ShoppingBag className="w-12 h-12 mb-3 opacity-20" />
                  <p className="text-sm font-bold text-slate-500">No items added yet</p>
                  <p className="text-xs">Click 'Buy New Items' to add phones or accessories.</p>
                </div>
              ) : (
                items.map((item, index) => (
                  <div key={index} className="p-4 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-lg">
                        {item.type === "phone"
                          ? (item.data.brand === "Apple" ? "🍎" : "🤖")
                          : item.data.emoji}
                      </div>
                      <div>
                        {item.type === "phone" ? (
                          <>
                            <p className="font-bold text-slate-800 text-sm">{item.data.brand} {item.data.model}</p>
                            <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1.5 mt-0.5">
                              <span>{item.data.storage}</span><span className="opacity-30">•</span>
                              <span>{item.data.condition}</span><span className="opacity-30">•</span>
                              <span className="font-mono text-orange-500">{item.data.imei.slice(-6)}</span>
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="font-bold text-slate-800 text-sm">{item.data.name}</p>
                            <p className="text-[10px] text-slate-500 font-bold mt-0.5">{item.data.category} • Qty: {item.data.stock}</p>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Cost</p>
                        <p className="font-black text-slate-900 text-sm">
                          {formatLKR(item.type === "phone" ? item.data.cost : item.data.cost * item.data.stock)}
                        </p>
                      </div>
                      <button onClick={() => removeItem(index)} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors opacity-50 group-hover:opacity-100">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Add Item Dialog (Phone OR Accessory) ── */}
      <AddItemDialog open={isAddingItem} onClose={() => setIsAddingItem(false)} onSave={handleAddItem} />

      {/* ── Add New Seller Dialog ── */}
      <Dialog open={showAddSeller} onOpenChange={setShowAddSeller}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><UserPlus className="w-5 h-5 text-[#f36c21]" /> Add New Seller</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <FI label="Seller / Business Name *" value={newSellerName} onChange={setNewSellerName} placeholder="Enter seller name" icon={<User className="w-4 h-4 text-slate-400" />} />
            <FI label="Contact Number (Optional)" value={newSellerPhone} onChange={setNewSellerPhone} placeholder="Enter phone number" icon={<PhoneIcon className="w-4 h-4 text-slate-400" />} />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowAddSeller(false)}>Cancel</Button>
            <Button onClick={handleAddNewSeller} className="bg-[#f36c21] hover:bg-[#e05b10] text-white">
              <UserPlus className="w-4 h-4 mr-1" /> Save Seller
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* ──── Add Item Dialog: Phone or Accessory ──── */
const AddItemDialog = ({ open, onClose, onSave }: {
  open: boolean; onClose: () => void;
  onSave: (item: { type: "phone"; data: Phone } | { type: "accessory"; data: Accessory }) => void;
}) => {
  const [tab, setTab] = useState<"phone" | "accessory">("phone");
  const [phone, setPhone] = useState<Phone>({
    id: "", brand: "", model: "", imei: "", price: 0, cost: 0,
    warranty: "6 months", color: "", storage: "128GB", condition: "New",
    status: "In Stock", addedDate: new Date().toISOString(), category: "iPhone",
  });
  const [acc, setAcc] = useState<Accessory>({
    id: "", name: "", sku: "", category: "Cases", price: 0, cost: 0,
    stock: 1, lowStockThreshold: 5, emoji: "📦",
  });

  if (!open) return null;

  const upP = (k: keyof Phone, v: string | number) => setPhone(p => ({ ...p, [k]: v }));
  const upA = (k: keyof Accessory, v: string | number) => setAcc(a => ({ ...a, [k]: v }));

  const handleSave = () => {
    if (tab === "phone") {
      if (!phone.brand || !phone.model || !phone.imei || !phone.cost)
        return toast.error("Please fill in Brand, Model, IMEI and Cost");
      onSave({ type: "phone", data: { ...phone, id: crypto.randomUUID() } });
      setPhone({ id: "", brand: "", model: "", imei: "", price: 0, cost: 0, warranty: "6 months", color: "", storage: "128GB", condition: "New", status: "In Stock", addedDate: new Date().toISOString(), category: "iPhone" });
    } else {
      if (!acc.name || !acc.cost)
        return toast.error("Please fill in Name and Cost");
      onSave({ type: "accessory", data: { ...acc, id: crypto.randomUUID() } });
      setAcc({ id: "", name: "", sku: "", category: "Cases", price: 0, cost: 0, stock: 1, lowStockThreshold: 5, emoji: "📦" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Buy New Items</DialogTitle>
        </DialogHeader>

        {/* Tab switcher */}
        <div className="flex gap-2 mb-2">
          <button onClick={() => setTab("phone")} className={`flex-1 py-2 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${tab === "phone" ? "bg-[#f36c21] text-white shadow-sm" : "bg-slate-100 text-slate-400 hover:text-slate-600"}`}>
            <Smartphone className="w-4 h-4" /> Phone
          </button>
          <button onClick={() => setTab("accessory")} className={`flex-1 py-2 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${tab === "accessory" ? "bg-[#f36c21] text-white shadow-sm" : "bg-slate-100 text-slate-400 hover:text-slate-600"}`}>
            <Package className="w-4 h-4" /> Accessory
          </button>
        </div>

        {/* Phone fields */}
        {tab === "phone" && (
          <div className="grid grid-cols-2 gap-3 py-2">
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
            <SF label="Status" value={phone.status} options={["In Stock", "Sold", "Reserved"]} onChange={v => upP("status", v)} cls="col-span-2" />
          </div>
        )}

        {/* Accessory fields */}
        {tab === "accessory" && (
          <div className="grid grid-cols-2 gap-3 py-2">
            <F label="Name" value={acc.name} onChange={v => upA("name", v)} cls="col-span-2" />
            <F label="SKU (Optional)" value={acc.sku} onChange={v => upA("sku", v)} />
            <SF label="Category" value={acc.category} options={["Cases", "Chargers", "Cables", "Audio", "Power Banks", "Other"]} onChange={v => upA("category", v)} />
            <F label="Emoji" value={acc.emoji} onChange={v => upA("emoji", v)} />
            <F label="Price (LKR)" value={String(acc.price)} onChange={v => upA("price", Number(v))} type="number" />
            <F label="Cost (LKR)" value={String(acc.cost)} onChange={v => upA("cost", Number(v))} type="number" />
            <F label="Quantity" value={String(acc.stock)} onChange={v => upA("stock", Number(v))} type="number" />
            <F label="Low Stock Alert" value={String(acc.lowStockThreshold)} onChange={v => upA("lowStockThreshold", Number(v))} type="number" />
          </div>
        )}

        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} className="bg-[#f36c21] hover:bg-[#e05b10] text-white">
            <Plus className="w-4 h-4 mr-1" /> Add to Purchase
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* ── Reusable Field Components ── */
const F = ({ label, value, onChange, type = "text", cls = "" }: { label: string; value: string; onChange: (v: string) => void; type?: string; cls?: string }) => (
  <div className={cls}>
    <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
  </div>
);

const SF = ({ label, value, options, onChange, cls = "" }: { label: string; value: string; options: string[]; onChange: (v: string) => void; cls?: string }) => (
  <div className={cls}>
    <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
    <select value={value} onChange={e => onChange(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);

const FI = ({ label, value, onChange, placeholder, icon }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; icon?: React.ReactNode }) => (
  <div>
    <label className="text-xs font-bold text-slate-500 mb-1 block">{label}</label>
    <div className="relative">
      {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</span>}
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={`w-full ${icon ? "pl-9" : "px-3"} pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-[#f36c21] focus:ring-2 focus:ring-orange-500/20`} />
    </div>
  </div>
);

export default Sellers;
