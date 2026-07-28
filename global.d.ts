// types/global.d.ts သို့မဟုတ် types/sw.d.ts ထဲတွင် ထည့်ပါ

interface SyncManager {
  register(tag: string): Promise<void>;
  getTags(): Promise<string[]>;
}

interface ServiceWorkerRegistration {
  readonly sync: SyncManager;
}