import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, Printer, CheckCircle2, User, Phone as PhoneIcon, Calendar, Smartphone, UserPlus } from "lucide-react";
import { Phone, Seller } from "@/data/types";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { offlineSync } from "@/lib/offlineSync";

const formatLKR = (v: number) => `Rs. ${v.toLocaleString("en-LK")}`;

const Sellers = () => {
  const [sellerName, setSellerName] = useState("");
  const [sellerPhone, setSellerPhone] = useState("");
  const [items, setItems] = useState<Phone[]>([]);
  const [isAddingPhone, setIsAddingPhone] = useState(false);
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
      // auto-select the newly added seller
      if (data && data[0]) {
        setSellerName(data[0].name);
        setSellerPhone(data[0].phone || "");
      }
    } catch (error: any) {
      toast.error("Error adding seller: " + error.message);
    }
  };

  const handleAddPhone = (newPhone: Phone) => {
    setItems(prev => [...prev, { ...newPhone, id: crypto.randomUUID() }]);
    setIsAddingPhone(false);
  };

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

  const totalCost = items.reduce((sum, item) => sum + Number(item.cost), 0);

  const completePurchase = async () => {
    if (!sellerName) return toast.error("Please select a seller");
    if (items.length === 0) return toast.error("Please add at least one item");
    try {
      const invoiceNo = `PUR-${Date.now().toString().slice(-6)}`;
      setPurchaseInvoiceNo(invoiceNo);
      const phonesToInsert = items.map(item => ({
        brand: item.brand, model: item.model, imei: item.imei,
        price: item.price, cost: item.cost, warranty: item.warranty,
        color: item.color, storage: item.storage, condition: item.condition,
        status: item.status, category: item.category, seller_name: sellerName,
      }));
      const { error } = await supabase.from("phones").insert(phonesToInsert);
      if (error) throw error;
      const { data: phones } = await supabase.from("phones").select("*");
      if (phones) {
        const { data: acc } = await supabase.from("accessories").select("*");
        offlineSync.cacheInventory({
          phones: phones.map(p => ({ ...p, addedDate: p.added_date })) || [],
          accessories: acc?.map(a => ({ ...a, lowStockThreshold: a.low_stock_threshold })) || []
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
                <th className="py-3 text-center font-bold text-slate-400 uppercase tracking-wider text-xs">IMEI</th>
                <th className="py-3 text-right font-bold text-slate-400 uppercase tracking-wider text-xs">Unit Cost (LKR)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} className="border-b border-slate-50">
                  <td className="py-3">
                    <p className="font-bold text-slate-800">{item.brand} {item.model}</p>
                    <p className="text-xs text-slate-400">{item.storage} • {item.color} • {item.condition}</p>
                  </td>
                  <td className="py-3 text-center text-slate-600 font-medium text-xs font-mono">{item.imei}</td>
                  <td className="py-3 text-right font-bold text-slate-800">{item.cost.toLocaleString("en-LK")}</td>
                </tr>
              ))}
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

  return (
    <div className="p-3 md:p-6 max-w-5xl mx-auto space-y-6">
      <div className="mb-2">
        <h2 className="text-xl font-bold text-foreground">Sellers &amp; Purchases</h2>
        <p className="text-xs text-muted-foreground">Add bulk inventory from sellers and generate purchase invoices.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="md:col-span-1 space-y-4">

          {/* Seller Dropdown Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
              <User className="w-4 h-4" /> Select Seller
            </h3>
            <div className="space-y-3">
              {/* Seller dropdown */}
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

              {/* Date */}
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    value={date}
                    disabled
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Orange Action Box */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-xl">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Total Purchase</h3>
            <p className="text-4xl font-black tracking-tight mb-5">{formatLKR(totalCost)}</p>

            {/* Add New Seller — inside orange box */}
            <button
              onClick={() => setShowAddSeller(true)}
              className="w-full mb-3 h-11 bg-[#f36c21] hover:bg-[#e05b10] text-white rounded-xl font-bold uppercase tracking-wide text-sm active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" /> Add New Seller
            </button>

            <Button
              onClick={completePurchase}
              disabled={items.length === 0 || !sellerName}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold uppercase tracking-wide text-sm active:scale-95 transition-all disabled:opacity-50"
            >
              <CheckCircle2 className="w-5 h-5 mr-2" /> Buy New Items
            </Button>
          </div>
        </div>

        {/* Right Column: Items */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm min-h-[500px] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Smartphone className="w-4 h-4" /> Purchased Items ({items.length})
              </h3>
              <Button onClick={() => setIsAddingPhone(true)} size="sm" className="bg-[#f36c21] hover:bg-[#e05b10] text-white rounded-lg text-xs gap-1">
                <Plus className="w-4 h-4" /> Add Phone
              </Button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto pr-2 pb-4">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 mt-20">
                  <Smartphone className="w-12 h-12 mb-3 opacity-20" />
                  <p className="text-sm font-bold text-slate-500">No items added yet</p>
                  <p className="text-xs">Click 'Add Phone' to start building this purchase.</p>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-lg">
                        {item.brand === "Apple" ? "🍎" : "🤖"}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{item.brand} {item.model}</p>
                        <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1.5 mt-0.5">
                          <span>{item.storage}</span>
                          <span className="opacity-30">•</span>
                          <span>{item.condition}</span>
                          <span className="opacity-30">•</span>
                          <span className="font-mono text-orange-500">{item.imei.slice(-6)}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Cost</p>
                        <p className="font-black text-slate-900 text-sm">{formatLKR(item.cost)}</p>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors opacity-50 group-hover:opacity-100"
                      >
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

      {/* Add Phone Dialog */}
      <PhoneDialog open={isAddingPhone} onClose={() => setIsAddingPhone(false)} onSave={handleAddPhone} />

      {/* Add New Seller Dialog */}
      <Dialog open={showAddSeller} onOpenChange={setShowAddSeller}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><UserPlus className="w-5 h-5 text-[#f36c21]" /> Add New Seller</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">Seller / Business Name *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={newSellerName}
                  onChange={e => setNewSellerName(e.target.value)}
                  placeholder="Enter seller name"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-[#f36c21] focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">Contact Number (Optional)</label>
              <div className="relative">
                <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={newSellerPhone}
                  onChange={e => setNewSellerPhone(e.target.value)}
                  placeholder="Enter phone number"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-[#f36c21] focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
            </div>
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

// Dialog for adding a phone to the purchase
const PhoneDialog = ({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (p: Phone) => void }) => {
  const [form, setForm] = useState<Phone>({
    id: "", brand: "", model: "", imei: "", price: 0, cost: 0,
    warranty: "6 months", color: "", storage: "128GB", condition: "New",
    status: "In Stock", addedDate: new Date().toISOString(), category: "iPhone"
  });

  if (!open) return null;

  const update = (key: keyof Phone, val: string | number) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSave = () => {
    if (!form.brand || !form.model || !form.imei || !form.cost) {
      return toast.error("Please fill in Brand, Model, IMEI and Cost");
    }
    onSave(form);
    setForm({ id: "", brand: "", model: "", imei: "", price: 0, cost: 0, warranty: "6 months", color: "", storage: "128GB", condition: "New", status: "In Stock", addedDate: new Date().toISOString(), category: "iPhone" });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Phone to Purchase</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-4">
          <SF label="Category" value={form.category} options={["iPhone", "Android", "Other"]} onChange={v => update("category", v)} cls="col-span-2" />
          <F label="Brand" value={form.brand} onChange={v => update("brand", v)} />
          <F label="Model" value={form.model} onChange={v => update("model", v)} />
          <F label="IMEI" value={form.imei} onChange={v => update("imei", v)} cls="col-span-2" />
          <F label="Price (LKR)" value={String(form.price)} onChange={v => update("price", Number(v))} type="number" />
          <F label="Cost (LKR)" value={String(form.cost)} onChange={v => update("cost", Number(v))} type="number" />
          <F label="Color" value={form.color} onChange={v => update("color", v)} />
          <F label="Storage" value={form.storage} onChange={v => update("storage", v)} />
          <SF label="Warranty" value={form.warranty} options={["3 months", "6 months", "1 year", "2 years"]} onChange={v => update("warranty", v)} />
          <SF label="Condition" value={form.condition} options={["New", "Used", "Refurbished"]} onChange={v => update("condition", v)} />
          <SF label="Status" value={form.status} options={["In Stock", "Sold", "Reserved"]} onChange={v => update("status", v)} cls="col-span-2" />
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} className="bg-[#f36c21] hover:bg-[#e05b10] text-white">Save Item</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const F = ({ label, value, onChange, type = "text", cls = "" }: { label: string; value: string; onChange: (v: string) => void; type?: string; cls?: string }) => (
  <div className={cls}>
    <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
  </div>
);

const SF = ({ label, value, options, onChange, cls = "" }: { label: string; value: string; options: string[]; onChange: (v: string) => void; cls?: string }) => (
  <div className={cls}>
    <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
    <select value={value} onChange={e => onChange(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);

export default Sellers;
