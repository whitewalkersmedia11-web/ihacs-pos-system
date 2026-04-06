import { Phone, Accessory, SaleTransaction, Expense } from "./types";

export const phones: Phone[] = [
  { id: "p1", brand: "Samsung", model: "Galaxy A15", imei: "354678901234567", price: 52900, cost: 44000, warranty: "1 year", color: "Black", storage: "128GB", condition: "New", status: "In Stock", addedDate: "2026-04-01", category: "Android" },
  { id: "p2", brand: "Samsung", model: "Galaxy A25", imei: "354678901234568", price: 72900, cost: 61000, warranty: "1 year", color: "Blue", storage: "128GB", condition: "New", status: "In Stock", addedDate: "2026-04-01", category: "Android" },
  { id: "p3", brand: "Apple", model: "iPhone 13", imei: "354678901234569", price: 149900, cost: 128000, warranty: "1 year", color: "Midnight", storage: "128GB", condition: "New", status: "In Stock", addedDate: "2026-03-28", category: "iPhone" },
  { id: "p4", brand: "Apple", model: "iPhone 14", imei: "354678901234570", price: 189900, cost: 162000, warranty: "1 year", color: "Blue", storage: "128GB", condition: "New", status: "In Stock", addedDate: "2026-03-25", category: "iPhone" },
  { id: "p5", brand: "Xiaomi", model: "Redmi Note 13", imei: "354678901234571", price: 62900, cost: 51000, warranty: "6 months", color: "Green", storage: "256GB", condition: "New", status: "In Stock", addedDate: "2026-04-02", category: "Android" },
  { id: "p6", brand: "Samsung", model: "Galaxy S23 FE", imei: "354678901234572", price: 134900, cost: 112000, warranty: "1 year", color: "Cream", storage: "128GB", condition: "Refurbished", status: "In Stock", addedDate: "2026-03-20", category: "Android" },
  { id: "p7", brand: "Oppo", model: "A78", imei: "354678901234573", price: 54900, cost: 45000, warranty: "6 months", color: "Black", storage: "128GB", condition: "New", status: "Sold", addedDate: "2026-03-15", category: "Android" },
  { id: "p8", brand: "Apple", model: "iPhone 12", imei: "354678901234574", price: 89900, cost: 72000, warranty: "3 months", color: "White", storage: "64GB", condition: "Used", status: "In Stock", addedDate: "2026-04-03", category: "iPhone" },
  { id: "p9", brand: "Nokia", model: "G21", imei: "354678901234575", price: 32900, cost: 26000, warranty: "6 months", color: "Blue", storage: "64GB", condition: "New", status: "In Stock", addedDate: "2026-04-04", category: "Other" },
];

export const accessories: Accessory[] = [
  { id: "a1", name: "Tempered Glass - Universal", sku: "TG-UNI-001", category: "Tempered Glasses", price: 450, cost: 150, stock: 85, lowStockThreshold: 10, emoji: "🛡️" },
  { id: "a2", name: "Tempered Glass - iPhone", sku: "TG-IPH-001", category: "Tempered Glasses", price: 650, cost: 250, stock: 42, lowStockThreshold: 10, emoji: "🛡️" },
  { id: "a3", name: "Clear Case - Samsung", sku: "CC-SAM-001", category: "Back Covers", price: 800, cost: 300, stock: 35, lowStockThreshold: 5, emoji: "📱" },
  { id: "a4", name: "Leather Case - iPhone", sku: "LC-IPH-001", category: "Back Covers", price: 2500, cost: 1200, stock: 12, lowStockThreshold: 5, emoji: "👜" },
  { id: "a5", name: "USB-C Cable 1m", sku: "CB-USC-001", category: "Cables", price: 550, cost: 180, stock: 60, lowStockThreshold: 10, emoji: "🔌" },
  { id: "a6", name: "Lightning Cable 1m", sku: "CB-LTN-001", category: "Cables", price: 750, cost: 300, stock: 38, lowStockThreshold: 10, emoji: "🔌" },
  { id: "a7", name: "20W Fast Charger", sku: "CH-20W-001", category: "Chargers", price: 1800, cost: 800, stock: 25, lowStockThreshold: 5, emoji: "⚡" },
  { id: "a8", name: "65W GaN Charger", sku: "CH-65W-001", category: "Chargers", price: 4500, cost: 2200, stock: 8, lowStockThreshold: 5, emoji: "⚡" },
  { id: "a9", name: "Wireless Charger Pad", sku: "CH-WRL-001", category: "Chargers", price: 3200, cost: 1500, stock: 15, lowStockThreshold: 5, emoji: "🔋" },
  { id: "a10", name: "Earbuds - Basic", sku: "AU-BAS-001", category: "Audio", price: 1200, cost: 450, stock: 30, lowStockThreshold: 5, emoji: "🎧" },
  { id: "a11", name: "Earbuds - TWS Pro", sku: "AU-TWS-001", category: "Audio", price: 5500, cost: 2800, stock: 10, lowStockThreshold: 3, emoji: "🎵" },
  { id: "a12", name: "Bluetooth Speaker", sku: "AU-SPK-001", category: "Audio", price: 4800, cost: 2400, stock: 7, lowStockThreshold: 3, emoji: "🔊" },
  { id: "a13", name: "Phone Stand", sku: "AC-STD-001", category: "Other", price: 950, cost: 350, stock: 20, lowStockThreshold: 5, emoji: "📐" },
  { id: "a14", name: "Car Mount", sku: "AC-CAR-001", category: "Other", price: 1800, cost: 750, stock: 14, lowStockThreshold: 5, emoji: "🚗" },
  { id: "a15", name: "Power Bank 10000mAh", sku: "PB-10K-001", category: "Power Banks", price: 3500, cost: 1600, stock: 18, lowStockThreshold: 5, emoji: "🔋" },
  { id: "a16", name: "SIM Ejector Tool", sku: "AC-SIM-001", category: "Other", price: 100, cost: 20, stock: 3, lowStockThreshold: 5, emoji: "📌" },
  { id: "a17", name: "Phone Grip Ring", sku: "AC-GRP-001", category: "Other", price: 450, cost: 150, stock: 2, lowStockThreshold: 5, emoji: "💍" },
  { id: "a18", name: "MicroSD 64GB", sku: "SD-064-001", category: "Other", price: 1800, cost: 900, stock: 4, lowStockThreshold: 5, emoji: "💾" },
];

export const salesHistory: SaleTransaction[] = [
  {
    id: "s1", date: "2026-04-06T10:30:00", paymentMethod: "Cash", customerName: "Kamal Perera", customerPhone: "0771234567",
    items: [
      { id: "p7", type: "phone", name: "Oppo A78", price: 54900, originalPrice: 54900, quantity: 1, imei: "354678901234573", warranty: "6 months", emoji: "📱" },
      { id: "a1", type: "accessory", name: "Tempered Glass - Universal", price: 450, originalPrice: 450, quantity: 1, emoji: "🛡️" },
      { id: "a3", type: "accessory", name: "Clear Case - Samsung", price: 800, originalPrice: 800, quantity: 1, emoji: "📱" },
    ],
    subtotal: 56150, discount: 500, discountType: "flat", tradeInValue: 0, total: 55650,
  },
  {
    id: "s2", date: "2026-04-06T11:45:00", paymentMethod: "Card", customerName: "Nimal Silva",
    items: [
      { id: "a7", type: "accessory", name: "20W Fast Charger", price: 1800, originalPrice: 1800, quantity: 2, emoji: "⚡" },
      { id: "a5", type: "accessory", name: "USB-C Cable 1m", price: 550, originalPrice: 550, quantity: 3, emoji: "🔌" },
    ],
    subtotal: 5250, discount: 5, discountType: "percentage", tradeInValue: 0, total: 4988,
  },
  {
    id: "s3", date: "2026-04-05T14:20:00", paymentMethod: "Cash", customerName: "Amara Fernando", customerPhone: "0761234567",
    items: [
      { id: "p3", type: "phone", name: "iPhone 13", price: 145000, originalPrice: 149900, quantity: 1, imei: "354678901234569", warranty: "1 year", emoji: "📱" },
      { id: "a2", type: "accessory", name: "Tempered Glass - iPhone", price: 650, originalPrice: 650, quantity: 1, emoji: "🛡️" },
      { id: "a4", type: "accessory", name: "Leather Case - iPhone", price: 2500, originalPrice: 2500, quantity: 1, emoji: "👜" },
    ],
    subtotal: 148150, discount: 0, discountType: "flat", tradeInValue: 25000, tradeInDevice: "iPhone 11 (Used)", total: 123150,
  },
  {
    id: "s4", date: "2026-04-05T09:15:00", paymentMethod: "Mobile Pay",
    items: [
      { id: "a10", type: "accessory", name: "Earbuds - Basic", price: 1200, originalPrice: 1200, quantity: 1, emoji: "🎧" },
    ],
    subtotal: 1200, discount: 0, discountType: "flat", tradeInValue: 0, total: 1200,
  },
  {
    id: "s5", date: "2026-04-04T16:00:00", paymentMethod: "Cash", customerName: "Dilshan Jayawardena",
    items: [
      { id: "p1", type: "phone", name: "Samsung Galaxy A15", price: 52900, originalPrice: 52900, quantity: 1, imei: "354678901234567", warranty: "1 year", emoji: "📱" },
      { id: "a1", type: "accessory", name: "Tempered Glass - Universal", price: 450, originalPrice: 450, quantity: 2, emoji: "🛡️" },
      { id: "a7", type: "accessory", name: "20W Fast Charger", price: 1800, originalPrice: 1800, quantity: 1, emoji: "⚡" },
    ],
    subtotal: 55600, discount: 1000, discountType: "flat", tradeInValue: 0, total: 54600,
  },
  {
    id: "s6", date: "2026-04-04T11:30:00", paymentMethod: "Card",
    items: [
      { id: "a15", type: "accessory", name: "Power Bank 10000mAh", price: 3500, originalPrice: 3500, quantity: 1, emoji: "🔋" },
      { id: "a14", type: "accessory", name: "Car Mount", price: 1800, originalPrice: 1800, quantity: 1, emoji: "🚗" },
    ],
    subtotal: 5300, discount: 0, discountType: "flat", tradeInValue: 0, total: 5300,
  },
  {
    id: "s7", date: "2026-04-03T15:45:00", paymentMethod: "Cash", customerName: "Sachini De Silva", customerPhone: "0711234567",
    items: [
      { id: "p4", type: "phone", name: "iPhone 14", price: 189900, originalPrice: 189900, quantity: 1, imei: "354678901234570", warranty: "1 year", emoji: "📱" },
      { id: "a2", type: "accessory", name: "Tempered Glass - iPhone", price: 650, originalPrice: 650, quantity: 1, emoji: "🛡️" },
    ],
    subtotal: 190550, discount: 2000, discountType: "flat", tradeInValue: 45000, tradeInDevice: "iPhone 12 (Good)", total: 143550,
  },
  // March sales for monthly tracking
  {
    id: "s8", date: "2026-03-28T10:00:00", paymentMethod: "Cash", customerName: "Ruwan Bandara",
    items: [
      { id: "p5", type: "phone", name: "Xiaomi Redmi Note 13", price: 62900, originalPrice: 62900, quantity: 1, imei: "354678901234571", warranty: "6 months", emoji: "📱" },
    ],
    subtotal: 62900, discount: 0, discountType: "flat", tradeInValue: 0, total: 62900,
  },
  {
    id: "s9", date: "2026-03-20T14:00:00", paymentMethod: "Card",
    items: [
      { id: "a11", type: "accessory", name: "Earbuds - TWS Pro", price: 5500, originalPrice: 5500, quantity: 2, emoji: "🎵" },
    ],
    subtotal: 11000, discount: 500, discountType: "flat", tradeInValue: 0, total: 10500,
  },
  {
    id: "s10", date: "2026-03-15T09:30:00", paymentMethod: "Cash", customerName: "Priya Mendis",
    items: [
      { id: "p6", type: "phone", name: "Samsung Galaxy S23 FE", price: 134900, originalPrice: 134900, quantity: 1, imei: "354678901234572", warranty: "1 year", emoji: "📱" },
      { id: "a3", type: "accessory", name: "Clear Case - Samsung", price: 800, originalPrice: 800, quantity: 1, emoji: "📱" },
    ],
    subtotal: 135700, discount: 1500, discountType: "flat", tradeInValue: 30000, tradeInDevice: "Samsung A52", total: 104200,
  },
];

export const expenses: Expense[] = [
  { id: "e1", category: "Rent", amount: 45000, date: "2026-04-01", note: "Shop rent - April" },
  { id: "e2", category: "Electricity", amount: 8500, date: "2026-04-03", note: "Electricity bill" },
  { id: "e3", category: "Salary", amount: 35000, date: "2026-04-01", note: "Assistant salary" },
  { id: "e4", category: "Transport", amount: 2500, date: "2026-04-02", note: "Stock pickup from Colombo" },
  { id: "e5", category: "Repair Parts", amount: 12000, date: "2026-04-04", note: "iPhone screens x3" },
  { id: "e6", category: "Other", amount: 1500, date: "2026-04-05", note: "Cleaning supplies" },
  { id: "e7", category: "Rent", amount: 45000, date: "2026-03-01", note: "Shop rent - March" },
  { id: "e8", category: "Salary", amount: 35000, date: "2026-03-01", note: "Assistant salary - March" },
  { id: "e9", category: "Electricity", amount: 7800, date: "2026-03-05", note: "Electricity bill - March" },
  { id: "e10", category: "Transport", amount: 3200, date: "2026-03-12", note: "Stock delivery" },
];

export const weeklyRevenueData = [
  { day: "Mon", revenue: 54600, sales: 3 },
  { day: "Tue", revenue: 12500, sales: 5 },
  { day: "Wed", revenue: 143550, sales: 2 },
  { day: "Thu", revenue: 59900, sales: 4 },
  { day: "Fri", revenue: 0, sales: 0 },
  { day: "Sat", revenue: 60638, sales: 3 },
  { day: "Sun", revenue: 0, sales: 0 },
];

export const categoryBreakdown = [
  { name: "Phones", value: 65, color: "hsl(168, 60%, 38%)" },
  { name: "Cases", value: 12, color: "hsl(36, 90%, 55%)" },
  { name: "Chargers", value: 10, color: "hsl(210, 60%, 50%)" },
  { name: "Audio", value: 8, color: "hsl(280, 60%, 50%)" },
  { name: "Other", value: 5, color: "hsl(142, 60%, 42%)" },
];

export const quickAddItems = ["a1", "a2", "a7", "a5", "a6", "a9"];
