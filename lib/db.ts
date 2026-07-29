import Dexie, { Table } from 'dexie';

// Offline Registration Data Type
export interface OfflineRegistration {
  id?: number; // Auto-incrementing primary key for IndexedDB
  name: string;
  email: string;
  age: number;
  phone: string;
  address: string;
  eventId?: string;
  createdAt: string;
  synced: boolean; // Sync ပြီး မပြီး စစ်ရန် flag
  syncId: string; // UUID idempotency key — generated before save to prevent duplicates
}

export class OfflineDB extends Dexie {
  pendingRegistrations!: Table<OfflineRegistration>;

  constructor() {
    super('EventRegistrationDB');
    this.version(1).stores({
      pendingRegistrations: '++id, eventId, synced, createdAt',
    });
  }
}

export const db = new OfflineDB();