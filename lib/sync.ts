import { db } from './db';
import { createRegistration } from '@/app/actions/registration';
import { toast } from 'sonner';

export async function syncOfflineRegistrations() {
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
      });

      if (res.success && item.id) {
        // Server ထဲ အောင်မြင်စွာ ရောက်သွားပါက IndexedDB ထဲမှ ဖျက်ပါ သို့မဟုတ် synced mark လုပ်ပါ
        await db.pendingRegistrations.delete(item.id);
      }
    } catch (err) {
      console.error('Failed to sync item:', item, err);
    }
  }

  toast.success('Offline Data များ အားလုံး Sync လုပ်ပြီးပါပြီ။');
}