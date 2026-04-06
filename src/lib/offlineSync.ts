import { supabase } from './supabase';
import { toast } from 'sonner';

const TRANSACTION_QUEUE = 'ihacs_offline_sales';
const INVENTORY_CACHE = 'ihacs_inventory_cache';

export const offlineSync = {
  // 1. Queue a sale for background sync
  queueSale: async (saleData: any) => {
    const queue = JSON.parse(localStorage.getItem(TRANSACTION_QUEUE) || '[]');
    const newEntry = {
      id: `offline-${Date.now()}`,
      data: saleData,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem(TRANSACTION_QUEUE, JSON.stringify([...queue, newEntry]));
    toast.info('Sale saved locally (Offline Mode)');
    
    // Try to sync immediately if possible
    offlineSync.processQueue();
  },

  // 2. Process all pending sales once online
  processQueue: async () => {
    if (!navigator.onLine) return;
    
    const queue = JSON.parse(localStorage.getItem(TRANSACTION_QUEUE) || '[]');
    if (queue.length === 0) return;

    toast.loading(`Syncing ${queue.length} offline sales...`);

    const failed = [];
    for (const entry of queue) {
      try {
        const { error } = await supabase.from('sales').insert([entry.data]);
        if (error) throw error;
      } catch (err) {
        failed.push(entry);
      }
    }

    localStorage.setItem(TRANSACTION_QUEUE, JSON.stringify(failed));
    
    if (failed.length === 0) {
      toast.success('All offline sales synced successfully!');
    } else {
      toast.error(`Failed to sync ${failed.length} sales. Will retry later.`);
    }
  },

  // 3. Cache inventory locally for fast offline access
  cacheInventory: (data: { phones: any[], accessories: any[] }) => {
    localStorage.setItem(INVENTORY_CACHE, JSON.stringify(data));
  },

  getCachedInventory: () => {
    return JSON.parse(localStorage.getItem(INVENTORY_CACHE) || '{"phones":[], "accessories":[]}');
  }
};

// Auto-sync when network status changes
window.addEventListener('online', () => {
  offlineSync.processQueue();
});
