import { useState, useCallback } from "react";
import { Search, Menu } from "lucide-react";
import CategoryBar from "@/components/pos/CategoryBar";
import ProductGrid from "@/components/pos/ProductGrid";
import Cart, { CartItem } from "@/components/pos/Cart";
import CheckoutDialog from "@/components/pos/CheckoutDialog";
import { products, Product } from "@/data/products";
import { toast } from "sonner";

const Index = () => {
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const filtered = products.filter((p) => {
    const matchCat = category === "All" || p.category === category;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    toast.success(`Added ${product.name}`);
  }, []);

  const updateQty = useCallback((id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal + subtotal * 0.08;
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckoutComplete = useCallback((method: string) => {
    toast.success(`Payment of $${total.toFixed(2)} received via ${method}`);
    setCart([]);
    setCheckoutOpen(false);
    setCartOpen(false);
  }, [total]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📱</span>
          <h1 className="text-lg font-bold text-foreground">Mobile Shop POS</h1>
        </div>
        <button
          onClick={() => setCartOpen(!cartOpen)}
          className="lg:hidden relative p-2 rounded-lg bg-secondary"
        >
          <Menu className="w-5 h-5" />
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {itemCount}
            </span>
          )}
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Products Section */}
        <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>

          <CategoryBar selected={category} onSelect={setCategory} />
          <ProductGrid products={filtered} onAdd={addToCart} />
        </div>

        {/* Cart - Desktop always visible, Mobile overlay */}
        <div
          className={`w-80 border-l border-border flex-shrink-0 hidden lg:flex flex-col`}
        >
          <Cart
            items={cart}
            onUpdateQty={updateQty}
            onRemove={removeItem}
            onCheckout={() => setCheckoutOpen(true)}
            onClear={clearCart}
          />
        </div>

        {/* Mobile cart overlay */}
        {cartOpen && (
          <div className="lg:hidden fixed inset-0 z-40 flex">
            <div className="absolute inset-0 bg-foreground/30" onClick={() => setCartOpen(false)} />
            <div className="ml-auto w-80 max-w-[85vw] relative z-50 h-full">
              <Cart
                items={cart}
                onUpdateQty={updateQty}
                onRemove={removeItem}
                onCheckout={() => setCheckoutOpen(true)}
                onClear={clearCart}
              />
            </div>
          </div>
        )}
      </div>

      <CheckoutDialog
        open={checkoutOpen}
        total={total}
        onClose={() => setCheckoutOpen(false)}
        onComplete={handleCheckoutComplete}
      />
    </div>
  );
};

export default Index;
