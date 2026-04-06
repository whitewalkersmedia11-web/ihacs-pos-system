import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Search, Edit2, Trash2, Smartphone, Package, Apple, Monitor, Tablet, ShieldCheck, Cable, Headphones, BatteryCharging, Zap, MoreHorizontal, Loader2 } from "lucide-react";
import { Phone, Accessory } from "@/data/types";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

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

      if (phoneError) throw phoneError;
      if (accError) throw accError;

      setPhoneList(phones.map(p => ({
        ...p,
        addedDate: p.added_date
      })) || []);
      setAccList(acc.map(a => ({
        ...a,
        lowStockThreshold: a.low_stock_threshold
      })) || []);
    } catch (error: any) {
      toast.error("Failed to fetch inventory: " + error.message);
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
        <TabsContent value="phones" className="space-y-3">
          {/* Sub-tabs: iPhone / Android / Other - LARGE non-scrollable */}
          <div className="grid grid-cols-3 gap-3">
            {phoneCategoryOptions.map((cat) => {
              const count = phoneList.filter((p) => p.category === cat).length;
              const Icon = phoneCategoryIcons[cat];
              return (
                <button
                  key={cat}
                  onClick={() => setPhoneSubTab(cat)}
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl text-sm font-bold transition-all border-2 min-h-[110px] ${
                    phoneSubTab === cat
                      ? "bg-primary text-primary-foreground shadow-lg border-primary"
                      : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
                  }`}
                >
                  <Icon className="w-8 h-8" />
                  <span className="text-base">{cat}</span>
                  <span className={`text-xs font-normal ${phoneSubTab === cat ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                    {count} items
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                placeholder="Search brand, model, IMEI..."
                value={phoneSearch}
                onChange={(e) => setPhoneSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <Button size="sm" onClick={() => { setIsNewPhone(true); setEditPhone(newPhone()); }} className="gap-1">
              <Plus className="w-4 h-4" /> Add
            </Button>
          </div>

          <div className="space-y-2">
            {filteredPhones.map((phone) => (
              <div key={phone.id} className="bg-card border border-border rounded-xl p-3 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base">📱</span>
                    <p className="font-semibold text-sm text-foreground">{phone.brand} {phone.model}</p>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      phone.status === "In Stock" ? "bg-success/10 text-success" :
                      phone.status === "Sold" ? "bg-muted text-muted-foreground" :
                      "bg-accent/10 text-accent"
                    }`}>{phone.status}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0 text-[11px] text-muted-foreground mt-0.5">
                    <span>IMEI: {phone.imei}</span>
                    <span>{phone.condition} · {phone.storage} · {phone.color}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-xs font-bold text-foreground">{formatLKR(phone.price)}</p>
                    <p className="text-[10px] text-muted-foreground">Cost: {formatLKR(phone.cost)}</p>
                  </div>
                  <button onClick={() => { setIsNewPhone(false); setEditPhone(phone); }} className="p-1.5 rounded-lg hover:bg-secondary"><Edit2 className="w-3.5 h-3.5 text-muted-foreground" /></button>
                  <button onClick={() => deletePhone(phone.id)} className="p-1.5 rounded-lg hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                </div>
              </div>
            ))}
            {filteredPhones.length === 0 && (
              <div className="text-center py-10 text-muted-foreground text-sm">No {phoneSubTab} phones found</div>
            )}
          </div>
        </TabsContent>

        {/* ACCESSORIES TAB */}
        <TabsContent value="accessories" className="space-y-3">
          {/* Sub-tabs - 3 columns, large, non-scrollable, "All" at end */}
          <div className="grid grid-cols-3 gap-3">
            {[...accCategoryOptions, "All"].map((cat) => {
              const count = cat === "All" ? accList.length : accList.filter((a) => a.category === cat).length;
              const Icon = accCategoryIcons[cat] || Package;
              return (
                <button
                  key={cat}
                  onClick={() => setAccSubTab(cat)}
                  className={`flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl text-sm font-bold transition-all border-2 min-h-[100px] ${
                    accSubTab === cat
                      ? "bg-primary text-primary-foreground shadow-lg border-primary"
                      : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
                  }`}
                >
                  <Icon className="w-7 h-7" />
                  <span className="text-center leading-tight text-xs font-semibold">{cat}</span>
                  <span className={`text-[10px] font-normal ${accSubTab === cat ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{count}</span>
                </button>
              );
            })}
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                placeholder="Search name, SKU..."
                value={accSearch}
                onChange={(e) => setAccSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <Button size="sm" onClick={() => { setIsNewAcc(true); setEditAcc(newAcc()); }} className="gap-1">
              <Plus className="w-4 h-4" /> Add
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {filteredAcc.map((acc) => (
              <div key={acc.id} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
                <span className="text-xl">{acc.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{acc.name}</p>
                  <p className="text-[11px] text-muted-foreground">SKU: {acc.sku} · {acc.category}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-bold text-foreground">{formatLKR(acc.price)}</p>
                  <p className={`text-[11px] font-bold ${acc.stock <= acc.lowStockThreshold ? (acc.stock <= 3 ? "text-destructive" : "text-accent") : "text-success"}`}>
                    {acc.stock} in stock
                  </p>
                </div>
                <button onClick={() => { setIsNewAcc(false); setEditAcc(acc); }} className="p-1.5 rounded-lg hover:bg-secondary"><Edit2 className="w-3.5 h-3.5 text-muted-foreground" /></button>
                <button onClick={() => deleteAcc(acc.id)} className="p-1.5 rounded-lg hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
              </div>
            ))}
            {filteredAcc.length === 0 && (
              <div className="col-span-2 text-center py-10 text-muted-foreground text-sm">No accessories found</div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Phone Edit Dialog */}
      <PhoneDialog
        phone={editPhone}
        isNew={isNewPhone}
        onSave={savePhone}
        onClose={() => { setEditPhone(null); setIsNewPhone(false); }}
      />

      {/* Accessory Edit Dialog */}
      <AccDialog
        acc={editAcc}
        isNew={isNewAcc}
        onSave={saveAcc}
        onClose={() => { setEditAcc(null); setIsNewAcc(false); }}
      />
    </div>
  );
};

const PhoneDialog = ({ phone, isNew, onSave, onClose }: {
  phone: Phone | null; isNew: boolean; onSave: (p: Phone) => void; onClose: () => void;
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

const AccDialog = ({ acc, isNew, onSave, onClose }: {
  acc: Accessory | null; isNew: boolean; onSave: (a: Accessory) => void; onClose: () => void;
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
          <Field label="Emoji" value={form.emoji} onChange={(v) => update("emoji", v)} />
          <Field label="Price (LKR)" value={String(form.price)} onChange={(v) => update("price", Number(v))} type="number" />
          <Field label="Cost (LKR)" value={String(form.cost)} onChange={(v) => update("cost", Number(v))} type="number" />
          <Field label="Stock" value={String(form.stock)} onChange={(v) => update("stock", Number(v))} type="number" />
          <Field label="Low Stock Threshold" value={String(form.lowStockThreshold)} onChange={(v) => update("lowStockThreshold", Number(v))} type="number" />
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
