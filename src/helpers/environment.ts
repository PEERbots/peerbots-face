export function isWebGLAvailable(): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl");
    return Boolean(gl);
  } catch (err) {
    void err;
    return false;
  }
}

export function isHeadlessOrTestEnvironment(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return true;
  }
  const ua = navigator.userAgent || "";
  if (
    ua.includes("peerbots-pa11y-ci") ||
    ua.toLowerCase().includes("jsdom") ||
    Boolean(navigator.webdriver) ||
    Boolean((window as unknown as { __VITEST_BROWSER__?: boolean }).__VITEST_BROWSER__)
  ) {
    return true;
  }
  return !isWebGLAvailable();
}
