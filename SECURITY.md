# Security Policy

## Supported Versions

This is a personal project with a single active release line. All security patches are applied to the latest release on `main` and the current GitHub Pages deployment. We do not backport fixes to older tags.

| Version       | Supported        |
| ------------- | ---------------- |
| latest (main) | ✅ Supported     |
| older tags    | ❌ Not supported |

## Reporting a Vulnerability

If you find a security issue, **DO NOT** open a public GitHub issue. Public disclosure could put users at risk before a fix is ready.

Instead, please use one of the following channels (in order of preference):

1. **GitHub Private Vulnerability Disclosure (recommended)**
   - Go to the repository: `NianBroken/Firework_Simulator`
   - Click **Security → Advisories → Report a vulnerability**
   - This notifies maintainers privately and allows you to work on a coordinated disclosure timeline.

2. **Email the maintainer directly**
   - Address: see the commit author email in the git log or the GitHub profile of the CODEOWNERS entry.
   - Subject line must start with `[SECURITY]` so it does not get filtered.
   - Include a link to the repository and a short summary in the first paragraph.

### What to include

Please provide enough detail to reproduce the issue without us having to ask follow-up questions:

- Affected browser(s) + version(s)
- Exact steps to trigger the issue
- A minimal reproduction case or screenshot/GIF if the issue is visual
- Whether the issue requires user interaction or can be triggered by a crafted URL (URL hash / injected background image / cross-site CSS)
- Any known mitigations (e.g., "disabling custom backgrounds avoids it")

### Response Timeline

You should receive an acknowledgement within **7 days**. If not, please re-send — your email may have been filtered.

After triage we will:

- Confirm the vulnerability and its severity (see below).
- Aim for a fix within **14 days** for Critical / High severity issues.
- Open a private draft security advisory (via GitHub Advisories) so we can discuss the fix privately, attach CVEs if warranted, and publish after the fix is deployed to GitHub Pages.
- Credit you in the published advisory (unless you prefer to remain anonymous).

## Severity Guidelines

We rate issues using a simplified interpretation of [CVSS 4.0](https://www.first.org/cvss/v4-0/):

| Severity          | Examples in this project                                                                                                                                       |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Critical**      | Remote code execution, arbitrary file read via `next.config` injection, cross-site scripting from a URL parameter (no user interaction).                       |
| **High**          | Stored XSS via uploaded/entered background CSS that persists in localStorage, CSP bypass that allows `eval()`/inline scripts, `iframe` sandbox escape.         |
| **Medium**        | Open redirect via custom background URL value, CSP headers missing a directive in the meta tag, localStorage values not sanitised causing app crash on reload. |
| **Low**           | Minor info leak (e.g. file system path in a build error), minor CSP warning in devtools, CORS preflight issue that browsers already block.                     |
| **Informational** | Best-practice suggestions that do not have a real-world impact (e.g. "consider adding HSTS").                                                                  |

## Scope

**In scope:**

- Client-side code in the deployed GitHub Pages app — any JavaScript, HTML, CSS, or Web Audio / Canvas / Fullscreen usage that could allow XSS, clickjacking, origin confusion, etc.
- GitHub Actions workflows (`ci.yml`, `deploy.yml`) — supply-chain / command-injection concerns.
- The custom-background `url(...)` / `linear-gradient(...)` parser and CSS-value injection path.
- CSP configuration in `src/config/csp.ts` and the `<meta>` tag in `src/app/layout.tsx`.

**Out of scope:**

- Vulnerabilities in upstream dependencies (Next.js, React, Zustand, Playwright…) — report those to their maintainers, then open a low-severity issue here asking us to bump the dependency version.
- Self-XSS that requires a user to manually type something into their own DevTools console.
- Social engineering attacks against maintainers.
- Denial-of-service attacks against the GitHub Pages static host (rate-limiting is handled by GitHub).

## Safe Harbor

We will **not** take legal action or ask GitHub to take down your account if you:

- Make a good-faith effort to avoid privacy violations, data destruction, and interruption of the service (e.g., don't actually run a DoS against GitHub Pages to prove it's possible).
- Use the Private Vulnerability Disclosure channel above rather than posting a public PoC before a fix is live.
- Don't exploit the vulnerability for personal gain (e.g., don't mine cryptocurrency or exfiltrate other users' settings).

This safe-harbor clause intentionally mirrors GitHub's [Coordinated Disclosure Policy](https://github.com/security#disclosure-policy).
