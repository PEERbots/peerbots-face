import { useCallback, useLayoutEffect, useState } from "react";
import { useExtend } from "@pixi/react";
import { Container, Graphics, Rectangle } from "pixi.js";
import { iconPaths } from "@peerbots/core";

export function FaceScrollToTopButton() {
  useExtend({ Graphics, Container });

  const [xPos, setXPos] = useState<number>(() =>
    typeof window !== "undefined" ? window.innerWidth - 50 : 750,
  );

  const scrollToTop = useCallback(() => {
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }
  }, []);

  useLayoutEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const calculatePositionBasedOnWindow = () => {
      setXPos(window.innerWidth - 50);
    };

    const orientation =
      typeof screen !== "undefined" ? screen.orientation : undefined;
    orientation?.addEventListener("change", calculatePositionBasedOnWindow);
    window.addEventListener("resize", calculatePositionBasedOnWindow);

    return () => {
      orientation?.removeEventListener("change", calculatePositionBasedOnWindow);
      window.removeEventListener("resize", calculatePositionBasedOnWindow);
    };
  }, []);

  const drawChevron = useCallback((graphics: Graphics) => {
    graphics.clear();
    graphics.svg(`
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="black">
        <path strokeLinecap="round" strokeLinejoin="round" d="${iconPaths.chevronUpSmall}" />
      </svg>
    `);
  }, []);

  return (
    <pixiContainer
      label="ScrollToTopButton"
      x={xPos}
      y={20}
      eventMode="static"
      onPointerDown={scrollToTop}
      hitArea={new Rectangle(0, 0, 50, 50)}
    >
      <pixiGraphics
        onPointerDown={scrollToTop}
        eventMode="static"
        draw={drawChevron}
      />
    </pixiContainer>
  );
}

export default FaceScrollToTopButton;
