import "@testing-library/jest-dom/vitest";
import "vitest-axe/extend-expect";
import { cleanup } from "@testing-library/react";
import * as matchers from "vitest-axe/matchers";
import { afterEach, expect } from "vitest";

declare module "vitest" {
  interface Assertion {
    toHaveNoViolations(): void;
  }
  interface AsymmetricMatchersContaining {
    toHaveNoViolations(): void;
  }
}

expect.extend(matchers);

afterEach(() => {
  cleanup();
});

if (typeof HTMLCanvasElement !== "undefined") {
  HTMLCanvasElement.prototype.getContext = (() =>
    null) as unknown as typeof HTMLCanvasElement.prototype.getContext;
}

if (
  typeof window !== "undefined" &&
  typeof window.PointerEvent === "undefined"
) {
  window.PointerEvent = MouseEvent as unknown as typeof PointerEvent;
}

if (typeof URL !== "undefined") {
  if (typeof URL.createObjectURL !== "function") {
    let counter = 0;
    URL.createObjectURL = () => `blob:peerbots-test-${++counter}`;
  }
  if (typeof URL.revokeObjectURL !== "function") {
    URL.revokeObjectURL = () => undefined;
  }
}
