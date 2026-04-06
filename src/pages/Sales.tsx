import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Search, Plus, Minus, Trash2, ShoppingCart, Smartphone, Printer, Share2, FileText, Apple, Monitor, Tablet, Package, ShieldCheck, Cable, Headphones, BatteryCharging, Zap, MoreHorizontal, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CartItemPOS, SaleTransaction, Phone, Accessory } from "@/data/types";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

const formatLKR = (v: number) => `Rs. ${v.toLocaleString("en-LK")}`;

type CatalogTab = "phones" | "accessories";
type PhoneCat = "iPhone" | "Android" | "Other";

const phoneCatIcons: Record<string, React.ElementType> = { "iPhone": Apple, "Android": Monitor, "Other": Tablet };
const accCatIcons: Record<string, React.ElementType> = {
  "All": Package, "Back Covers": Smartphone, "Tempered Glasses": ShieldCheck,
  "Chargers": Zap, "Cables": Cable, "Audio": Headphones, "Power Banks": BatteryCharging, "Other": MoreHorizontal,
};
const accCategories = ["Back Covers", "Tempered Glasses", "Chargers", "Cables", "Audio", "Power Banks", "Other"];

const Sales = () => {
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItemPOS[]>(() => {
    const saved = localStorage.getItem("ihacs_cart");
    return saved ? JSON.parse(saved) : [];
  });
  const [discountVal, setDiscountVal] = useState("");
  const [discountType, setDiscountType] = useState<"flat" | "percentage">("flat");
  const [tradeInVal, setTradeInVal] = useState("");
  const [tradeInDevice, setTradeInDevice] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [showCatalog, setShowCatalog] = useState(false);
  const [catalogTab, setCatalogTab] = useState<CatalogTab>("phones");
  const [phoneCat, setPhoneCat] = useState<PhoneCat>("iPhone");
  const [accCat, setAccCat] = useState<string>("All");
  const [loading, setLoading] = useState(false);
  const [dbPhones, setDbPhones] = useState<Phone[]>([]);
  const [dbAccessories, setDbAccessories] = useState<Accessory[]>([]);

  useEffect(() => {
    localStorage.setItem("ihacs_cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      const { data: phones } = await supabase.from("phones").select("*").eq("status", "In Stock");
      const { data: acc } = await supabase.from("accessories").select("*");
      setDbPhones(phones || []);
      setDbAccessories(acc || []);
    } catch (e: any) { toast.error("Stock error: " + e.message); }
  };

  const allProducts = useMemo(() => {
    const ps = dbPhones.map(p => ({
      id: p.id, type: "phone" as const, name: `${p.brand} ${p.model}`, price: p.price,
      imei: p.imei, warranty: p.warranty, emoji: "📱",
      sub: `${p.condition} · ${p.storage}`, category: p.category, cost: p.cost || 0
    }));
    const as = dbAccessories.map(a => ({
      id: a.id, type: "accessory" as const, name: a.name, price: a.price,
      emoji: a.emoji, sub: `SKU: ${a.sku}`, category: a.category, cost: a.cost || 0
    }));
    return [...ps, ...as];
  }, [dbPhones, dbAccessories]);

  const catalogFiltered = useMemo(() => {
    let items = allProducts;
    if (catalogTab === "phones") items = items.filter(p => p.type === "phone" && p.category === phoneCat);
    else {
      items = items.filter(p => p.type === "accessory");
      if (accCat !== "All") items = items.filter(p => p.category === accCat);
    }
    if (search) items = items.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || (p.type === 'phone' && p.imei?.includes(search)));
    return items;
  }, [allProducts, catalogTab, phoneCat, accCat, search]);

  const addToCart = useCallback((product: any) => {
    setCart((prev) => {
      const exists = prev.find(i => i.id === product.id);
      if (product.type === "phone" && exists) return prev;
      if (exists) return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      const item: any = {
         id: product.id, type: product.type, name: product.name, price: product.price,
         originalPrice: product.price, quantity: 1, imei: product.imei, warranty: product.warranty, 
         emoji: product.emoji, cost: product.cost
      };
      return [...prev, item];
    });
    toast.success(`Added: ${product.name}`);
  }, []);

  const updateQty = (id: string, d: number) => setCart(p => p.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity + d) } : i));
  const updatePrice = (id: string, pr: number) => setCart(p => p.map(i => i.id === id ? { ...i, price: pr } : i));
  const removeItem = (id: string) => setCart(p => p.filter(i => i.id !== id));

  const subtotal = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
  const discountAmount = discountType === "flat" ? (Number(discountVal) || 0) : subtotal * (Number(discountVal) || 0) / 100;
  const tradeIn = Number(tradeInVal) || 0;
  const total = Math.max(0, subtotal - discountAmount - tradeIn);

  const completeSale = async () => {
    if (!paymentMethod) return;
    setLoading(true);
    try {
      const itemsBlob = JSON.stringify(cart);
      const saleObj: any = {
        customer_name: customerName, customer_phone: customerPhone,
        subtotal, discount: Number(discountVal) || 0, discount_type: discountType,
        trade_in_value: tradeIn, trade_in_device: tradeInDevice,
        total, total_cost: cart.reduce((s, i) => s + (i.cost * i.quantity), 0),
        payment_method: paymentMethod, items: itemsBlob, payment_status: 'Paid'
      };
      
      let finalId = `SALE-${Date.now()}`;
      let finalDate = new Date().toISOString();
      const { data: s, error } = await supabase.from("sales").insert([saleObj]).select().single();
      if (s) { finalId = s.id; finalDate = s.date; }

      for (const item of cart) {
        if (item.type === "phone") await supabase.from("phones").update({ status: "Sold" }).eq("id", item.id);
        else {
           const { data: acc } = await supabase.from("accessories").select("stock").eq("id", item.id).single();
           if (acc) await supabase.from("accessories").update({ stock: acc.stock - item.quantity }).eq("id", item.id);
        }
      }

      setReceiptData({ id: finalId, date: finalDate, customerName, customerPhone, items: [...cart], subtotal, total, paymentMethod });
      setCheckoutOpen(false);
      toast.success("Sale Recorded Successfully");
      fetchProducts();
    } catch (e: any) { toast.error("Checkout Fail: " + e.message); }
    finally { setLoading(false); }
  };

  const resetSale = () => {
    setCart([]); setDiscountVal(""); setTradeInVal(""); setTradeInDevice("");
    setCustomerName(""); setCustomerPhone(""); setReceiptData(null);
    setPaymentMethod(null); setShowCatalog(false);
  };

  const handleWhatsApp = () => {
    if (!receiptData) return;
    const lines = [`🧾 *iHacs Receipt*`, `Ref: ${receiptData.id}`, `Date: ${new Date(receiptData.date).toLocaleString("en-LK")}`, ``, ...receiptData.items.map((i: any) => `${i.name} x${i.quantity} - ${formatLKR(i.price * i.quantity)}`), ``, `*Total: ${formatLKR(receiptData.total)}*`].join("\n");
    const phone = customerPhone ? customerPhone.replace(/^0/, "94") : "";
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(lines)}`, "_blank");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] bg-slate-50 relative overflow-hidden font-inter">
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-slate-50 relative">
        
        {/* FIXED TOP: Search & Header */}
        <div className="bg-white border-b border-slate-200/60 p-4 pb-5 space-y-4 shrink-0 shadow-sm z-30">
          <div className="flex items-center justify-center gap-3">
             <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-2 shrink-0"><img src="434757956_122139159188124564_4746025914570679797_n.jpg" alt="Logo" className="w-full h-full object-contain" /></div>
             <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">Invoice Generator</h2>
          </div>
          
          <div className="relative group mx-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within:text-[#f36c21] transition-colors" />
            <input placeholder="Search or scan imei..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:border-[#f36c21] transition-all shadow-sm" />
          </div>

          <button onClick={() => setShowCatalog(true)} className="w-full h-16 bg-slate-900 text-white rounded-[1.8rem] font-black text-sm uppercase tracking-[0.2em] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-2xl shadow-slate-300 ring-4 ring-slate-900/5">
             <Plus className="w-6 h-6 stroke-[4]" /> ADD ITEMS
          </button>
        </div>

        {/* COMPACT CENTER: Cart Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50/30">
           {cart.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full opacity-20 py-20">
               <ShoppingCart className="w-12 h-12 text-slate-900 mb-2" />
               <p className="font-black text-slate-900 tracking-widest text-[9px]">EMPTY CART</p>
             </div>
           ) : (
             cart.map((item) => (
               <div key={item.id} className="bg-white border border-slate-100 rounded-[1.5rem] px-3 py-2.5 shadow-sm flex flex-col gap-2.5 animate-in fade-in slide-in-from-bottom-2">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-base shrink-0">{item.emoji}</div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-black text-slate-900 truncate pr-2 leading-none" style={{ fontFamily: 'Outfit, sans-serif' }}>{item.name}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter truncate opacity-70 mt-1">{item.imei ? `IMEI: ${item.imei}` : 'Accessory'}</p>
                      </div>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="p-2 text-rose-500 bg-rose-50 border border-rose-100 rounded-lg active:scale-90 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                 </div>
                 <div className="flex items-center justify-between bg-slate-50 rounded-xl p-2">
                    <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm">
                       <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 flex items-center justify-center text-slate-400 font-bold text-xs ring-1 ring-slate-100 rounded">ー</button>
                       <span className="text-[10px] font-black min-w-[12px] text-center text-slate-900">{item.quantity}</span>
                       <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 flex items-center justify-center text-slate-400 font-bold text-xs ring-1 ring-slate-100 rounded">＋</button>
                    </div>
                    <div className="flex items-center gap-1 text-right">
                       <p className="text-[7px] font-black text-slate-400 uppercase leading-none mt-1">Price</p>
                       <input type="number" value={item.price} onChange={(e) => updatePrice(item.id, Number(e.target.value))} className="w-20 text-right text-sm font-black bg-transparent border-none p-0 focus:ring-0 text-[#f36c21]" />
                       <span className="text-[8px] font-black text-slate-300">LKR</span>
                    </div>
                 </div>
               </div>
             ))
           )}
        </div>

        {/* ULTRA-COMPACT BOTTOM SUMMARY */}
        {cart.length > 0 && (
          <div className="bg-white border-t border-slate-200 p-4 space-y-3 shrink-0 shadow-[0_-20px_40px_rgba(0,0,0,0.05)] rounded-t-[2.5rem] z-30">
             <div className="grid grid-cols-2 gap-2">
                <input placeholder="Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full text-xs font-black bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 transition-all" />
                <input placeholder="Phone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="w-full text-xs font-black bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 transition-all" />
             </div>

             <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50/50 rounded-2xl border border-slate-100">
                <div className="space-y-2">
                   <div className="flex items-center gap-1.5 text-[8px] font-black text-slate-400 uppercase"><FileText className="w-3 h-3" /> Exchange</div>
                   <input placeholder="Device" value={tradeInDevice} onChange={(e) => setTradeInDevice(e.target.value)} className="w-full text-[10px] font-black bg-white border border-slate-200 rounded-lg px-3 py-2 placeholder:text-slate-300" />
                   <input type="number" placeholder="LKR" value={tradeInVal} onChange={(e) => setTradeInVal(e.target.value)} className="w-full text-[10px] font-black bg-white border border-slate-200 rounded-lg px-3 py-2 placeholder:text-slate-300" />
                </div>
                <div className="space-y-2">
                   <div className="flex items-center justify-between text-[8px] font-black text-slate-400 uppercase">
                      <div className="flex items-center gap-1.5"><Zap className="w-3 h-3 text-orange-400" /> Discount</div>
                      <button onClick={() => setDiscountType(discountType === 'flat' ? 'percentage' : 'flat')} className="px-1.5 py-0.5 bg-slate-900 text-white rounded text-[7px]">{discountType === 'flat' ? 'LKR' : '%'}</button>
                   </div>
                   <input type="number" placeholder="Val" value={discountVal} onChange={(e) => setDiscountVal(e.target.value)} className="w-full text-[10px] font-black bg-white border border-slate-200 rounded-lg px-3 py-2 placeholder:text-slate-300" />
                   <div className="h-[28px] border border-dashed border-slate-200 rounded-lg flex items-center justify-center opacity-40"><p className="text-[7px] font-black uppercase">Auto applied</p></div>
                </div>
             </div>
             
             <div className="flex items-center justify-between pb-1 pt-1">
                <div className="flex-1">
                   <p className="text-[8px] font-black text-slate-400 uppercase leading-none mb-0.5">Grand Total</p>
                   <p className="text-2xl font-black text-slate-900 tracking-tighter leading-tight">{formatLKR(total)}</p>
                </div>
                <button onClick={() => setCheckoutOpen(true)} className="px-8 h-14 bg-[#f36c21] text-white rounded-2xl font-black text-lg shadow-xl shadow-orange-100 active:scale-95 transition-all flex items-center gap-2 uppercase tracking-widest">PAY</button>
             </div>
          </div>
        )}
      </div>

      {/* DIALOGS REMAIN BUILT-IN: CATALOG, CHECKOUT, RECEIPT */}
      <Dialog open={showCatalog} onOpenChange={setShowCatalog}>
        <DialogContent className="sm:max-w-lg h-[85vh] flex flex-col p-0 rounded-[2.5rem]">
           <div className="p-5 pb-2 space-y-4">
              <div className="px-1">
                 <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl w-full border border-slate-200/50">
                    <button onClick={() => setCatalogTab("phones")} className={`flex-1 h-12 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${catalogTab === "phones" ? "bg-white text-slate-900 shadow-lg shadow-slate-200" : "text-slate-400"}`}>Phones</button>
                    <button onClick={() => setCatalogTab("accessories")} className={`flex-1 h-12 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${catalogTab === "accessories" ? "bg-white text-slate-900 shadow-lg shadow-slate-200" : "text-slate-400"}`}>Accessories</button>
                 </div>
              </div>
              <div className="px-1">
                 {catalogTab === "phones" ? (
                   <div className="grid grid-cols-3 gap-2 pb-2">
                      {(["iPhone", "Android", "Other"] as PhoneCat[]).map((cat) => {
                         const Icon = phoneCatIcons[cat] || Smartphone;
                         return (
                           <button key={cat} onClick={() => setPhoneCat(cat)} className={`flex flex-col items-center justify-center gap-1.5 h-20 rounded-2xl border-2 transition-all active:scale-95 ${phoneCat === cat ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-white border-slate-50 text-slate-400'}`}>
                              <Icon className="w-5 h-5" />
                              <span className="text-[9px] font-black uppercase">{cat}</span>
                           </button>
                         );
                      })}
                   </div>
                 ) : (
                   <div className="grid grid-cols-4 gap-2 max-h-[140px] overflow-y-auto pr-1 pb-2">
                      {["All", ...accCategories].map((cat) => {
                         const Icon = accCatIcons[cat] || Package;
                         return (
                           <button key={cat} onClick={() => setAccCat(cat)} className={`flex flex-col items-center justify-center gap-1.5 h-16 rounded-2xl border transition-all active:scale-95 ${accCat === cat ? 'bg-[#f36c21] border-[#f36c21] text-white shadow-lg shadow-orange-100' : 'bg-white border-slate-100 text-slate-400'}`}>
                              <Icon className="w-4 h-4" />
                              <span className="text-[8px] font-black uppercase text-center leading-none px-1">{cat.split(' ')[0]}</span>
                           </button>
                         );
                      })}
                   </div>
                 )}
              </div>
           </div>
           <div className="flex-1 overflow-y-auto p-5 space-y-2 bg-slate-50/50 border-t border-slate-100 rounded-t-[2.5rem]">
              {catalogFiltered.map(p => (
                <button key={p.id} onClick={() => { addToCart(p); }} className="w-full flex items-center gap-3 p-3.5 bg-white border border-slate-100 rounded-2xl hover:border-[#f36c21] transition-all text-left group">
                   <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-xl group-hover:bg-orange-50 transition-all">{p.emoji}</div>
                   <div className="flex-1 min-w-0"><p className="text-sm font-black text-slate-900 truncate" style={{ fontFamily: 'Outfit, sans-serif' }}>{p.name}</p><p className="text-[9px] font-bold text-slate-400 truncate mt-0.5">{p.sub}</p></div>
                   <p className="text-sm font-black text-slate-900">{formatLKR(p.price)}</p>
                </button>
              ))}
           </div>
        </DialogContent>
      </Dialog>

      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] p-6 text-center">
            <h2 className="text-xl font-black mb-1">Confirm Total</h2>
            <p className="text-3xl font-black text-[#f36c21] mb-6">{formatLKR(total)}</p>
            <div className="grid grid-cols-3 gap-3 mb-6">
               {["Cash", "Card", "Mobile"].map(m => (
                 <button key={m} onClick={() => setPaymentMethod(m)} className={`h-20 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all ${paymentMethod === m ? 'border-[#f36c21] bg-orange-50 shadow-md' : 'border-slate-100'}`}>
                    <span className="text-xl">{m === 'Cash' ? '💵' : m === 'Card' ? '💳' : '📱'}</span>
                    <span className="text-[9px] font-black uppercase">{m}</span>
                 </button>
               ))}
            </div>
            <Button onClick={completeSale} disabled={!paymentMethod || loading} className="w-full h-14 bg-slate-900 rounded-xl text-white font-black text-base shadow-xl">{loading ? <Loader2 className="animate-spin" /> : 'Confirm Order'}</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={!!receiptData} onOpenChange={() => resetSale()}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto bg-white border-none rounded-[2rem] p-6 shadow-2xl">
          {receiptData && (
            <div className="space-y-5">
              <div className="text-center pb-5 border-b border-dashed border-slate-200">
                <img src="434757956_122139159188124564_4746025914570679797_n.jpg" alt="Logo" className="h-12 w-12 mx-auto mb-3" />
                <h2 className="text-xl font-black">iHacs Solutions</h2>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Invoice Receipt</p>
              </div>
              <div className="space-y-3">
                {receiptData.items.map((i: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-start gap-4">
                    <div className="flex-1"><p className="text-sm font-black text-slate-900 leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>{i.name} x{i.quantity}</p></div>
                    <p className="text-sm font-black text-slate-900">{formatLKR(i.price * i.quantity)}</p>
                  </div>
                ))}
              </div>
              <div className="pt-5 border-t border-dashed border-slate-200 space-y-2 font-black text-slate-900">
                 <div className="flex justify-between items-end">
                    <p className="text-[9px] uppercase tracking-widest leading-none">Total Amount</p>
                    <p className="text-2xl leading-none">{formatLKR(receiptData.total)}</p>
                 </div>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2">
                <Button onClick={() => window.print()} variant="outline" className="h-12 rounded-xl flex-col gap-1 text-[7px] font-black uppercase"><Printer className="w-3.5 h-3.5" /> Print</Button>
                <Button onClick={handleWhatsApp} variant="outline" className="h-12 rounded-xl flex-col gap-1 text-[7px] font-black uppercase"><Share2 className="w-3.5 h-3.5 text-emerald-500" /> Share</Button>
                <Button onClick={resetSale} className="h-12 rounded-xl flex-col gap-1 text-[7px] font-black uppercase bg-slate-900 text-white"><FileText className="w-3.5 h-3.5" /> New</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Sales;
