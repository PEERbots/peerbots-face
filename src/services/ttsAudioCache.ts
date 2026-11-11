import type { AmplitudePoint, TimedViseme } from "../types/face";

export interface TtsCacheKeyParams {
  voiceId: string;
  engine?: string;
  text: string;
  rate?: number;
  pitch?: number;
}

export function buildTtsCacheKey(params: TtsCacheKeyParams): string {
  const voice = params.voiceId.trim();
  const engine = (params.engine ?? "default").trim() || "default";
  const normalizedText = params.text.trim();
  if (params.rate === undefined && params.pitch === undefined) {
    return `${voice}:${engine}:${normalizedText}`;
  }
  const rate = params.rate ?? 1;
  const pitch = params.pitch ?? 1;
  return `${voice}:${engine}:${rate}:${pitch}:${normalizedText}`;
}

export interface TtsAudioCacheEntry {
  audioBlob: Blob;
  mimeType: string;
  visemes?: TimedViseme[];
  amplitudeData?: AmplitudePoint[];
  extrema?: AmplitudePoint[];
  createdAt: number;
}

interface SerializedIdbCacheRecord {
  key: string;
  audioBuffer: ArrayBuffer;
  mimeType: string;
  visemes?: TimedViseme[];
  amplitudeData?: AmplitudePoint[];
  extrema?: AmplitudePoint[];
  createdAt: number;
}

export interface TtsAudioCacheOptions {
  maxEntries?: number;
  enableIndexedDb?: boolean;
  dbName?: string;
  storeName?: string;
}

export async function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  if (typeof blob.arrayBuffer === "function") {
    return blob.arrayBuffer();
  }
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to read Blob as ArrayBuffer"));
      }
    };
    reader.onerror = () => {
      reject(reader.error ?? new Error("FileReader error"));
    };
    reader.readAsArrayBuffer(blob);
  });
}

/**
 * Two-tier (in-memory LRU + IndexedDB) cache for synthesized TTS audio buffers and viseme marks.
 * Prevents duplicate cloud TTS requests for repeated button presses across sessions.
 */
export class TtsAudioCache {
  private readonly maxEntries: number;
  private readonly enableIndexedDb: boolean;
  private readonly dbName: string;
  private readonly storeName: string;
  private readonly memory = new Map<string, TtsAudioCacheEntry>();
  private dbPromise: Promise<IDBDatabase | null> | null = null;

  public constructor(options: TtsAudioCacheOptions = {}) {
    this.maxEntries = Math.max(1, options.maxEntries ?? 100);
    this.enableIndexedDb = options.enableIndexedDb ?? true;
    this.dbName = options.dbName ?? "peerbots-tts-cache";
    this.storeName = options.storeName ?? "entries";
  }

  public get size(): number {
    return this.memory.size;
  }

  public hasInMemory(key: string): boolean {
    return this.memory.has(key);
  }

  public async get(key: string): Promise<TtsAudioCacheEntry | undefined> {
    const existing = this.memory.get(key);
    if (existing) {
      // Refresh LRU position
      this.memory.delete(key);
      this.memory.set(key, existing);
      return existing;
    }

    const fromIdb = await this.readFromIndexedDb(key);
    if (fromIdb) {
      this.putInMemory(key, fromIdb);
      return fromIdb;
    }
    return undefined;
  }

  public async set(
    key: string,
    entry: Omit<TtsAudioCacheEntry, "createdAt"> & { createdAt?: number },
  ): Promise<void> {
    const fullEntry: TtsAudioCacheEntry = {
      ...entry,
      createdAt: entry.createdAt ?? Date.now(),
    };
    this.putInMemory(key, fullEntry);
    await this.writeToIndexedDb(key, fullEntry);
  }

  public async delete(key: string): Promise<boolean> {
    const removedMem = this.memory.delete(key);
    const removedIdb = await this.deleteFromIndexedDb(key);
    return removedMem || removedIdb;
  }

  public async clear(): Promise<void> {
    this.memory.clear();
    await this.clearIndexedDb();
  }

  public createObjectUrl(entry: TtsAudioCacheEntry): string {
    return URL.createObjectURL(entry.audioBlob);
  }

  private putInMemory(key: string, entry: TtsAudioCacheEntry): void {
    if (this.memory.has(key)) {
      this.memory.delete(key);
    }
    this.memory.set(key, entry);
    while (this.memory.size > this.maxEntries) {
      const oldestKey = this.memory.keys().next().value;
      if (oldestKey !== undefined) {
        this.memory.delete(oldestKey);
      } else {
        break;
      }
    }
  }

  private openDatabase(): Promise<IDBDatabase | null> {
    if (!this.enableIndexedDb || typeof indexedDB === "undefined") {
      return Promise.resolve(null);
    }
    if (this.dbPromise) {
      return this.dbPromise;
    }
    this.dbPromise = new Promise<IDBDatabase | null>((resolve) => {
      try {
        const request = indexedDB.open(this.dbName, 1);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(this.storeName)) {
            db.createObjectStore(this.storeName, { keyPath: "key" });
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(null);
      } catch (err) {
        void err;
        resolve(null);
      }
    });
    return this.dbPromise;
  }

  private async readFromIndexedDb(
    key: string,
  ): Promise<TtsAudioCacheEntry | undefined> {
    const db = await this.openDatabase();
    if (!db) {
      return undefined;
    }
    return new Promise<TtsAudioCacheEntry | undefined>((resolve) => {
      try {
        const tx = db.transaction(this.storeName, "readonly");
        const store = tx.objectStore(this.storeName);
        const req = store.get(key);
        req.onsuccess = () => {
          const record = req.result as SerializedIdbCacheRecord | undefined;
          if (!record || !record.audioBuffer) {
            resolve(undefined);
            return;
          }
          resolve({
            audioBlob: new Blob([record.audioBuffer], {
              type: record.mimeType || "audio/mpeg",
            }),
            mimeType: record.mimeType || "audio/mpeg",
            visemes: record.visemes,
            amplitudeData: record.amplitudeData,
            extrema: record.extrema,
            createdAt: record.createdAt,
          });
        };
        req.onerror = () => resolve(undefined);
      } catch (err) {
        void err;
        resolve(undefined);
      }
    });
  }

  private async writeToIndexedDb(
    key: string,
    entry: TtsAudioCacheEntry,
  ): Promise<void> {
    const db = await this.openDatabase();
    if (!db) {
      return;
    }
    try {
      const audioBuffer = await blobToArrayBuffer(entry.audioBlob);
      await new Promise<void>((resolve) => {
        const tx = db.transaction(this.storeName, "readwrite");
        const store = tx.objectStore(this.storeName);
        const record: SerializedIdbCacheRecord = {
          key,
          audioBuffer,
          mimeType: entry.mimeType,
          visemes: entry.visemes,
          amplitudeData: entry.amplitudeData,
          extrema: entry.extrema,
          createdAt: entry.createdAt,
        };
        const req = store.put(record);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      });
    } catch (err) {
      void err;
    }
  }

  private async deleteFromIndexedDb(key: string): Promise<boolean> {
    const db = await this.openDatabase();
    if (!db) {
      return false;
    }
    return new Promise<boolean>((resolve) => {
      try {
        const tx = db.transaction(this.storeName, "readwrite");
        const store = tx.objectStore(this.storeName);
        const req = store.delete(key);
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      } catch (err) {
        void err;
        resolve(false);
      }
    });
  }

  private async clearIndexedDb(): Promise<void> {
    const db = await this.openDatabase();
    if (!db) {
      return;
    }
    await new Promise<void>((resolve) => {
      try {
        const tx = db.transaction(this.storeName, "readwrite");
        const store = tx.objectStore(this.storeName);
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      } catch (err) {
        void err;
        resolve();
      }
    });
  }
}

export const defaultTtsAudioCache = new TtsAudioCache();
