import { describe, expect, it, vi, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import {
  AudioAnalyzer,
  TtsAudioCache,
  buildTtsCacheKey,
  useMessageVisualState,
} from "../../src";

describe("TtsAudioCache", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("builds deterministic keys for standard and rate/pitch-customized speech", () => {
    expect(
      buildTtsCacheKey({
        voiceId: "aws:Joanna",
        engine: "neural",
        text: " Hello world ",
      }),
    ).toBe("aws:Joanna:neural:Hello world");

    expect(
      buildTtsCacheKey({
        voiceId: "aws:Joanna",
        text: "Hi",
        rate: 1.2,
        pitch: 0.9,
      }),
    ).toBe("aws:Joanna:default:1.2:0.9:Hi");
  });

  it("enforces LRU eviction in memory and mints object URLs", async () => {
    const cache = new TtsAudioCache({ maxEntries: 2, enableIndexedDb: false });
    const blobA = new Blob(["audio-a"], { type: "audio/mpeg" });
    const blobB = new Blob(["audio-b"], { type: "audio/mpeg" });
    const blobC = new Blob(["audio-c"], { type: "audio/mpeg" });

    await cache.set("k1", { audioBlob: blobA, mimeType: "audio/mpeg" });
    await cache.set("k2", { audioBlob: blobB, mimeType: "audio/mpeg" });
    expect(cache.size).toBe(2);

    // Touch k1 so k2 becomes least-recently-used
    const hit1 = await cache.get("k1");
    expect(hit1).toBeDefined();
    expect(cache.createObjectUrl(hit1!)).toContain("blob:");

    await cache.set("k3", { audioBlob: blobC, mimeType: "audio/mpeg" });
    expect(cache.hasInMemory("k1")).toBe(true);
    expect(cache.hasInMemory("k2")).toBe(false);
    expect(cache.hasInMemory("k3")).toBe(true);

    expect(await cache.delete("k1")).toBe(true);
    expect(await cache.get("k1")).toBeUndefined();

    await cache.clear();
    expect(cache.size).toBe(0);
  });

  it("persists and reloads entries via IndexedDB when available", async () => {
    const idbStore = new Map<string, unknown>();
    const fakeObjectStore = {
      put: (record: { key: string }) => {
        idbStore.set(record.key, record);
        const req: { onsuccess?: () => void; onerror?: () => void } = {};
        queueMicrotask(() => req.onsuccess?.());
        return req;
      },
      get: (key: string) => {
        const req: {
          result?: unknown;
          onsuccess?: () => void;
          onerror?: () => void;
        } = { result: idbStore.get(key) };
        queueMicrotask(() => req.onsuccess?.());
        return req;
      },
      delete: (key: string) => {
        idbStore.delete(key);
        const req: { onsuccess?: () => void; onerror?: () => void } = {};
        queueMicrotask(() => req.onsuccess?.());
        return req;
      },
      clear: () => {
        idbStore.clear();
        const req: { onsuccess?: () => void; onerror?: () => void } = {};
        queueMicrotask(() => req.onsuccess?.());
        return req;
      },
    };

    const fakeDb = {
      objectStoreNames: { contains: () => false },
      createObjectStore: vi.fn(),
      transaction: () => ({
        objectStore: () => fakeObjectStore,
      }),
    };

    vi.stubGlobal("indexedDB", {
      open: () => {
        const req: {
          result: typeof fakeDb;
          onupgradeneeded?: () => void;
          onsuccess?: () => void;
          onerror?: () => void;
        } = { result: fakeDb };
        queueMicrotask(() => {
          req.onupgradeneeded?.();
          req.onsuccess?.();
        });
        return req;
      },
    });

    const writerCache = new TtsAudioCache({ maxEntries: 5, enableIndexedDb: true });
    await writerCache.set("persisted-key", {
      audioBlob: new Blob([new Uint8Array([1, 2, 3, 4])], { type: "audio/mpeg" }),
      mimeType: "audio/mpeg",
      visemes: [{ time: 0.1, type: "viseme", value: "a" }],
    });

    const readerCache = new TtsAudioCache({ maxEntries: 5, enableIndexedDb: true });
    const restored = await readerCache.get("persisted-key");
    expect(restored).toBeDefined();
    expect(restored?.visemes).toEqual([{ time: 0.1, type: "viseme", value: "a" }]);

    await readerCache.delete("persisted-key");
    await readerCache.clear();
  });
});

describe("AudioAnalyzer", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("computes normalized RMS amplitude from Web Audio time-domain samples", () => {
    const analyzer = new AudioAnalyzer();
    expect(analyzer.getAmplitude()).toBe(0);

    const connectSpy = vi.fn();
    const fakeAnalyserNode = {
      fftSize: 256,
      frequencyBinCount: 4,
      connect: connectSpy,
      getByteTimeDomainData: (arr: Uint8Array) => {
        arr.set([256 - 1, 0, 255, 1]);
      },
    };

    class FakeAudioContext {
      public destination = {};
      public createAnalyser() {
        return fakeAnalyserNode;
      }
      public createMediaElementSource() {
        return { connect: connectSpy };
      }
    }

    vi.stubGlobal("AudioContext", FakeAudioContext);

    const audio = document.createElement("audio");
    analyzer.connect(audio);
    // Second connect on same element is a safe no-op
    analyzer.connect(audio);
    expect(connectSpy).toHaveBeenCalledTimes(2);

    const rms = analyzer.getAmplitude();
    expect(rms).toBeGreaterThan(0.95);
    expect(rms).toBeLessThanOrEqual(1);
  });
});

describe("useMessageVisualState", () => {
  it("transitions through SHOWING, WAITING_FOR_AUDIO, PERSISTING, PAUSED, and IDLE", () => {
    const { result, rerender } = renderHook(
      ({ speaking }) =>
        useMessageVisualState(speaking, {
          msPerChar: 50,
          persistenceDuration: 200,
          pauseBeforeNextMsg: 100,
        }),
      { initialProps: { speaking: true } },
    );

    expect(result.current.visualState).toBe("IDLE");

    act(() => {
      result.current.queueMessage("Hi");
    });
    expect(result.current.visualState).toBe("SHOWING");

    act(() => {
      result.current.update(60);
    });
    expect(result.current.displayText).toBe("H");

    act(() => {
      result.current.update(60);
    });
    expect(result.current.displayText).toBe("Hi");
    expect(result.current.visualState).toBe("WAITING_FOR_AUDIO");

    // Queue next message while waiting -> transitions through PAUSED
    act(() => {
      result.current.queueMessage("Yo");
      result.current.update(10);
    });
    expect(result.current.visualState).toBe("PAUSED");

    act(() => {
      result.current.update(120);
      result.current.update(150);
    });
    expect(result.current.displayText).toBe("Yo");

    // Finish speaking -> PERSISTING -> IDLE
    rerender({ speaking: false });
    act(() => {
      result.current.update(10);
    });
    expect(result.current.visualState).toBe("PERSISTING");

    act(() => {
      result.current.update(250);
      result.current.update(10);
    });
    expect(result.current.visualState).toBe("IDLE");
    expect(result.current.displayText).toBe("");
  });
});
