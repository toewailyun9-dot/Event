import { db } from './db';
import { toast } from 'sonner';

// Mutex lock to prevent concurrent sync runs.
// Both the client-side sync (triggered by coming online) and
// the Service Worker Background Sync could run simultaneously,
// causing race conditions. This ensures only one runs at a time.
let isSyncing = false;

// Send offline records to the server in batches so that a large offline
// queue (e.g. 800 records) costs 800/50 = 16 requests instead of 800
// sequential ones (~40 min -> under a minute).
const BATCH_SIZE = 50;

// Random delay (0-30s) applied before an externally-triggered sync so that
// hundreds of devices reconnecting at the same moment (e.g. a venue WiFi drop)
// don't all POST to the batch endpoint simultaneously and trip the per-IP rate
// limiter. The storm is spread across 0-30s instead of one sharp spike.
const SYNC_MAX_JITTER_MS = 30_000;

// Auto-retry interval while unsynced records remain. This is the critical
// safety net: without it, a partially-failed sync would only retry on the next
// online/offline toggle. On iOS Safari there is no Background Sync API at all,
// so a stable network with a failed batch would leave data stuck in IndexedDB.
const SYNC_RETRY_DELAY_MS = 30_000;

// Abort a hung request instead of blocking the sync mutex for the browser's
// default (effectively unbounded) fetch timeout.
const FETCH_TIMEOUT_MS = 30_000;

// IndexedDB pending-count threshold that triggers a storage-full warning.
const PENDING_COUNT_WARNING = 500;

let retryTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleSyncRetry() {
  if (retryTimer) return;
  retryTimer = setTimeout(() => {
    retryTimer = null;
    syncOfflineRegistrations({ silent: true });
  }, SYNC_RETRY_DELAY_MS);
}

/**
 * Jittered entry point for external triggers (online, visibilitychange, focus).
 * Spreads the reconnect "sync storm" across 0-30s so that all devices on a
 * shared venue WiFi IP don't hit the batch endpoint in the same instant.
 */
export function requestOfflineSync() {
  const jitter = Math.floor(Math.random() * SYNC_MAX_JITTER_MS);
  setTimeout(() => {
    syncOfflineRegistrations();
  }, jitter);
}

export async function syncOfflineRegistrations({
  silent = false,
}: { silent?: boolean } = {}) {
  // Prevent concurrent sync — if already running, skip
  if (isSyncing) {
    console.log('[Sync] Already syncing, skipping…');
    // Self-healing: make sure a retry is pending even if this call was skipped.
    scheduleSyncRetry();
    return;
  }

  isSyncing = true;

  try {
    // Sync မလုပ်ရသေးတဲ့ Data များကို ဆွဲထုတ်မည်
    const pendingList = await db.pendingRegistrations
      .filter((item) => !item.synced)
      .toArray();

    if (pendingList.length === 0) return;

    if (!silent) {
      toast.info(`Offline ဖြည့်ထားသော Data (${pendingList.length}) ခုအား Sync လုပ်နေပါသည်...`);
    }

    let syncedCount = 0;

    for (let i = 0; i < pendingList.length; i += BATCH_SIZE) {
      const chunk = pendingList.slice(i, i + BATCH_SIZE);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      try {
        const res = await fetch('/api/register/batch', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify(
            chunk.map((item) => ({
              eventId: item.eventId,
              name: item.name,
              email: item.email,
              age: item.age,
              phone: item.phone,
              address: item.address,
              syncId: item.syncId,
              isOfflineSynced: true,
            }))
          ),
        });

        if (res.ok) {
          // Server ထဲ အောင်မြင်စွာ ရောက်သွားပါက IndexedDB ထဲမှ ဖျက်ပါ
          for (const item of chunk) {
            if (item.id) await db.pendingRegistrations.delete(item.id);
          }
          syncedCount += chunk.length;
        } else {
          // Server rejected the batch (rate limit / validation / server error) —
          // keep this and the remaining chunks locally for the next retry.
          const data = await res.json().catch(() => null);
          console.error(`[Sync] Batch rejected (${res.status}):`, data?.error);
          break;
        }
      } catch (err) {
        // Network error or request timeout — keep remaining records locally.
        console.error('[Sync] Batch failed:', err);
        break;
      } finally {
        clearTimeout(timeout);
      }
    }

    if (syncedCount < pendingList.length) {
      if (!silent) {
        toast.error(
          `Sync တစ်စိတ်တစ်ပိုင်း မပြီးသေးပါ။ (${pendingList.length - syncedCount} ခု နောက်မှ ထပ်ကြိုးစားပါမည်)`
        );
      }
      // Critical: keep retrying while records remain even if the network stays
      // stable (no more online/offline toggles). Without this, a 429 or a brief
      // blip leaves data stuck in IndexedDB — especially on iOS, which has no
      // Service Worker Background Sync to fall back on.
      scheduleSyncRetry();
    } else if (!silent) {
      toast.success('Offline Data များ အားလုံး Sync လုပ်ပြီးပါပြီ။');
    }
  } finally {
    isSyncing = false;
  }
}

/**
 * Best-effort warning when the local pending queue grows very large. Called
 * after each offline save; throttled so it doesn't spam the operator on every
 * single entry once the threshold is passed.
 */
let lastPendingWarningAt = 0;

export async function warnIfPendingQueueLarge() {
  const count = await db.pendingRegistrations.filter((item) => !item.synced).count();
  if (count < PENDING_COUNT_WARNING) return;

  const now = Date.now();
  if (now - lastPendingWarningAt < 60_000) return;
  lastPendingWarningAt = now;

  toast.warning(
    `စက်ထဲတွင် ${count} ခု Sync မလုပ်ရသေးပါ။ အင်တာနက် ပြန်ရသည်နှင့် စောင့်ဆိုင်းထားသော Data များ တင်မည်။`
  );
}
