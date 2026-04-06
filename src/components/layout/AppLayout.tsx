import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShoppingCart, Package, History, LayoutDashboard, Receipt, FilePlus } from "lucide-react";

const navItems = [
  { path: "/", label: "Checkout", icon: ShoppingCart },
  { path: "/inventory", label: "Inventory", icon: Package },
  { path: "/history", label: "History", icon: History },
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/expenses", label: "Expenses", icon: Receipt },
];

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Header */}
      <header className="bg-card border-b border-border px-3 py-2 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <img src="434757956_122139159188124564_4746025914570679797_n.jpg" alt="iHacs Logo" className="h-6 w-auto object-contain" />
          <h1 className="text-sm font-bold text-foreground">iHacs POS</h1>
        </div>
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 bg-destructive text-destructive-foreground px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm"
        >
          <FilePlus className="w-4 h-4" />
          New Invoice
        </button>
      </header>

      {/* Mobile Nav - fixed 5-column grid, large touch targets, green active */}
      <nav className="lg:hidden grid grid-cols-5 border-b border-border bg-card overflow-hidden sticky top-[41px] z-40 w-full shrink-0">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-bold transition-all min-w-0 ${
                isActive
                  ? "bg-emerald-500 text-white shadow-inner"
                  : "text-muted-foreground active:bg-secondary"
              }`}
            >
              <item.icon className={`w-5 h-5 shrink-0 ${isActive ? "text-white" : ""}`} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <nav className="hidden lg:flex flex-col w-56 border-r border-border bg-card p-3 gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-emerald-500 text-white"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};

export default AppLayout;
