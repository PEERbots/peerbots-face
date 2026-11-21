import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import {
  FaceStoreProvider,
  FaceView,
  addFullscreenChangeListener,
  createPeerbotsFaceStore,
  exitNativeFullscreen,
  getFullscreenElement,
  isNativeFullscreenSupported,
  requestNativeFullscreen,
  useFaceFullscreenContext,
  useFullscreen,
} from "../../src";

describe("fullscreen helpers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      value: null,
    });
    delete (document as unknown as Record<string, unknown>).webkitFullscreenElement;
    delete (document as unknown as Record<string, unknown>).webkitExitFullscreen;
  });

  it("detects standard and vendor-prefixed fullscreen support", async () => {
    const el = document.createElement("div");
    expect(isNativeFullscreenSupported(el)).toBe(false);
    expect(isNativeFullscreenSupported(null)).toBe(false);

    const webkitReq = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(el, "webkitRequestFullscreen", {
      configurable: true,
      value: webkitReq,
    });
    expect(isNativeFullscreenSupported(el)).toBe(true);
    await requestNativeFullscreen(el);
    expect(webkitReq).toHaveBeenCalledTimes(1);

    const standardReq = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(el, "requestFullscreen", {
      configurable: true,
      value: standardReq,
    });
    await requestNativeFullscreen(el);
    expect(standardReq).toHaveBeenCalledTimes(1);
  });

  it("reads vendor-prefixed fullscreenElement, exits, and listens to change events", async () => {
    const el = document.createElement("div");
    Object.defineProperty(document, "webkitFullscreenElement", {
      configurable: true,
      value: el,
    });
    expect(getFullscreenElement()).toBe(el);

    const webkitExit = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(document, "webkitExitFullscreen", {
      configurable: true,
      value: webkitExit,
    });
    await exitNativeFullscreen();
    expect(webkitExit).toHaveBeenCalledTimes(1);

    const listener = vi.fn();
    const unsubscribe = addFullscreenChangeListener(listener);
    document.dispatchEvent(new Event("fullscreenchange"));
    document.dispatchEvent(new Event("webkitfullscreenchange"));
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    document.dispatchEvent(new Event("fullscreenchange"));
    expect(listener).toHaveBeenCalledTimes(2);
  });
});

describe("useFullscreen hook", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.style.overflow = "";
    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      value: null,
    });
  });

  it("uses native Fullscreen API when supported and notifies onFullscreenChange", async () => {
    const el = document.createElement("div");
    const reqSpy = vi.fn().mockImplementation(async () => {
      Object.defineProperty(document, "fullscreenElement", {
        configurable: true,
        value: el,
      });
    });
    const exitSpy = vi.fn().mockImplementation(async () => {
      Object.defineProperty(document, "fullscreenElement", {
        configurable: true,
        value: null,
      });
    });

    Object.defineProperty(el, "requestFullscreen", {
      configurable: true,
      value: reqSpy,
    });
    Object.defineProperty(document, "exitFullscreen", {
      configurable: true,
      value: exitSpy,
    });

    const onFullscreenChange = vi.fn();
    const targetRef = { current: el };
    const { result } = renderHook(() =>
      useFullscreen(targetRef, { onFullscreenChange }),
    );

    expect(result.current.isFullscreen).toBe(false);
    expect(result.current.isPseudoFullscreen).toBe(false);

    await act(async () => {
      await result.current.toggleFullscreen();
    });
    expect(reqSpy).toHaveBeenCalledTimes(1);
    expect(result.current.isFullscreen).toBe(true);
    expect(result.current.isPseudoFullscreen).toBe(false);
    expect(onFullscreenChange).toHaveBeenLastCalledWith(true);

    await act(async () => {
      await result.current.toggleFullscreen();
    });
    expect(exitSpy).toHaveBeenCalledTimes(1);
    expect(result.current.isFullscreen).toBe(false);
    expect(onFullscreenChange).toHaveBeenLastCalledWith(false);
  });

  it("falls back to CSS pseudo-fullscreen when unsupported or rejected, locks body scroll, and exits on Escape", async () => {
    const el = document.createElement("div");
    // Simulate iPhone Safari: no requestFullscreen method
    document.body.style.overflow = "auto";
    const onFullscreenChange = vi.fn();
    const targetRef = { current: el };

    const { result, unmount } = renderHook(() =>
      useFullscreen(targetRef, { onFullscreenChange }),
    );

    await act(async () => {
      await result.current.enterFullscreen();
    });
    expect(result.current.isFullscreen).toBe(true);
    expect(result.current.isPseudoFullscreen).toBe(true);
    expect(document.body.style.overflow).toBe("hidden");
    expect(onFullscreenChange).toHaveBeenLastCalledWith(true);

    // Pressing Escape exits pseudo-fullscreen and restores body overflow
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    expect(result.current.isFullscreen).toBe(false);
    expect(result.current.isPseudoFullscreen).toBe(false);
    expect(document.body.style.overflow).toBe("auto");
    expect(onFullscreenChange).toHaveBeenLastCalledWith(false);

    // Also verify rejection of native requestFullscreen falls back cleanly
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    Object.defineProperty(el, "requestFullscreen", {
      configurable: true,
      value: vi.fn().mockRejectedValue(new Error("Disallowed")),
    });

    await act(async () => {
      await result.current.enterFullscreen();
    });
    expect(warnSpy).toHaveBeenCalled();
    expect(result.current.isPseudoFullscreen).toBe(true);
    expect(document.body.style.overflow).toBe("hidden");

    // Unmount restores body overflow
    unmount();
    expect(document.body.style.overflow).toBe("auto");
  });
});

describe("FaceView fullscreen integration", () => {
  afterEach(() => {
    document.body.style.overflow = "";
  });

  it("provides independent FaceFullscreenContext to multiple FaceView instances with CSS pseudo-fullscreen classes", async () => {
    function FullscreenTrigger({ label }: { label: string }) {
      const ctx = useFaceFullscreenContext();
      return (
        <button
          type="button"
          onClick={() => {
            void ctx?.toggleFullscreen();
          }}
        >
          {label}:{ctx?.isFullscreen ? "on" : "off"}
        </button>
      );
    }

    const storeA = createPeerbotsFaceStore({ isSilent: true });
    const storeB = createPeerbotsFaceStore({ isSilent: true });
    const onChangeA = vi.fn();

    // Register a simple strategy that renders our context trigger inside FaceView
    const { FaceRendererRegistry } = await import("../../src");
    const registryA = new FaceRendererRegistry([
      {
        kind: "PixiFace",
        displayName: "Trigger A",
        requiresWebGL: false,
        render: () => <FullscreenTrigger label="face-a" />,
      },
    ]);
    const registryB = new FaceRendererRegistry([
      {
        kind: "PixiFace",
        displayName: "Trigger B",
        requiresWebGL: false,
        render: () => <FullscreenTrigger label="face-b" />,
      },
    ]);

    const { container } = render(
      <div>
        <FaceStoreProvider store={storeA}>
          <FaceView registry={registryA} onFullscreenChange={onChangeA} />
        </FaceStoreProvider>
        <FaceStoreProvider store={storeB}>
          <FaceView registry={registryB} />
        </FaceStoreProvider>
      </div>,
    );

    const btnA = screen.getByRole("button", { name: "face-a:off" });
    const btnB = screen.getByRole("button", { name: "face-b:off" });
    expect(btnB).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(btnA);
    });

    expect(screen.getByRole("button", { name: "face-a:on" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "face-b:off" })).toBeInTheDocument();
    expect(onChangeA).toHaveBeenLastCalledWith(true);

    const containers = container.querySelectorAll("#face-view-container");
    expect(containers[0]).toHaveAttribute("data-pseudo-fullscreen", "true");
    expect(containers[0].className).toContain("pbf:fixed");
    expect(containers[0].className).toContain("pbf:h-[100dvh]");
    expect(containers[1]).not.toHaveAttribute("data-pseudo-fullscreen");
  });
});
