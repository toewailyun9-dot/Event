// Dexie.js အား Service Worker ထဲတွင် သုံးနိုင်ရန် Import လုပ်ခြင်း
importScripts('/dexie.js');

const db = new Dexie('EventRegistrationDB');
db.version(1).stores({
  pendingRegistrations: '++id, eventId, synced, createdAt',
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

    for (const item of pendingList) {
      try {
        // Only send the necessary fields — exclude Dexie internal fields
        const { id, synced, createdAt, ...cleanPayload } = item;

        const response = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cleanPayload),
        });

        if (response.ok) {
          // Success — delete from local Dexie DB
          await db.pendingRegistrations.delete(item.id);
          console.log(`[SW] Successfully synced and deleted ID: ${item.id}`);
        } else if (response.status === 409) {
          // Conflict — server already has this registration (duplicate syncId or email)
          // Safe to delete from local — it's already on the server
          console.log(`[SW] Duplicate detected (409), removing local ID: ${item.id}`);
          await db.pendingRegistrations.delete(item.id);
        } else {
          // Server returned an error (e.g. 422 validation, 500 server error)
          // Keep the item in Dexie for potential retry, but log it
          console.error(`[SW] Server returned status ${response.status} for ID: ${item.id}`);
          batchSuccess = false;
        }
      } catch (err) {
        // Network error — keep the item for retry, don't block other items
        console.error(`[SW] Network error for item ID: ${item.id}`, err);
        batchSuccess = false;
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

