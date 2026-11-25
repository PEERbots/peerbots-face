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

    // React attaches event props on custom lowercase elements via __reactProps$...
    const getProps = (el: Element): Record<string, unknown> => {
      const key = Object.keys(el).find((k) => k.startsWith("__reactProps$"));
      return key
        ? ((el as unknown as Record<string, unknown>)[key] as Record<
            string,
            unknown
          >)
        : {};
    };

    const containerProps = getProps(pixiContainer!);
    const graphicsProps = getProps(pixiGraphics!);

    expect(typeof containerProps.onPointerDown).toBe("function");
    expect(graphicsProps.onPointerDown).toBeUndefined();

    // Invoking the container handler toggles fullscreen once
    (containerProps.onPointerDown as () => void)();
    expect(toggleFullscreen).toHaveBeenCalledTimes(1);
  });
});
