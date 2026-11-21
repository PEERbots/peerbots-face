/**
 * Cross-browser Fullscreen API helpers supporting standard and vendor-prefixed
 * (`webkit`, `moz`, `ms`) implementations without unsafe `any` casts.
 */

export interface VendorFullscreenElement extends Element {
  webkitRequestFullscreen?: () => Promise<void> | void;
  mozRequestFullScreen?: () => Promise<void> | void;
  msRequestFullscreen?: () => Promise<void> | void;
}

export interface VendorFullscreenDocument extends Document {
  webkitFullscreenElement?: Element | null;
  mozFullScreenElement?: Element | null;
  msFullscreenElement?: Element | null;
  webkitFullscreenEnabled?: boolean;
  mozFullScreenEnabled?: boolean;
  msFullscreenEnabled?: boolean;
  webkitExitFullscreen?: () => Promise<void> | void;
  mozCancelFullScreen?: () => Promise<void> | void;
  msExitFullscreen?: () => Promise<void> | void;
}

const FULLSCREEN_CHANGE_EVENTS = [
  "fullscreenchange",
  "webkitfullscreenchange",
  "mozfullscreenchange",
  "MSFullscreenChange",
] as const;

export function getFullscreenElement(
  doc: Document | undefined = typeof document !== "undefined"
    ? document
    : undefined,
): Element | null {
  if (!doc) return null;
  const vendorDoc = doc as VendorFullscreenDocument;
  return (
    vendorDoc.fullscreenElement ??
    vendorDoc.webkitFullscreenElement ??
    vendorDoc.mozFullScreenElement ??
    vendorDoc.msFullscreenElement ??
    null
  );
}

export function isNativeFullscreenSupported(
  element?: Element | null,
  doc: Document | undefined = typeof document !== "undefined"
    ? document
    : undefined,
): boolean {
  if (!doc) return false;
  const vendorDoc = doc as VendorFullscreenDocument;
  const enabledFlag =
    vendorDoc.fullscreenEnabled ??
    vendorDoc.webkitFullscreenEnabled ??
    vendorDoc.mozFullScreenEnabled ??
    vendorDoc.msFullscreenEnabled;

  if (enabledFlag === false) {
    return false;
  }

  const target = (element ?? doc.documentElement) as VendorFullscreenElement | null;
  if (!target) return false;

  return Boolean(
    typeof target.requestFullscreen === "function" ||
      typeof target.webkitRequestFullscreen === "function" ||
      typeof target.mozRequestFullScreen === "function" ||
      typeof target.msRequestFullscreen === "function",
  );
}

export async function requestNativeFullscreen(element: Element): Promise<void> {
  const vendorEl = element as VendorFullscreenElement;
  if (typeof vendorEl.requestFullscreen === "function") {
    await vendorEl.requestFullscreen();
    return;
  }
  if (typeof vendorEl.webkitRequestFullscreen === "function") {
    await vendorEl.webkitRequestFullscreen();
    return;
  }
  if (typeof vendorEl.mozRequestFullScreen === "function") {
    await vendorEl.mozRequestFullScreen();
    return;
  }
  if (typeof vendorEl.msRequestFullscreen === "function") {
    await vendorEl.msRequestFullscreen();
    return;
  }
  throw new Error("Native Fullscreen API is not supported on this element");
}

export async function exitNativeFullscreen(
  doc: Document | undefined = typeof document !== "undefined"
    ? document
    : undefined,
): Promise<void> {
  if (!doc) return;
  const vendorDoc = doc as VendorFullscreenDocument;
  if (typeof vendorDoc.exitFullscreen === "function") {
    await vendorDoc.exitFullscreen();
    return;
  }
  if (typeof vendorDoc.webkitExitFullscreen === "function") {
    await vendorDoc.webkitExitFullscreen();
    return;
  }
  if (typeof vendorDoc.mozCancelFullScreen === "function") {
    await vendorDoc.mozCancelFullScreen();
    return;
  }
  if (typeof vendorDoc.msExitFullscreen === "function") {
    await vendorDoc.msExitFullscreen();
  }
}

export function addFullscreenChangeListener(
  listener: EventListener,
  doc: Document | undefined = typeof document !== "undefined"
    ? document
    : undefined,
): () => void {
  if (!doc) {
    return () => undefined;
  }
  for (const eventName of FULLSCREEN_CHANGE_EVENTS) {
    doc.addEventListener(eventName, listener);
  }
  return () => {
    for (const eventName of FULLSCREEN_CHANGE_EVENTS) {
      doc.removeEventListener(eventName, listener);
    }
  };
}
