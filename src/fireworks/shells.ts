/**
 * Barrel re-export — all shell logic lives in ./shells/.
 * This file preserves backward compatibility for existing imports:
 *   import { ... } from "@/fireworks/shells"
 */
export * from "./shells/index";
