import { Link, useLocation } from "react-router-dom";
import { ShoppingCart, Package, History, LayoutDashboard, Receipt, Users } from "lucide-react";

const navItems = [
  { path: "/", label: "Checkout", icon: ShoppingCart },
  { path: "/inventory", label: "Inventory", icon: Package },
  { path: "/history", label: "History", icon: History },
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/expenses", label: "Expenses", icon: Receipt },
  { path: "/sellers", label: "Sellers", icon: Users },
];

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-orange-100">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-1.5 shadow-sm">
            <img src="434757956_122139159188124564_4746025914570679797_n.jpg" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-base font-black text-slate-900 leading-tight tracking-tight">iHacs</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#f36c21]">Solutions</p>
          </div>
        </div>
        <span className="text-[9px] font-black text-emerald-500 flex items-center gap-1 uppercase tracking-wider">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Terminal v2
        </span>
      </header>

      {/* Layout row: sidebar + content */}
      <div className="flex flex-1 min-h-0">
        {/* Desktop Sidebar */}
        <nav className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 p-4 gap-1 print:hidden shrink-0">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-row items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 relative ${
                  isActive ? "text-[#f36c21] bg-orange-50/80 shadow-sm" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : "stroke-[2.2]"}`} />
                <span className="text-[13px] font-black tracking-tight">{item.label}</span>
                {isActive && <div className="absolute right-0 w-1.5 h-1/2 bg-[#f36c21] rounded-full" />}
              </Link>
            );
          })}
        </nav>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-[#f8fafc] scroll-smooth pb-20 lg:pb-0 print:bg-white">
          {children}
        </main>
      </div>

      {/* ===== MOBILE BOTTOM NAV ===== */}
      {/* Rendered at root level — NEVER inside overflow:hidden or transformed parents */}
      <div
        className="lg:hidden print:hidden"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 99999,
          background: "rgba(255,255,255,0.97)",
          borderTop: "1px solid #e2e8f0",
          boxShadow: "0 -4px 20px rgba(0,0,0,0.10)",
          display: "flex",
          overflowX: "auto",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "3px",
                padding: "10px 12px",
                minWidth: "64px",
                flexShrink: 0,
                position: "relative",
                color: isActive ? "#f36c21" : "#94a3b8",
                textDecoration: "none",
                transition: "color 0.2s",
              }}
            >
              {isActive && (
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 32,
                  height: 3,
                  background: "#f36c21",
                  borderRadius: 99,
                }} />
              )}
              <Icon
                style={{
                  width: 22,
                  height: 22,
                  strokeWidth: isActive ? 2.5 : 2,
                }}
              />
              <span style={{
                fontSize: 9,
                fontWeight: 900,
                letterSpacing: "0.05em",
                lineHeight: 1,
              }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default AppLayout;
