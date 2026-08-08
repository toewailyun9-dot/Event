// Dexie.js အား Service Worker ထဲတွင် သုံးနိုင်ရန် Import လုပ်ခြင်း
importScripts('/dexie.js');

const db = new Dexie('EventRegistrationDB');
db.version(1).stores({
  pendingRegistrations: '++id, eventId, synced, createdAt',
});

// SW install ဖြစ်ချိန်မှာ root page ကို cache ထဲထည့်ထားမယ်
// ဒါမှ offline မှာလည်း page ကိုပြသနိုင်မယ်
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('start-url').then((cache) => {
      return cache.add(new Request('/', { cache: 'reload' })).catch(() => {});
    })
  );
});

// Track consecutive failures to prevent infinite retry loops
let consecutiveFailures = 0;
const MAX_CONSECUTIVE_FAILURES = 3;

// Sync Event Listener
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-registrations') {
    console.log('[SW] Background sync triggered for: sync-registrations');
    event.waitUntil(syncDataWithServer());
  }
});

// Send offline records to the server in batches so a large offline queue
// (e.g. 800 records) costs 16 requests instead of 800 sequential ones.
const SYNC_BATCH_SIZE = 50;

async function syncDataWithServer() {
  try {
    // Only fetch items that have NOT been synced yet
    // This prevents re-sending items that the client-side sync already handled
    const pendingList = await db.pendingRegistrations
      .filter((item) => !item.synced)
      .toArray();

    if (pendingList.length === 0) {
      console.log('[SW] No pending registrations to sync.');
      consecutiveFailures = 0;
      return;
    }

    console.log(`[SW] Found ${pendingList.length} items to sync.`);

    let batchSuccess = true;

    for (let i = 0; i < pendingList.length; i += SYNC_BATCH_SIZE) {
      const chunk = pendingList.slice(i, i + SYNC_BATCH_SIZE);
      const payload = chunk.map((item) => {
        // Only send the necessary fields — exclude Dexie internal fields
        const { id, synced, createdAt, ...cleanPayload } = item;
        return cleanPayload;
      });

      try {
        const response = await fetch('/api/register/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          // Success — delete the whole chunk from local Dexie DB
          for (const item of chunk) {
            await db.pendingRegistrations.delete(item.id);
          }
          console.log(`[SW] Successfully synced and deleted chunk (${chunk.length} items)`);
        } else if (response.status === 429) {
          // Rate limited — stop for now, keep everything locally for retry
          console.warn(`[SW] Rate limited (429), keeping ${pendingList.length - i} items for retry.`);
          batchSuccess = false;
          break;
        } else {
          // Server returned an error — keep the chunk for potential retry
          console.error(`[SW] Server returned status ${response.status} for chunk.`);
          batchSuccess = false;
          break;
        }
      } catch (err) {
        // Network error — keep remaining chunks for retry
        console.error(`[SW] Network error syncing chunk:`, err);
        batchSuccess = false;
        break;
      }
    }

    if (batchSuccess) {
      consecutiveFailures = 0;
    } else {
      consecutiveFailures++;
      console.warn(`[SW] Batch had failures (${consecutiveFailures}/${MAX_CONSECUTIVE_FAILURES})`);
    }

    // Safety valve: if we keep failing, stop retrying to avoid battery/resource drain
    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      console.error('[SW] Too many consecutive failures. Stopping retries.');
      consecutiveFailures = 0; // Reset so future sync events can try again
    }
  } catch (dbError) {
    console.error('[SW] Failed to access Dexie DB:', dbError);
  }
}

