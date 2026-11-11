import type { PixiElements } from "@pixi/react";

declare module "react" {
  // Augment React 19 JSX IntrinsicElements with @pixi/react v8 elements
  namespace JSX {
    interface IntrinsicElements extends PixiElements {
      pixiContainer: PixiElements["pixiContainer"];
    }
  }
}

export type { PixiElements };
