import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Search, Plus, Minus, Trash2, ShoppingCart, Tag, Smartphone, Printer, Share2, FileText, Apple, Monitor, Tablet, Package, ShieldCheck, Cable, Headphones, BatteryCharging, Zap, MoreHorizontal, Loader2 } from "lucide-react";
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
  const [cart, setCart] = useState<CartItemPOS[]>([]);
  const [discountVal, setDiscountVal] = useState("");
  const [discountType, setDiscountType] = useState<"flat" | "percentage">("flat");
  const [tradeInVal, setTradeInVal] = useState("");
  const [tradeInDevice, setTradeInDevice] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<SaleTransaction | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [showCatalog, setShowCatalog] = useState(false);
  const [catalogTab, setCatalogTab] = useState<CatalogTab>("phones");
  const [phoneCat, setPhoneCat] = useState<PhoneCat>("iPhone");
  const [accCat, setAccCat] = useState<string>("All");
  const receiptRef = useRef<HTMLDivElement>(null);

  const [dbPhones, setDbPhones] = useState<Phone[]>([]);
  const [dbAccessories, setDbAccessories] = useState<Accessory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data: phones, error: phoneError } = await supabase.from("phones").select("*").eq("status", "In Stock");
      const { data: acc, error: accError } = await supabase.from("accessories").select("*");

      if (phoneError) throw phoneError;
      if (accError) throw accError;

      setDbPhones(phones || []);
      setDbAccessories(acc || []);
    } catch (error: any) {
      toast.error("Failed to load products: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const allProducts = useMemo(() => {
    const phoneItems = dbPhones.map((p) => ({
      id: p.id, type: "phone" as const, name: `${p.brand} ${p.model}`, price: p.price,
      imei: p.imei, warranty: p.warranty, emoji: "📱",
      sub: `${p.condition} · ${p.storage} · ${p.color}`,
      category: p.category,
      cost: p.cost || 0
    }));
    const accItems = dbAccessories.map((a) => ({
      id: a.id, type: "accessory" as const, name: a.name, price: a.price,
      emoji: a.emoji, sub: `SKU: ${a.sku} · Stock: ${a.stock}`,
      category: a.category,
      cost: a.cost || 0
    }));
    return [...phoneItems, ...accItems];
  }, [dbPhones, dbAccessories]);

  const catalogFiltered = useMemo(() => {
    let items = allProducts;
    if (catalogTab === "phones") {
      items = items.filter((p) => p.type === "phone" && p.category === phoneCat);
    } else {
      items = items.filter((p) => p.type === "accessory");
      if (accCat !== "All") items = items.filter((p) => p.category === accCat);
    }
    if (search) items = items.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
    return items;
  }, [allProducts, catalogTab, phoneCat, accCat, search]);

  const addToCart = useCallback((product: any) => {
    setCart((prev) => {
      if (product.type === "phone") {
        if (prev.find((i) => i.id === product.id)) return prev;
        return [...prev, { id: product.id, type: "phone", name: product.name, price: product.price, originalPrice: product.price, quantity: 1, imei: product.imei, warranty: product.warranty, emoji: product.emoji, cost: product.cost }];
      }
      const existing = prev.find((i) => i.id === product.id);
      if (existing) return prev.map((i) => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { id: product.id, type: "accessory", name: product.name, price: product.price, originalPrice: product.price, quantity: 1, emoji: product.emoji, cost: product.cost }];
    });
    toast.success(`Added ${product.name}`);
  }, []);

  const updateQty = useCallback((id: string, delta: number) => {
    setCart((prev) => prev.map((i) => i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i));
  }, []);

  const updatePrice = useCallback((id: string, newPrice: number) => {
    setCart((prev) => prev.map((i) => i.id === id ? { ...i, price: newPrice } : i));
  }, []);

  const removeItem = useCallback((id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const discountAmount = discountType === "flat" ? (Number(discountVal) || 0) : subtotal * (Number(discountVal) || 0) / 100;
  const tradeIn = Number(tradeInVal) || 0;
  const total = Math.max(0, subtotal - discountAmount - tradeIn);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setCheckoutOpen(true);
  };

  const completeSale = async () => {
    if (!paymentMethod) return;
    setLoading(true);

    try {
      // 1. Record the Sale
      const totalCost = cart.reduce((sum, i) => sum + (i.cost * i.quantity), 0);
      const { data: sale, error: saleError } = await supabase.from("sales").insert([{
        customer_name: customerName,
        customer_phone: customerPhone,
        subtotal,
        discount: Number(discountVal) || 0,
        discount_type: discountType,
        trade_in_value: tradeIn,
        trade_in_device: tradeInDevice,
        total,
        total_cost: totalCost,
        payment_method: paymentMethod
      }]).select().single();

      if (saleError) throw saleError;

      // 2. Update Inventory (Phones -> Sold, Accessories -> Stock Decrease)
      for (const item of cart) {
        if (item.type === "phone") {
          await supabase.from("phones").update({ status: "Sold" }).eq("id", item.id);
        } else {
          const acc = dbAccessories.find(a => a.id === item.id);
          if (acc) {
            await supabase.from("accessories").update({ stock: acc.stock - item.quantity }).eq("id", item.id);
          }
        }
      }

      const saleTransaction: SaleTransaction = {
        id: sale.id, date: sale.date, items: cart,
        subtotal, discount: Number(discountVal) || 0, discountType,
        tradeInValue: tradeIn, tradeInDevice: tradeInDevice || undefined,
        total, paymentMethod, customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
      };

      setReceiptData(saleTransaction);
      setCheckoutOpen(false);
      toast.success(`Sale completed - ${formatLKR(total)}`);
      fetchProducts(); // Refresh local list
    } catch (error: any) {
      toast.error("Error completing sale: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetSale = () => {
    setCart([]);
    setDiscountVal("");
    setTradeInVal("");
    setTradeInDevice("");
    setCustomerName("");
    setCustomerPhone("");
    setReceiptData(null);
    setPaymentMethod(null);
    setShowCatalog(false);
  };

  const handlePrint = () => window.print();

  const quickItems = useMemo(() => {
    return dbAccessories.slice(0, 8); // Showing first 8 accessories as quick add
  }, [dbAccessories]);

  const handleWhatsApp = () => {
    if (!receiptData) return;
    const lines = [
      `🧾 *iHacs Receipt*`,
      `Date: ${new Date(receiptData.date).toLocaleString("en-LK")}`,
      ``,
      ...receiptData.items.map((i) => `${i.emoji} ${i.name} x${i.quantity} - ${formatLKR(i.price * i.quantity)}${i.imei ? ` (IMEI: ${i.imei})` : ""}`),
      ``,
      `Subtotal: ${formatLKR(receiptData.subtotal)}`,
      receiptData.discount > 0 ? `Discount: -${formatLKR(discountAmount)}` : "",
      receiptData.tradeInValue > 0 ? `Trade-in: -${formatLKR(receiptData.tradeInValue)}` : "",
      `*Total: ${formatLKR(receiptData.total)}*`,
      `Payment: ${receiptData.paymentMethod}`,
    ].filter(Boolean).join("\n");
    const phone = receiptData.customerPhone ? receiptData.customerPhone.replace(/^0/, "94") : "";
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(lines)}`, "_blank");
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-105px)] lg:h-[calc(100vh-57px)]">
      {/* Left - Invoice / Cart */}
      <div className="flex-1 flex flex-col p-3 md:p-4 gap-3 overflow-y-auto min-h-0">
        {/* Header - no New Invoice button here */}
        <div>
          <h2 className="text-xl font-bold text-foreground">Checkout</h2>
          <p className="text-xs text-muted-foreground">Create a new sale</p>
        </div>

        {/* Customer Info */}
        <div className="bg-card border border-border rounded-xl p-3 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">👤 Customer Details</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input placeholder="Customer name" value={customerName} onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30" />
            <input placeholder="Phone (07xxxxxxxx)" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30" />
          </div>
        </div>

        {/* Add Items Button */}
        <Button variant="outline" onClick={() => setShowCatalog(true)} className="w-full gap-2 border-dashed border-2">
          <Plus className="w-4 h-4" /> Add Items to Invoice
        </Button>

        {/* Cart Items */}
        <div className="flex-1 space-y-2 min-h-0">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
              <ShoppingCart className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">No items added yet</p>
              <p className="text-xs mt-1">Tap "Add Items" to select products</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="bg-card border border-border rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{item.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                    {item.imei && <p className="text-[10px] text-muted-foreground">IMEI: {item.imei}</p>}
                    {item.warranty && <p className="text-[10px] text-primary">Warranty: {item.warranty}</p>}
                  </div>
                  <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {item.type === "accessory" && (
                      <>
                        <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                        <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center"><Plus className="w-3 h-3" /></button>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">Rs.</span>
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) => updatePrice(item.id, Number(e.target.value))}
                      className="w-24 text-right text-sm font-bold bg-background border border-border rounded-lg px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Exchange / Discount / Totals */}
        {cart.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-3 space-y-3">
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">📱 Exchange / Trade-in</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input placeholder="Exchange device (e.g. iPhone 11)" value={tradeInDevice} onChange={(e) => setTradeInDevice(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30" />
                <div className="flex items-center gap-1 bg-background border border-border rounded-lg px-3 py-2">
                  <Smartphone className="w-4 h-4 text-muted-foreground" />
                  <input type="number" placeholder="Deduction (LKR)" value={tradeInVal} onChange={(e) => setTradeInVal(e.target.value)}
                    className="flex-1 text-sm bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none" />
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">🏷️ Discount</p>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-background border border-border rounded-lg px-3 py-2 flex-1">
                  <Tag className="w-4 h-4 text-muted-foreground" />
                  <input type="number" placeholder="Discount" value={discountVal} onChange={(e) => setDiscountVal(e.target.value)}
                    className="flex-1 text-sm bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none" />
                </div>
                <button onClick={() => setDiscountType(discountType === "flat" ? "percentage" : "flat")}
                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    discountType === "percentage" ? "bg-primary/10 border-primary/30 text-primary" : "bg-background border-border text-muted-foreground"
                  }`}>
                  {discountType === "flat" ? "LKR" : "%"}
                </button>
              </div>
            </div>
            <div className="space-y-1 text-sm border-t border-border pt-3">
              <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{formatLKR(subtotal)}</span></div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-accent"><span>Discount ({discountType === "flat" ? "Flat" : `${discountVal}%`})</span><span>-{formatLKR(discountAmount)}</span></div>
              )}
              {tradeIn > 0 && (
                <div className="flex justify-between text-primary"><span>Exchange ({tradeInDevice || "Trade-in"})</span><span>-{formatLKR(tradeIn)}</span></div>
              )}
              <div className="flex justify-between text-foreground font-bold text-lg pt-1 border-t border-border"><span>Total</span><span>{formatLKR(total)}</span></div>
            </div>
            <Button onClick={handleCheckout} className="w-full h-12 text-base font-semibold">Charge {formatLKR(total)}</Button>
          </div>
        )}
      </div>

      {/* Right - Quick Add (desktop only) */}
      <div className="hidden lg:flex w-72 border-l border-border bg-card flex-col p-3 gap-2 overflow-y-auto">
        <p className="text-xs font-semibold text-muted-foreground mb-1">⚡ Quick Add</p>
        {quickItems.map((a) => (
          <button key={a.id} onClick={() => addToCart({ id: a.id, type: "accessory", name: a.name, price: a.price, emoji: a.emoji, sub: "", category: a.category })}
            className="flex items-center gap-2 px-3 py-2.5 bg-background border border-border rounded-lg text-sm hover:border-primary/50 hover:bg-primary/5 transition-colors">
            <span>{a.emoji}</span>
            <span className="flex-1 text-left text-foreground font-medium truncate">{a.name.split(" - ")[0]}</span>
            <span className="text-xs text-muted-foreground">{formatLKR(a.price)}</span>
          </button>
        ))}
      </div>

      {/* Product Catalog Dialog - with categories like inventory */}
      <Dialog open={showCatalog} onOpenChange={setShowCatalog}>
        <DialogContent className="sm:max-w-lg h-[640px] max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>Select Items</DialogTitle>
          </DialogHeader>

          {/* Catalog Tabs: Phones / Accessories */}
          <div className="grid grid-cols-2 gap-2 px-4 pt-3">
            <button onClick={() => setCatalogTab("phones")}
              className={`flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-semibold transition-all border-2 ${
                catalogTab === "phones" ? "bg-primary text-primary-foreground border-primary shadow-md" : "bg-card border-border text-muted-foreground hover:border-primary/20"
              }`}>
              <Smartphone className="w-4 h-4" /> Phones
            </button>
            <button onClick={() => setCatalogTab("accessories")}
              className={`flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-semibold transition-all border-2 ${
                catalogTab === "accessories" ? "bg-primary text-primary-foreground border-primary shadow-md" : "bg-card border-border text-muted-foreground hover:border-primary/20"
              }`}>
              <Package className="w-4 h-4" /> Accessories
            </button>
          </div>

          {/* Sub-category buttons */}
          <div className="px-4 pt-4">
            {catalogTab === "phones" ? (
              <div className="grid grid-cols-3 gap-2">
                {(["iPhone", "Android", "Other"] as PhoneCat[]).map((cat) => {
                  const Icon = phoneCatIcons[cat];
                  return (
                    <button key={cat} onClick={() => setPhoneCat(cat)}
                      className={`flex flex-col items-center justify-center gap-2 h-20 w-full rounded-xl text-sm font-bold transition-all border-2 ${
                        phoneCat === cat ? "bg-emerald-500 text-white border-emerald-400 shadow-md" : "bg-card border-border text-muted-foreground hover:border-emerald-200"
                      }`}>
                      <Icon className="w-6 h-6" />{cat}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {["All", ...accCategories].map((cat) => {
                  const Icon = accCatIcons[cat] || Package;
                  return (
                    <button key={cat} onClick={() => setAccCat(cat)}
                      className={`flex flex-col items-center justify-center gap-1 h-16 w-full rounded-xl text-[10px] font-bold leading-tight transition-all border-2 ${
                        accCat === cat ? "bg-emerald-500 text-white border-emerald-400 shadow-md" : "bg-card border-border text-muted-foreground hover:border-emerald-200"
                      }`}>
                      <Icon className="w-5 h-5 mb-0.5" />{cat === "Tempered Glasses" ? "T.Glass" : cat === "Back Covers" ? "Covers" : cat === "Power Banks" ? "P.Bank" : cat}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Search */}
          <div className="relative px-4 pt-2">
            <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground mt-1" />
            <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>

          {/* Product list */}
          <div className="flex-1 overflow-y-auto space-y-1.5 px-4 py-2 pb-4">
            {catalogFiltered.map((p) => (
              <button key={p.id} onClick={() => { addToCart(p); }}
                className="w-full flex items-center gap-3 p-3 bg-background border border-border rounded-lg hover:border-primary/40 hover:shadow-sm transition-all text-left">
                <span className="text-xl">{p.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{p.sub}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">{formatLKR(p.price)}</p>
                  {p.type === "phone" && <span className="text-[10px] text-primary font-medium">PHONE</span>}
                </div>
              </button>
            ))}
            {catalogFiltered.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">No products found</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Charge <span className="text-primary">{formatLKR(total)}</span></DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground text-center">Select payment method</p>
            <div className="grid grid-cols-3 gap-3">
              {["Cash", "Card", "Mobile Pay"].map((m) => (
                <button key={m} onClick={() => setPaymentMethod(m)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === m ? "border-primary bg-primary/5 shadow-md" : "border-border hover:border-primary/30"
                  }`}>
                  <span className="text-2xl">{m === "Cash" ? "💵" : m === "Card" ? "💳" : "📲"}</span>
                  <span className="text-sm font-medium">{m}</span>
                </button>
              ))}
            </div>
            <Button onClick={completeSale} disabled={!paymentMethod} className="w-full h-12 text-base font-semibold">Confirm Payment</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={!!receiptData} onOpenChange={() => resetSale()}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center">🧾 Receipt</DialogTitle>
          </DialogHeader>
          {receiptData && (
            <div ref={receiptRef} className="space-y-4">
              <div className="text-center border-b border-dashed border-border pb-3">
                <p className="text-lg font-bold text-foreground">📱 iHacs</p>
                <p className="text-xs text-muted-foreground">Mobile Shop & Accessories</p>
                <p className="text-xs text-muted-foreground mt-1">{new Date(receiptData.date).toLocaleString("en-LK")}</p>
              </div>
              {receiptData.customerName && (
                <div className="text-xs text-muted-foreground">
                  <span>Customer: {receiptData.customerName}</span>
                  {receiptData.customerPhone && <span> · {receiptData.customerPhone}</span>}
                </div>
              )}
              <div className="space-y-2">
                {receiptData.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <div>
                      <p className="text-foreground">{item.emoji} {item.name} ×{item.quantity}</p>
                      {item.imei && <p className="text-[10px] text-muted-foreground">IMEI: {item.imei}</p>}
                    </div>
                    <span className="font-medium text-foreground">{formatLKR(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-dashed border-border pt-3 space-y-1 text-sm">
                <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{formatLKR(receiptData.subtotal)}</span></div>
                {receiptData.discount > 0 && (
                  <div className="flex justify-between text-accent"><span>Discount</span><span>-{formatLKR(discountAmount)}</span></div>
                )}
                {receiptData.tradeInValue > 0 && (
                  <div className="flex justify-between text-primary"><span>Trade-in ({receiptData.tradeInDevice})</span><span>-{formatLKR(receiptData.tradeInValue)}</span></div>
                )}
                <div className="flex justify-between font-bold text-lg text-foreground pt-1"><span>Total</span><span>{formatLKR(receiptData.total)}</span></div>
                <p className="text-xs text-muted-foreground text-center pt-1">Paid via {receiptData.paymentMethod}</p>
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={handlePrint} variant="outline" className="flex-1 gap-1.5 text-xs"><Printer className="w-4 h-4" /> Print</Button>
                <Button onClick={handleWhatsApp} variant="outline" className="flex-1 gap-1.5 text-xs"><Share2 className="w-4 h-4" /> WhatsApp</Button>
                <Button onClick={resetSale} className="flex-1 gap-1.5 text-xs"><FileText className="w-4 h-4" /> New Sale</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Sales;
