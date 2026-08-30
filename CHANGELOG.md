# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- Reorganize images: move `Image_Preview.png` to `public/images/preview.png`
- Remove duplicate `public/favicon.png` (keep `public/images/favicon.png`)
- Update `.gitignore` with editor caches and temp files
- Update `package.json` metadata (author, homepage, bugs, repository)
- Fix ESLint config: remove duplicate `prettierConfig`, correct ignore filename
- Remove unnecessary `pnpm-workspace.yaml`
- Clean up `tsconfig.json`: remove `allowJs` (no JS files in project)

## [0.2.0] - 2026-08-30

### Added
- Deploy to both GitHub Pages and Vercel with conditional config
- `NEXT_PUBLIC_DEPLOY_TARGET` env var to distinguish deployment targets

### Fixed
- Per-color bucket aliasing bug causing all-white fireworks (`simulation.ts`)
- `floralShell` color bug - was returning 'random' string literal
- Prettier formatting in `layout.tsx`

### Changed
- Restore static export for GitHub Pages deployment
- Conditional `basePath` for Vercel vs GitHub Pages
- Rename `postcss.config.js` to `.mjs` (CJS to ESM)
- Suppress hydration warning in `layout.tsx`
- Add style-src sha256 hash to CSP

### Docs
- Update README with correct repo info and links
- Remove 6 unnecessary README sections (Shell gallery, Menu Options, Browser Support, Configuration, Roadmap, Credits)

## [0.1.0] - 2026-08-29

### Added
- Initial TypeScript + Next.js rewrite of Firework Simulator
- 12 shell types with realistic 2D particle physics
- Web Audio engine with preloaded mp3 buffers
- Text (word-burst) fireworks with Chinese character lattice
- Custom backgrounds (image URL or CSS syntax)
- Automatic quality detection based on device capabilities
- Dual-canvas rendering with long-exposure trails
- Dynamic sky lighting on burst

### Features
- **Shell Types**: Chrysanthemum, Ghost, Strobe, Palm, Ring, Crossette, Floral, Falling Leaves, Willow, Crackle, Horse Tail, Random
- **Auto-launch Sequences**: 6 sequences including 32-shot finale
- **Responsive Design**: Works on mobile down to 375px wide
- **Persisted Settings**: Zustand with versioned schema migration
- **Zero Backend**: Pure static export, hosts anywhere

### Technical
- Next.js 16 (App Router, Turbopack)
- React 19 + TypeScript 6 (strict mode)
- Tailwind CSS 4
- Zustand 5 for state management
- Canvas 2D rendering with DPR-aware scaling
- Web Audio API for sound effects
- Vitest + Playwright for testing
- ESLint 9 + Prettier for code quality

[Unreleased]: https://github.com/kunlong-luo/pyro/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/kunlong-luo/pyro/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/kunlong-luo/pyro/releases/tag/v0.1.0
