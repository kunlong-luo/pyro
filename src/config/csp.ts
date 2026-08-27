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
 * 'unsafe-eval' was dropped and style-src no longer needs 'unsafe-inline'
 * (the two JSX `style={{...}}` usages were converted to Tailwind classes).
 */
const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self'",
  "font-src 'self' data:",
  "img-src 'self' data:",
  "audio-src 'self' data:",
  "connect-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
];

export const metaCsp = cspDirectives.join("; ");

export const headerCsp = [...cspDirectives, "frame-ancestors 'none'"].join("; ");
