import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import {
  addFullscreenChangeListener,
  exitNativeFullscreen,
  getFullscreenElement,
  isNativeFullscreenSupported,
  requestNativeFullscreen,
} from "../helpers/fullscreen";

export interface UseFullscreenOptions {
  /** Called whenever fullscreen state changes (native or CSS pseudo-fullscreen). */
  onFullscreenChange?: (isFullscreen: boolean) => void;
}

export interface FullscreenState {
  /** Whether the target is currently fullscreen (either native or pseudo-fullscreen). */
  isFullscreen: boolean;
  /** Whether CSS pseudo-fullscreen fallback is currently active. */
  isPseudoFullscreen: boolean;
  enterFullscreen: () => Promise<void>;
  exitFullscreen: () => Promise<void>;
  toggleFullscreen: () => Promise<void>;
}

export const FaceFullscreenContext = createContext<FullscreenState | null>(null);

export function useFaceFullscreenContext(): FullscreenState | null {
  return useContext(FaceFullscreenContext);
}

/**
 * Manages fullscreen state for a target container element with automatic
 * fallback to CSS pseudo-fullscreen when native Fullscreen API is unavailable
 * (e.g. iPhone Safari) or rejected.
 */
export function useFullscreen(
  targetRef: RefObject<HTMLElement | null>,
  options: UseFullscreenOptions = {},
): FullscreenState {
  const { onFullscreenChange } = options;
  const [isNativeFullscreen, setIsNativeFullscreen] = useState(false);
  const [isPseudoFullscreen, setIsPseudoFullscreen] = useState(false);
  const previousBodyOverflowRef = useRef<string | null>(null);
  const onChangeRef = useRef(onFullscreenChange);
  onChangeRef.current = onFullscreenChange;

  const isFullscreen = isNativeFullscreen || isPseudoFullscreen;

  const prevReportedRef = useRef<boolean>(false);
  useEffect(() => {
    if (prevReportedRef.current !== isFullscreen) {
      prevReportedRef.current = isFullscreen;
      onChangeRef.current?.(isFullscreen);
    }
  }, [isFullscreen]);

  // Track native fullscreen changes scoped to this target element
  useEffect(() => {
    const syncNative = () => {
      const fsEl = getFullscreenElement();
      const target = targetRef.current;
      const active = Boolean(
        fsEl &&
          (!target ||
            fsEl === target ||
            target.contains(fsEl) ||
            fsEl.contains(target)),
      );
      setIsNativeFullscreen(active);
    };
    syncNative();
    return addFullscreenChangeListener(syncNative);
  }, [targetRef]);

  // Lock body scroll and bind Escape key while CSS pseudo-fullscreen is active
  useEffect(() => {
    if (!isPseudoFullscreen || typeof document === "undefined") {
      return;
    }
    previousBodyOverflowRef.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsPseudoFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (previousBodyOverflowRef.current !== null) {
        document.body.style.overflow = previousBodyOverflowRef.current;
        previousBodyOverflowRef.current = null;
      }
    };
  }, [isPseudoFullscreen]);

  const enterFullscreen = useCallback(async () => {
    const target = targetRef.current;
    if (!target) {
      return;
    }

    if (isNativeFullscreenSupported(target)) {
      try {
        await requestNativeFullscreen(target);
        setIsNativeFullscreen(true);
        return;
      } catch (err) {
        console.warn(
          "Native fullscreen request failed; falling back to CSS pseudo-fullscreen:",
          err,
        );
      }
    }

    setIsPseudoFullscreen(true);
  }, [targetRef]);

  const exitFullscreen = useCallback(async () => {
    if (isPseudoFullscreen) {
      setIsPseudoFullscreen(false);
    }
    if (getFullscreenElement()) {
      try {
        await exitNativeFullscreen();
      } catch (err) {
        console.warn("Exit fullscreen error:", err);
      }
    }
    setIsNativeFullscreen(false);
  }, [isPseudoFullscreen]);

  const toggleFullscreen = useCallback(async () => {
    if (isFullscreen || Boolean(getFullscreenElement())) {
      await exitFullscreen();
    } else {
      await enterFullscreen();
    }
  }, [isFullscreen, exitFullscreen, enterFullscreen]);

  return useMemo(
    () => ({
      isFullscreen,
      isPseudoFullscreen,
      enterFullscreen,
      exitFullscreen,
      toggleFullscreen,
    }),
    [
      isFullscreen,
      isPseudoFullscreen,
      enterFullscreen,
      exitFullscreen,
      toggleFullscreen,
    ],
  );
}
