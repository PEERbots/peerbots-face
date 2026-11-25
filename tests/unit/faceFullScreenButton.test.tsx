import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { FaceFullscreenContext, type FullscreenState } from "../../src";

vi.mock("@pixi/react", () => ({
  useApplication: () => ({ app: { canvas: null } }),
  useExtend: () => undefined,
}));

vi.mock("pixi.js", () => ({
  Container: class {},
  Graphics: class {},
  Rectangle: class {
    constructor(
      public x: number,
      public y: number,
      public width: number,
      public height: number,
    ) {}
  },
}));

import { FaceFullScreenButton } from "../../src/components/FaceFullScreenButton";
import { FaceScrollToTopButton } from "../../src/components/FaceScrollToTopButton";

function getReactProps(el: Element): Record<string, unknown> {
  const key = Object.keys(el).find((k) => k.startsWith("__reactProps$"));
  return key
    ? ((el as unknown as Record<string, unknown>)[key] as Record<
        string,
        unknown
      >)
    : {};
}

describe("FaceFullScreenButton", () => {
  it("attaches onPointerDown only to pixiContainer and not pixiGraphics so clicks toggle fullscreen once", () => {
    const toggleFullscreen = vi.fn().mockResolvedValue(undefined);
    const contextValue: FullscreenState = {
      isFullscreen: false,
      isPseudoFullscreen: false,
      enterFullscreen: vi.fn().mockResolvedValue(undefined),
      exitFullscreen: vi.fn().mockResolvedValue(undefined),
      toggleFullscreen,
    };

    const { container } = render(
      <FaceFullscreenContext.Provider value={contextValue}>
        <FaceFullScreenButton />
      </FaceFullscreenContext.Provider>,
    );

    const pixiContainer = container.querySelector("pixicontainer");
    const pixiGraphics = container.querySelector("pixigraphics");
    expect(pixiContainer).not.toBeNull();
    expect(pixiGraphics).not.toBeNull();

    const containerProps = getReactProps(pixiContainer!);
    const graphicsProps = getReactProps(pixiGraphics!);

    expect(typeof containerProps.onPointerDown).toBe("function");
    expect(graphicsProps.onPointerDown).toBeUndefined();

    // Invoking the container handler toggles fullscreen once
    (containerProps.onPointerDown as () => void)();
    expect(toggleFullscreen).toHaveBeenCalledTimes(1);
  });
});

describe("FaceScrollToTopButton", () => {
  it("exits fullscreen via context before scrolling to top and attaches onPointerDown only to pixiContainer", async () => {
    const scrollToSpy = vi
      .spyOn(window, "scrollTo")
      .mockImplementation(() => {});
    const exitFullscreen = vi.fn().mockResolvedValue(undefined);
    const contextValue: FullscreenState = {
      isFullscreen: true,
      isPseudoFullscreen: true,
      enterFullscreen: vi.fn().mockResolvedValue(undefined),
      exitFullscreen,
      toggleFullscreen: vi.fn().mockResolvedValue(undefined),
    };

    try {
      const { container } = render(
        <FaceFullscreenContext.Provider value={contextValue}>
          <FaceScrollToTopButton />
        </FaceFullscreenContext.Provider>,
      );

      const pixiContainer = container.querySelector("pixicontainer");
      const pixiGraphics = container.querySelector("pixigraphics");
      expect(pixiContainer).not.toBeNull();
      expect(pixiGraphics).not.toBeNull();

      const containerProps = getReactProps(pixiContainer!);
      const graphicsProps = getReactProps(pixiGraphics!);

      expect(typeof containerProps.onPointerDown).toBe("function");
      expect(graphicsProps.onPointerDown).toBeUndefined();

      (containerProps.onPointerDown as () => void)();

      await vi.waitFor(() => {
        expect(exitFullscreen).toHaveBeenCalledTimes(1);
        expect(scrollToSpy).toHaveBeenCalledWith(0, 0);
      });
    } finally {
      scrollToSpy.mockRestore();
    }
  });

  it("exits native fullscreen when no context is provided and document.fullscreenElement is active", async () => {
    const scrollToSpy = vi
      .spyOn(window, "scrollTo")
      .mockImplementation(() => {});
    const exitNativeSpy = vi.fn().mockResolvedValue(undefined);
    const fsEl = document.createElement("div");

    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      value: fsEl,
    });
    Object.defineProperty(document, "exitFullscreen", {
      configurable: true,
      value: exitNativeSpy,
    });

    try {
      const { container } = render(<FaceScrollToTopButton />);
      const pixiContainer = container.querySelector("pixicontainer");
      const containerProps = getReactProps(pixiContainer!);

      (containerProps.onPointerDown as () => void)();

      await vi.waitFor(() => {
        expect(exitNativeSpy).toHaveBeenCalledTimes(1);
        expect(scrollToSpy).toHaveBeenCalledWith(0, 0);
      });
    } finally {
      Object.defineProperty(document, "fullscreenElement", {
        configurable: true,
        value: null,
      });
      scrollToSpy.mockRestore();
    }
  });
});
