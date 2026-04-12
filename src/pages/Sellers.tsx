import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, Printer, CheckCircle2, User, Phone as PhoneIcon, Calendar, Smartphone } from "lucide-react";
import { Phone, Seller } from "@/data/types";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { offlineSync } from "@/lib/offlineSync";
import { useEffect } from "react";

const formatLKR = (v: number) => `Rs. ${v.toLocaleString("en-LK")}`;

const Sellers = () => {
  const [sellerName, setSellerName] = useState("");
  const [sellerPhone, setSellerPhone] = useState("");
  const [items, setItems] = useState<Phone[]>([]);
  const [isAddingPhone, setIsAddingPhone] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [purchaseInvoiceNo, setPurchaseInvoiceNo] = useState("");
  const [date] = useState(new Date().toLocaleDateString("en-GB"));
  
  const [existingSellers, setExistingSellers] = useState<Seller[]>([]);
  const [isNewSeller, setIsNewSeller] = useState(true);

  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    try {
      const { data } = await supabase.from("sellers").select("*");
      if (data && data.length > 0) {
        setExistingSellers(data);
        setIsNewSeller(false);
        setSellerName(data[0].name);
        setSellerPhone(data[0].phone || "");
      }
    } catch (error) {
      console.warn("Could not fetch sellers", error);
    }
  };

  const handleAddPhone = (newPhone: Phone) => {
    // Generate a temporary ID for the cart
    const phoneWithId = { ...newPhone, id: crypto.randomUUID() };
    setItems(prev => [...prev, phoneWithId]);
    setIsAddingPhone(false);
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const totalCost = items.reduce((sum, item) => sum + Number(item.cost), 0);

  const completePurchase = async () => {
    if (!sellerName) return toast.error("Please enter seller name");
    if (items.length === 0) return toast.error("Please add at least one item");

    try {
      const invoiceNo = `PUR-${Date.now().toString().slice(-6)}`;
      setPurchaseInvoiceNo(invoiceNo);

      const phonesToInsert = items.map(item => ({
        brand: item.brand,
        model: item.model,
        imei: item.imei,
        price: item.price,
        cost: item.cost,
        warranty: item.warranty,
        color: item.color,
        storage: item.storage,
        condition: item.condition,
        status: item.status,
        category: item.category,
      }));

      // In a real app we'd also store the purchase transaction. For now we insert items to inventory.
      const { error } = await supabase.from("phones").insert(phonesToInsert);
      if (error) throw error;

      // Add Seller to DB if not exists
      try {
        if (isNewSeller) {
          const { data: existingSellersList } = await supabase.from("sellers").select("id").eq("name", sellerName.trim());
          if (!existingSellersList || existingSellersList.length === 0) {
            await supabase.from("sellers").insert([{ name: sellerName.trim(), phone: sellerPhone, joined_date: new Date().toISOString() }]);
          }
        }
      } catch (err) {
        console.warn("Could not save seller (check if sellers table is created)", err);
      }

      // Update offline cache if possible, simple approach:
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
    if (existingSellers.length > 0) {
      setIsNewSeller(false);
      setSellerName(existingSellers[0].name);
      setSellerPhone(existingSellers[0].phone || "");
    } else {
      setSellerName("");
      setSellerPhone("");
      setIsNewSeller(true);
    }
    setItems([]);
    setIsComplete(false);
    setPurchaseInvoiceNo("");
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

        {/* Invoice Layout */}
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
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 shadow-sm">Seller Details</h3>
              <p className="text-lg font-black text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>{sellerName}</p>
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
        <h2 className="text-xl font-bold text-foreground">Sellers & Purchases</h2>
        <p className="text-xs text-muted-foreground">Add bulk inventory from sellers and generate purchase invoices.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Details */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center justify-between gap-2">
              <span className="flex items-center gap-2"><User className="w-4 h-4" /> Seller Info</span>
              <button 
                onClick={() => {
                  setIsNewSeller(!isNewSeller);
                  if (!isNewSeller) {
                    setSellerName("");
                    setSellerPhone("");
                  } else if (existingSellers.length > 0) {
                    setSellerName(existingSellers[0].name);
                    setSellerPhone(existingSellers[0].phone || "");
                  } else {
                    setSellerName("");
                    setSellerPhone("");
                  }
                }}
                className="text-[10px] text-[#f36c21] hover:underline"
              >
                {isNewSeller ? "Select Existing" : "+ Add New Seller"}
              </button>
            </h3>
            <div className="space-y-4">
              {!isNewSeller ? (
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">Select Seller</label>
                  <select 
                    value={sellerName}
                    onChange={(e) => {
                      const s = existingSellers.find(x => x.name === e.target.value);
                      if (s) {
                        setSellerName(s.name);
                        setSellerPhone(s.phone || "");
                      }
                    }}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-[#f36c21] focus:ring-2 focus:ring-orange-500/20"
                  >
                    {existingSellers.length === 0 ? (
                      <option value="" disabled>No sellers available yet</option>
                    ) : (
                      existingSellers.map(s => (
                        <option key={s.id} value={s.name}>{s.name} {s.phone ? `(${s.phone})` : ""}</option>
                      ))
                    )}
                  </select>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">New Seller Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        value={sellerName}
                        onChange={e => setSellerName(e.target.value)}
                        placeholder="Enter new seller name"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-[#f36c21] focus:ring-2 focus:ring-orange-500/20 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Contact Number (Optional)</label>
                    <div className="relative">
                      <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        value={sellerPhone}
                        onChange={e => setSellerPhone(e.target.value)}
                        placeholder="Enter phone number"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-[#f36c21] focus:ring-2 focus:ring-orange-500/20 transition-all"
                      />
                    </div>
                  </div>
                </>
              )}
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
          
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-xl shadow-slate-200">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Total Purchase</h3>
            <p className="text-4xl font-black tracking-tight mb-6">{formatLKR(totalCost)}</p>
            <Button 
              onClick={completePurchase}
              disabled={items.length === 0 || !sellerName}
              className="w-full h-12 bg-[#f36c21] hover:bg-[#e05b10] text-white rounded-xl font-bold uppercase tracking-wide text-sm active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
            >
              <CheckCircle2 className="w-5 h-5 mr-2" /> Complete & Print
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

            <div className="flex-1 space-y-3 overflow-y-auto pr-2 pb-16">
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
                        title="Remove"
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

      <PhoneDialog 
        open={isAddingPhone} 
        onClose={() => setIsAddingPhone(false)} 
        onSave={handleAddPhone} 
      />
    </div>
  );
};

// Reusable inline dialog for adding a phone
const PhoneDialog = ({ open, onClose, onSave }: { open: boolean, onClose: () => void, onSave: (p: Phone) => void }) => {
  const [form, setForm] = useState<Phone>({
    id: "", brand: "", model: "", imei: "", price: 0, cost: 0,
    warranty: "6 months", color: "", storage: "128GB", condition: "New",
    status: "In Stock", addedDate: new Date().toISOString(), category: "Other"
  });

  if (!open) return null;

  const update = (key: keyof Phone, val: string | number) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleSave = () => {
    if (!form.brand || !form.model || !form.imei || !form.cost) {
      return toast.error("Please fill in basic phone details (Brand, Model, IMEI, Cost)");
    }
    onSave(form);
    // Reset form after saving
    setForm({
      id: "", brand: "", model: "", imei: "", price: 0, cost: 0,
      warranty: "6 months", color: "", storage: "128GB", condition: "New",
      status: "In Stock", addedDate: new Date().toISOString(), category: "Other"
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Phone to Purchase</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-4">
          <SelectField label="Category" value={form.category} options={["iPhone", "Android", "Other"]} onChange={(v) => update("category", v)} className="col-span-2" />
          <Field label="Brand" value={form.brand} onChange={(v) => update("brand", v)} />
          <Field label="Model" value={form.model} onChange={(v) => update("model", v)} />
          <Field label="IMEI" value={form.imei} onChange={(v) => update("imei", v)} className="col-span-2" />
          <Field label="Price (LKR)" value={String(form.price)} onChange={(v) => update("price", Number(v))} type="number" />
          <Field label="Cost (LKR)" value={String(form.cost)} onChange={(v) => update("cost", Number(v))} type="number" />
          <Field label="Color" value={form.color} onChange={(v) => update("color", v)} />
          <Field label="Storage" value={form.storage} onChange={(v) => update("storage", v)} />
          <SelectField label="Warranty" value={form.warranty} options={["3 months", "6 months", "1 year", "2 years"]} onChange={(v) => update("warranty", v)} />
          <SelectField label="Condition" value={form.condition} options={["New", "Used", "Refurbished"]} onChange={(v) => update("condition", v)} />
          <SelectField label="Status" value={form.status} options={["In Stock", "Sold", "Reserved"]} onChange={(v) => update("status", v)} className="col-span-2" />
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} className="bg-[#f36c21] hover:bg-[#e05b10] text-white">Save Item</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Field = ({ label, value, onChange, type = "text", className = "" }: { label: string; value: string; onChange: (v: string) => void; type?: string; className?: string; }) => (
  <div className={className}>
    <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
  </div>
);

const SelectField = ({ label, value, options, onChange, className = "" }: { label: string; value: string; options: string[]; onChange: (v: string) => void; className?: string; }) => (
  <div className={className}>
    <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
    <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
      {options.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
    </select>
  </div>
);

export default Sellers;
