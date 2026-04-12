import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Search, Edit2, Trash2, Smartphone, Package, Apple, Monitor, Tablet, ShieldCheck, Cable, Headphones, BatteryCharging, Zap, MoreHorizontal, Loader2 } from "lucide-react";
import { Phone, Accessory, Seller } from "@/data/types";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { offlineSync } from "@/lib/offlineSync";

const formatLKR = (v: number) => `Rs. ${v.toLocaleString("en-LK")}`;

const warrantyOptions = ["3 months", "6 months", "1 year", "2 years"];
const conditionOptions: Phone["condition"][] = ["New", "Used", "Refurbished"];
const statusOptions: Phone["status"][] = ["In Stock", "Sold", "Reserved"];
const phoneCategoryOptions: Phone["category"][] = ["iPhone", "Android", "Other"];
const accCategoryOptions: Accessory["category"][] = ["Back Covers", "Tempered Glasses", "Chargers", "Cables", "Audio", "Power Banks", "Other"];

const phoneCategoryIcons: Record<string, React.ElementType> = {
  "iPhone": Apple,
  "Android": Monitor,
  "Other": Tablet,
};

const accCategoryIcons: Record<string, React.ElementType> = {
  "All": Package,
  "Back Covers": Smartphone,
  "Tempered Glasses": ShieldCheck,
  "Chargers": Zap,
  "Cables": Cable,
  "Audio": Headphones,
  "Power Banks": BatteryCharging,
  "Other": MoreHorizontal,
};

const Inventory = () => {
  const [phoneList, setPhoneList] = useState<Phone[]>([]);
  const [accList, setAccList] = useState<Accessory[]>([]);
  const [sellerList, setSellerList] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [phoneSearch, setPhoneSearch] = useState("");
  const [accSearch, setAccSearch] = useState("");
  const [editPhone, setEditPhone] = useState<Phone | null>(null);
  const [editAcc, setEditAcc] = useState<Accessory | null>(null);
  const [isNewPhone, setIsNewPhone] = useState(false);
  const [isNewAcc, setIsNewAcc] = useState(false);
  const [phoneSubTab, setPhoneSubTab] = useState<"iPhone" | "Android" | "Other">("iPhone");
  const [accSubTab, setAccSubTab] = useState<string>("All");

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const { data: phones, error: phoneError } = await supabase.from("phones").select("*");
      const { data: acc, error: accError } = await supabase.from("accessories").select("*");
      const { data: sellersData } = await supabase.from("sellers").select("*");

      if (phoneError) throw phoneError;
      if (accError) throw accError;

      setSellerList(sellersData || []);

      setPhoneList(phones.map(p => ({
        ...p,
        addedDate: p.added_date
      })) || []);
      setAccList(acc.map(a => ({
        ...a,
        lowStockThreshold: a.low_stock_threshold
      })) || []);

      // Cache for offline
      offlineSync.cacheInventory({ 
        phones: phones.map(p => ({ ...p, addedDate: p.added_date })) || [], 
        accessories: acc.map(a => ({ ...a, lowStockThreshold: a.low_stock_threshold })) || [] 
      });
    } catch (error: any) {
      if (!navigator.onLine) {
        toast.info("Offline: Showing cached stock");
        const cached = offlineSync.getCachedInventory();
        setPhoneList(cached.phones);
        setAccList(cached.accessories);
      } else {
        toast.error("Failed to fetch inventory: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const savePhone = async (phone: Phone) => {
    const phoneData = {
      brand: phone.brand,
      model: phone.model,
      imei: phone.imei,
      price: phone.price,
      cost: phone.cost,
      warranty: phone.warranty,
      color: phone.color,
      storage: phone.storage,
      condition: phone.condition,
      status: phone.status,
      category: phone.category,
      seller_name: phone.seller_name,
    };

    try {
      if (isNewPhone) {
        const { error } = await supabase.from("phones").insert([phoneData]);
        if (error) throw error;
        toast.success("Phone added");
      } else {
        const { error } = await supabase.from("phones").update(phoneData).eq("id", phone.id);
        if (error) throw error;
        toast.success("Phone updated");
      }
      fetchInventory();
      setEditPhone(null);
      setIsNewPhone(false);
    } catch (error: any) {
      toast.error("Error saving phone: " + error.message);
    }
  };

  const deletePhone = async (id: string) => {
    try {
      const { error } = await supabase.from("phones").delete().eq("id", id);
      if (error) throw error;
      toast.success("Phone deleted");
      fetchInventory();
    } catch (error: any) {
      toast.error("Error deleting phone: " + error.message);
    }
  };

  const saveAcc = async (acc: Accessory) => {
    const accData = {
      name: acc.name,
      sku: acc.sku,
      category: acc.category,
      price: acc.price,
      cost: acc.cost,
      stock: acc.stock,
      low_stock_threshold: acc.lowStockThreshold,
      emoji: acc.emoji,
      seller_name: acc.seller_name,
    };

    try {
      if (isNewAcc) {
        const { error } = await supabase.from("accessories").insert([accData]);
        if (error) throw error;
        toast.success("Accessory added");
      } else {
        const { error } = await supabase.from("accessories").update(accData).eq("id", acc.id);
        if (error) throw error;
        toast.success("Accessory updated");
      }
      fetchInventory();
      setEditAcc(null);
      setIsNewAcc(false);
    } catch (error: any) {
      toast.error("Error saving accessory: " + error.message);
    }
  };

  const deleteAcc = async (id: string) => {
    try {
      const { error } = await supabase.from("accessories").delete().eq("id", id);
      if (error) throw error;
      toast.success("Accessory deleted");
      fetchInventory();
    } catch (error: any) {
      toast.error("Error deleting accessory: " + error.message);
    }
  };

  const newPhone = (): Phone => ({
    id: "", brand: "", model: "", imei: "", price: 0, cost: 0,
    warranty: "6 months", color: "", storage: "128GB", condition: "New",
    status: "In Stock", addedDate: new Date().toISOString(),
    category: phoneSubTab,
  });

  const newAcc = (): Accessory => ({
    id: "", name: "", sku: "", category: accSubTab === "All" ? "Other" : accSubTab as Accessory["category"],
    price: 0, cost: 0, stock: 0, lowStockThreshold: 5, emoji: "📦",
  });

  const filteredPhones = phoneList
    .filter((p) => p.category === phoneSubTab)
    .filter((p) => `${p.brand} ${p.model} ${p.imei}`.toLowerCase().includes(phoneSearch.toLowerCase()));

  const filteredAcc = accList
    .filter((a) => accSubTab === "All" || a.category === accSubTab)
    .filter((a) => `${a.name} ${a.sku}`.toLowerCase().includes(accSearch.toLowerCase()));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse">Loading inventory...</p>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-6 max-w-7xl mx-auto">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-foreground">Inventory</h2>
        <p className="text-xs text-muted-foreground">Manage phones and accessories</p>
      </div>

      <Tabs defaultValue="phones">
        <TabsList className="mb-4 w-full justify-start">
          <TabsTrigger value="phones" className="gap-1.5 flex-1 sm:flex-initial">
            <Smartphone className="w-4 h-4" /> Phones ({phoneList.length})
          </TabsTrigger>
          <TabsTrigger value="accessories" className="gap-1.5 flex-1 sm:flex-initial">
            <Package className="w-4 h-4" /> Accessories ({accList.length})
          </TabsTrigger>
        </TabsList>

        {/* PHONES TAB */}
        <TabsContent value="phones" className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {phoneCategoryOptions.map((cat) => {
              const count = phoneList.filter((p) => p.category === cat).length;
              const Icon = phoneCategoryIcons[cat];
              return (
                <button
                  key={cat}
                  onClick={() => setPhoneSubTab(cat)}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl text-xs font-black transition-all border-2 min-h-[90px] group ${
                    phoneSubTab === cat
                      ? "bg-[#f36c21] text-white shadow-xl shadow-orange-100 border-[#f36c21]"
                      : "bg-white border-slate-100 text-slate-400 hover:text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <Icon className={`w-6 h-6 mb-1 ${phoneSubTab === cat ? "text-white" : "text-slate-300 group-hover:text-orange-400"}`} />
                  <span className="mb-0.5 tracking-tight uppercase tracking-widest leading-none">{cat}</span>
                  <p className={`text-[10px] font-bold ${phoneSubTab === cat ? "text-orange-100" : "text-slate-400"}`}>{count}</p>
                </button>
              );
            })}
          </div>

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#f36c21] transition-colors" />
            <input
              placeholder={`Search ${phoneSubTab}...`}
              value={phoneSearch}
              onChange={(e) => setPhoneSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-[#f36c21] transition-all placeholder:text-slate-300 placeholder:font-medium"
            />
          </div>

          <div className="space-y-2 pb-24">
            {filteredPhones.map((p) => (
              <div 
                key={p.id} 
                onClick={() => { setIsNewPhone(false); setEditPhone(p); }}
                className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-4 active:scale-[0.98] transition-all relative overflow-hidden group hover:border-orange-200 shadow-sm"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-xl grayscale group-hover:grayscale-0 transition-all shrink-0">
                  {p.brand === "Apple" ? "🍎" : "🤖"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm md:text-base leading-none truncate text-slate-800 font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>{p.model}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter shrink-0 ${
                      p.status === "In Stock" ? "bg-emerald-100 text-emerald-700 font-bold" : "bg-slate-100 text-slate-500 font-bold"
                    }`}>
                      {p.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 truncate">
                    <span className="uppercase">{p.brand}</span>
                    <span className="opacity-30">•</span>
                    <span>{p.storage}</span>
                    <span className="opacity-30">•</span>
                    <span className="text-orange-500/50">IMEI: {p.imei.slice(-4).padStart(p.imei.length, "•")}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-base md:text-lg font-black text-slate-900 leading-none">{formatLKR(p.price)}</p>
                  <button 
                    onClick={(e) => { e.stopPropagation(); if(confirm("Delete this phone?")) deletePhone(p.id); }}
                    className="mt-1.5 px-3 py-1 bg-rose-50 border border-rose-100 rounded-lg text-[9px] font-black text-rose-500 uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-all active:scale-90"
                  >
                    Delete Phone
                  </button>
                </div>
              </div>
            ))}
            {filteredPhones.length === 0 && (
              <div className="text-center py-20 bg-white/50 border border-dashed border-slate-200 rounded-2xl text-slate-400 text-sm font-bold">No {phoneSubTab} phones matching your search</div>
            )}
          </div>

          {/* Floating Action Button (FAB) */}
          <button
            onClick={(e) => { e.stopPropagation(); setIsNewPhone(true); setEditPhone(newPhone()); }}
            className="fixed bottom-28 right-6 w-16 h-16 bg-[#f36c21] text-white rounded-full shadow-2xl shadow-orange-300 flex items-center justify-center active:scale-95 transition-all z-[60] hover:bg-orange-600 ring-4 ring-white"
          >
            <Plus className="w-8 h-8 stroke-[3]" />
          </button>
        </TabsContent>

        {/* ACCESSORIES TAB */}
        <TabsContent value="accessories" className="space-y-4">
          <div className="grid grid-cols-4 gap-2">
            {["All", ...accCategoryOptions].map((cat) => {
              const count = cat === "All" ? accList.length : accList.filter((a) => a.category === cat).length;
              const Icon = accCategoryIcons[cat] || Package;
              return (
                <button
                  key={cat}
                  onClick={() => setAccSubTab(cat)}
                  className={`flex flex-col items-center justify-center p-2 rounded-2xl text-[9px] font-black transition-all border-2 min-h-[75px] group ${
                    accSubTab === cat
                      ? "bg-slate-900 text-white shadow-xl shadow-slate-200 border-slate-900"
                      : "bg-white border-slate-100 text-slate-400 hover:text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-1 ${accSubTab === cat ? "text-white" : "text-slate-300 group-hover:text-orange-400"}`} />
                  <span className="tracking-tight uppercase leading-none text-center px-1">{cat.split(' ')[0]}</span>
                  <p className={`text-[8px] font-bold mt-1 ${accSubTab === cat ? "text-slate-300" : "text-slate-400"}`}>{count}</p>
                </button>
              );
            })}
          </div>

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#f36c21] transition-colors" />
            <input
              placeholder="Search accessories..."
              value={accSearch}
              onChange={(e) => setAccSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-[#f36c21] transition-all placeholder:text-slate-300 placeholder:font-medium"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pb-24">
            {filteredAcc.map((a) => (
              <div 
                key={a.id} 
                onClick={() => { setIsNewAcc(false); setEditAcc(a); }}
                className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-4 active:scale-[0.98] transition-all relative overflow-hidden group hover:border-orange-200 shadow-sm"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-2xl grayscale group-hover:grayscale-0 transition-all font-bold">
                  {a.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm md:text-base leading-none truncate text-slate-800 font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>{a.name}</p>
                    <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter shrink-0 flex items-center gap-1 ${
                      Number(a.stock) > Number(a.lowStockThreshold || 5) 
                        ? "bg-emerald-100 text-emerald-700" 
                        : "bg-rose-100 text-rose-700 border border-rose-200 animate-pulse"
                    }`}>
                      {Number(a.stock) <= Number(a.lowStockThreshold || 5) && <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />}
                      {a.stock} {Number(a.stock) <= Number(a.lowStockThreshold || 5) ? "LOW STOCK" : "IN STOCK"}
                    </span>
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate opacity-70 flex items-center gap-1.5">
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[8px]">SKU: {a.sku}</span>
                    <span className="opacity-30">•</span>
                    <span>{a.category}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-base md:text-lg font-black text-slate-900 leading-none">{formatLKR(a.price)}</p>
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteAcc(a.id); }}
                    className="mt-1 text-[9px] font-black text-red-500 uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Delete Item
                  </button>
                </div>
              </div>
            ))}
            {filteredAcc.length === 0 && (
              <div className="col-span-full text-center py-20 bg-white/50 border border-dashed border-slate-200 rounded-2xl text-slate-400 text-sm font-bold">No items matching your search</div>
            )}
          </div>

          {/* Floating Action Button (FAB) for Acc */}
          <button
            onClick={(e) => { e.stopPropagation(); setIsNewAcc(true); setEditAcc(newAcc()); }}
            className="fixed bottom-28 right-6 w-16 h-16 bg-[#f36c21] text-white rounded-full shadow-2xl shadow-orange-300 flex items-center justify-center active:scale-95 transition-all z-[60] hover:bg-orange-600 ring-4 ring-white"
          >
            <Plus className="w-8 h-8 stroke-[3]" />
          </button>
        </TabsContent>
      </Tabs>

      {/* Phone Edit Dialog */}
      <PhoneDialog
        phone={editPhone}
        isNew={isNewPhone}
        sellers={sellerList}
        onSave={savePhone}
        onClose={() => { setEditPhone(null); setIsNewPhone(false); }}
      />

      {/* Accessory Edit Dialog */}
      <AccDialog
        acc={editAcc}
        isNew={isNewAcc}
        sellers={sellerList}
        onSave={saveAcc}
        onClose={() => { setEditAcc(null); setIsNewAcc(false); }}
      />
    </div>
  );
};

const PhoneDialog = ({ phone, isNew, sellers, onSave, onClose }: {
  phone: Phone | null; isNew: boolean; sellers: Seller[]; onSave: (p: Phone) => void; onClose: () => void;
}) => {
  const [form, setForm] = useState<Phone>(phone || {} as Phone);

  if (!phone) return null;

  const update = (key: keyof Phone, val: string | number) => setForm((prev) => ({ ...prev, [key]: val }));

  if (phone && form.id !== phone.id && !isNew) setForm(phone);
  if (isNew && form.id !== "") setForm(phone);

  return (
    <Dialog open={!!phone} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isNew ? "Add New Phone" : "Edit Phone"}</DialogTitle>
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
          <SelectField label="Seller" value={form.seller_name || ""} options={["", ...sellers.map(s => s.name)]} onChange={(v) => update("seller_name", v)} />
          <SelectField label="Warranty" value={form.warranty} options={warrantyOptions} onChange={(v) => update("warranty", v)} />
          <SelectField label="Condition" value={form.condition} options={conditionOptions} onChange={(v) => update("condition", v)} />
          <SelectField label="Status" value={form.status} options={statusOptions} onChange={(v) => update("status", v)} className="col-span-2" />
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(form)}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const AccDialog = ({ acc, isNew, sellers, onSave, onClose }: {
  acc: Accessory | null; isNew: boolean; sellers: Seller[]; onSave: (a: Accessory) => void; onClose: () => void;
}) => {
  const [form, setForm] = useState<Accessory>(acc || {} as Accessory);

  if (!acc) return null;

  const update = (key: keyof Accessory, val: string | number) => setForm((prev) => ({ ...prev, [key]: val }));

  if (acc && form.id !== acc.id && !isNew) setForm(acc);
  if (isNew && form.id !== "") setForm(acc);

  return (
    <Dialog open={!!acc} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isNew ? "Add New Accessory" : "Edit Accessory"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-4">
          <Field label="Name" value={form.name} onChange={(v) => update("name", v)} className="col-span-2" />
          <Field label="SKU" value={form.sku} onChange={(v) => update("sku", v)} />
          <SelectField label="Category" value={form.category} options={accCategoryOptions} onChange={(v) => update("category", v)} />
          <Field label="Price (LKR)" value={String(form.price)} onChange={(v) => update("price", Number(v))} type="number" />
          <Field label="Cost (LKR)" value={String(form.cost)} onChange={(v) => update("cost", Number(v))} type="number" />
          <Field label="Stock" value={String(form.stock)} onChange={(v) => update("stock", Number(v))} type="number" />
          <Field label="Low Stock Threshold" value={String(form.lowStockThreshold)} onChange={(v) => update("lowStockThreshold", Number(v))} type="number" />
          <SelectField label="Seller" value={form.seller_name || ""} options={["", ...sellers.map(s => s.name)]} onChange={(v) => update("seller_name", v)} className="col-span-2" />
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(form)}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Field = ({ label, value, onChange, type = "text", className = "" }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; className?: string;
}) => (
  <div className={className}>
    <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
    />
  </div>
);

const SelectField = ({ label, value, options, onChange, className = "" }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void; className?: string;
}) => (
  <div className={className}>
    <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  </div>
);

export default Inventory;
