export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  emoji: string;
}

export const categories = ["All", "Phones", "Accessories", "Cases", "Chargers", "Audio"];

export const products: Product[] = [
  { id: "1", name: "Screen Protector", price: 5.99, category: "Accessories", emoji: "🛡️" },
  { id: "2", name: "Phone Case - Clear", price: 12.99, category: "Cases", emoji: "📱" },
  { id: "3", name: "Phone Case - Leather", price: 24.99, category: "Cases", emoji: "👜" },
  { id: "4", name: "USB-C Cable", price: 8.99, category: "Chargers", emoji: "🔌" },
  { id: "5", name: "Fast Charger 20W", price: 19.99, category: "Chargers", emoji: "⚡" },
  { id: "6", name: "Wireless Charger", price: 29.99, category: "Chargers", emoji: "🔋" },
  { id: "7", name: "Earbuds - Basic", price: 14.99, category: "Audio", emoji: "🎧" },
  { id: "8", name: "Earbuds - Pro", price: 49.99, category: "Audio", emoji: "🎵" },
  { id: "9", name: "Bluetooth Speaker", price: 34.99, category: "Audio", emoji: "🔊" },
  { id: "10", name: "Phone Stand", price: 9.99, category: "Accessories", emoji: "📐" },
  { id: "11", name: "Car Mount", price: 15.99, category: "Accessories", emoji: "🚗" },
  { id: "12", name: "Power Bank 10K", price: 22.99, category: "Chargers", emoji: "🔋" },
  { id: "13", name: "SIM Card Tool", price: 1.99, category: "Accessories", emoji: "📌" },
  { id: "14", name: "Phone Grip Ring", price: 6.99, category: "Accessories", emoji: "💍" },
  { id: "15", name: "Tempered Glass", price: 7.99, category: "Accessories", emoji: "✨" },
  { id: "16", name: "Repair Kit", price: 18.99, category: "Accessories", emoji: "🔧" },
];
