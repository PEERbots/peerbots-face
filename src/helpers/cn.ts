import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const faceTwMerge = extendTailwindMerge({
  experimentalParseClassName({ className, parseClassName }) {
    if (className.startsWith("pbf:")) {
      return parseClassName(className.slice(4));
    }
    if (className.startsWith("pb:")) {
      return parseClassName(className.slice(3));
    }
    return parseClassName(className);
  },
});

export function faceCn(...inputs: ClassValue[]) {
  return faceTwMerge(clsx(inputs));
}
