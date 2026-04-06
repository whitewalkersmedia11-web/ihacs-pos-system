export interface Phone {
  id: string;
  brand: string;
  model: string;
  imei: string;
  price: number;
  cost: number;
  warranty: string;
  color: string;
  storage: string;
  condition: "New" | "Used" | "Refurbished";
  status: "In Stock" | "Sold" | "Reserved";
  addedDate: string;
  category: "iPhone" | "Android" | "Other";
}

export interface Accessory {
  id: string;
  name: string;
  sku: string;
  category: "Back Covers" | "Tempered Glasses" | "Chargers" | "Cables" | "Audio" | "Power Banks" | "Other";
  price: number;
  cost: number;
  stock: number;
  lowStockThreshold: number;
  emoji: string;
}

export interface CartItemPOS {
  id: string;
  type: "phone" | "accessory";
  name: string;
  price: number;
  originalPrice: number;
  quantity: number;
  imei?: string;
  warranty?: string;
  emoji: string;
}

export interface SaleTransaction {
  id: string;
  date: string;
  items: CartItemPOS[];
  subtotal: number;
  discount: number;
  discountType: "flat" | "percentage";
  tradeInValue: number;
  tradeInDevice?: string;
  total: number;
  paymentMethod: string;
  customerName?: string;
  customerPhone?: string;
}

export type ExpenseCategory = "Rent" | "Electricity" | "Salary" | "Transport" | "Repair Parts" | "Other";

export interface Expense {
  id: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  note: string;
}

export interface DashboardMetrics {
  todayRevenue: number;
  grossProfit: number;
  todaySales: number;
  weeklyRevenue: number[];
}
