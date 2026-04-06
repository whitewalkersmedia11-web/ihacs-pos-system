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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-orange-100">
      {/* Top Header - Branded iHacs Black/Orange */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-1.5 shadow-sm">
             <img src="434757956_122139159188124564_4746025914570679797_n.jpg" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-base font-black text-slate-900 leading-tight tracking-tight">iHacs</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#f36c21]">Solutions</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-end mr-1">
             <span className="text-[9px] font-black text-emerald-500 flex items-center gap-1 uppercase tracking-wider"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Terminal v2</span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col-reverse lg:flex-row overflow-hidden relative">
        {/* Navigation - Bottom on Mobile, Side on Desktop */}
        <nav className="fixed bottom-0 lg:static w-full lg:w-64 bg-white border-t lg:border-t-0 lg:border-r border-slate-200 px-2 py-1 lg:p-4 z-50 flex lg:flex-col justify-around lg:justify-start gap-1 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] lg:shadow-none bg-opacity-95 backdrop-blur-md">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col lg:flex-row items-center gap-1 lg:gap-3 py-2 lg:px-4 lg:py-3.5 rounded-2xl transition-all duration-300 group relative flex-1 lg:flex-none ${
                  isActive
                    ? "text-[#f36c21] bg-orange-50/50 lg:bg-orange-50/80 shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <div className={`transition-transform duration-300 ${isActive ? "scale-110 lg:scale-100" : "group-active:scale-90"}`}>
                  <Icon className={`w-6 h-6 lg:w-5 lg:h-5 ${isActive ? "stroke-[2.5]" : "stroke-[2.2]"}`} />
                </div>
                <span className={`text-[10px] lg:text-[13px] font-black tracking-tight ${isActive ? "opacity-100" : "opacity-70 lg:opacity-100"}`}>
                  {item.label}
                </span>
                
                {/* Active Indicators */}
                {isActive && (
                  <>
                    <div className="absolute -top-1 lg:top-auto lg:right-0 w-10 lg:w-1.5 h-1 lg:h-1/2 bg-[#f36c21] rounded-full" />
                    <div className="lg:hidden absolute -top-1 blur-md w-12 h-1 bg-[#f36c21] opacity-30" />
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto pb-24 lg:pb-0 bg-[#f8fafc] scroll-smooth">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
