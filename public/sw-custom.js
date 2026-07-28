// Dexie.js အား Service Worker ထဲတွင် သုံးနိုင်ရန် Import လုပ်ခြင်း
importScripts('https://unpkg.com/dexie@3.2.4/dist/dexie.js');

// Client က သတ်မှတ်ခဲ့သော Database အမည်နှင့် ထပ်တူဖြစ်ရမည်
const db = new Dexie('EventRegistrationDB');
db.version(1).stores({
  pendingRegistrations: '++id, eventId, synced, createdAt',
});

// Browser က အင်တာနက်လိုင်း ရပြီဆိုတာနဲ့ ဒီ event အော်တို အလုပ်လုပ်မည်
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-registrations') {
    // Sync မပြီးမချင်း Service Worker အား အသက်ရှင်ပေးရန် waitUntil သုံးရသည်
    event.waitUntil(syncDataWithServer());
  }
});

async function syncDataWithServer() {
  const pendingList = await db.pendingRegistrations.filter(item => !item.synced).toArray();
  
  for (const item of pendingList) {
    try {
      // Server Action သည် နောက်ကွယ်တွင် POST Request ဖြစ်သဖြင့် fetch ဖြင့် လှမ်းပို့နိုင်သည်
      // သို့မဟုတ် Server Action နေရာတွင် သီးသန့် Route Handler (/api/register) ဆောက်၍ သုံးလျှင် ပိုစိတ်ချရသည်
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });

      if (response.ok) {
        // အောင်မြင်ပါက Local DB ထဲမှ ဖျက်ပစ်မည်
        await db.pendingRegistrations.delete(item.id);
      }
    } catch (error) {
      console.error('Background sync failed for item:', error);
      throw error; // ထပ်မံ ကြိုးစားနိုင်ရန် error အား rethrow လုပ်သည်
    }
  }
}