/**
 * Shared between next.config.ts (HTTP header) and src/app/layout.tsx (meta
 * tag). `frame-ancestors` is deliberately kept out of this shared list: it's
 * invalid in a <meta http-equiv> CSP (silently ignored by browsers per spec)
 * and only added on the header variant below.
 *
 * script-src needs 'unsafe-inline' for the inline `self.__next_f.push(...)`
 * RSC hydration payload Next.js emits into the static HTML — there's no
 * server here to hand out per-request nonces. Verified against the actual
 * `out/` build output that no other inline script or `eval()` exists, so
 * 'unsafe-eval' is dropped for PRODUCTION. In development, React's dev build
 * calls `eval()` to reconstruct callstacks, so 'unsafe-eval' is added back
 * only when `NODE_ENV === "development"` — the production export stays strict.
 *
 * No `media-src`: src/fireworks/audio.ts has no `<audio>`/`<video>` element
 * to gate — it loads sound effects via `fetch()` + Web Audio `decodeAudioData`,
 * already covered by `connect-src`. The list used to carry a non-standard
 * `audio-src` directive that no browser recognizes (CSP silently ignores
 * unknown directives), so it was never doing anything either way.
 */
const allowDevEval = process.env.NODE_ENV === "development";
const scriptSrc = allowDevEval ? "'self' 'unsafe-inline' 'unsafe-eval'" : "'self' 'unsafe-inline'";

const cspDirectives = [
  "default-src 'self'",
  `script-src ${scriptSrc}`,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' data:",
  "connect-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
];

export const metaCsp = cspDirectives.join("; ");

export const headerCsp = [...cspDirectives, "frame-ancestors 'none'"].join("; ");
