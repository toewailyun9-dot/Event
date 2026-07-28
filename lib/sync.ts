import { db } from './db';
import { createRegistration } from '@/app/actions/registration';
import { toast } from 'sonner';

// Mutex lock to prevent concurrent sync runs.
// Both the client-side sync (triggered by coming online) and
// the Service Worker Background Sync could run simultaneously,
// causing race conditions. This ensures only one runs at a time.
let isSyncing = false;

export async function syncOfflineRegistrations() {
  // Prevent concurrent sync — if already running, skip
  if (isSyncing) {
    console.log('[Sync] Already syncing, skipping…');
    return;
  }

  isSyncing = true;

  try {
    // Sync မလုပ်ရသေးတဲ့ Data များကို ဆွဲထုတ်မည်
    const pendingList = await db.pendingRegistrations
      .filter((item) => !item.synced)
      .toArray();

    if (pendingList.length === 0) return;

    toast.info(`Offline ဖြည့်ထားသော Data (${pendingList.length}) ခုအား Sync လုပ်နေပါသည်...`);

    for (const item of pendingList) {
      try {
        const res = await createRegistration({
          eventId: item.eventId,
          name: item.name,
          email: item.email,
          age: item.age,
          phone: item.phone,
          address: item.address,
          syncId: item.syncId,
          isOfflineSynced: true,
        });

        if (res.success && item.id) {
          // Server ထဲ အောင်မြင်စွာ ရောက်သွားပါက IndexedDB ထဲမှ ဖျက်ပါ
          await db.pendingRegistrations.delete(item.id);
        }
      } catch (err) {
        console.error('[Sync] Failed to sync item:', item, err);
      }
    }

    toast.success('Offline Data များ အားလုံး Sync လုပ်ပြီးပါပြီ။');
  } finally {
    isSyncing = false;
  }
}
