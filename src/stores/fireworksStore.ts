import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PersistStorage, StorageValue } from 'zustand/middleware';
import { fireworksAppConfig } from '@/config/appConfig';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Runtime {
  isDesktop: boolean;
  isHeader: boolean;
  isHighEndDevice: boolean;
  defaultScaleFactor: number;
  fullscreen: boolean;
}

export interface FireworksConfig {
  quality: string;
  shell: string;
  size: string;
  wordShell: boolean;
  wordShellConfigured: boolean;
  autoLaunch: boolean;
  finale: boolean;
  skyLighting: string;
  hideControls: boolean;
  longExposure: boolean;
  scaleFactor: number;
}

export interface Background {
  mode: string;
  value: string;
  configured: boolean;
}

export interface FireworksState {
  paused: boolean;
  soundEnabled: boolean;
  menuOpen: boolean;
  openHelpTopic: string | null;
  fullscreen: boolean;
  config: FireworksConfig;
  background: Background;
}

/** Subset of state that is persisted to localStorage. */
type PersistedState = Pick<FireworksState, 'config' | 'background'>;

/** Shape written to / read from localStorage. */
type StorageFormat = {
  schemaVersion: string;
  data: PersistedState;
};

// ---------------------------------------------------------------------------
// Validation sets (mirrors original store.js)
// ---------------------------------------------------------------------------

const qualityValues = new Set(
  Object.values(fireworksAppConfig.qualityLevels).map(String),
);
const skyLightingValues = new Set(
  Object.values(fireworksAppConfig.skyLightingModes).map(String),
);
const scaleFactorValues = new Set(
  fireworksAppConfig.scaleFactorOptions.map((v) => v.toFixed(2)),
);
const shellSizeValues = new Set(['0', '1', '2', '3', '4', '5']);
const legacyStorageKey = 'schemaVersion';

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function asAllowedString(
  value: unknown,
  allowedValues: Set<string>,
  fallback: string,
): string {
  return allowedValues.has(String(value)) ? String(value) : fallback;
}

function asScaleFactor(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  const normalizedValue = parsed.toFixed(2);
  return scaleFactorValues.has(normalizedValue) ? parsed : fallback;
}

// ---------------------------------------------------------------------------
// Pure helpers (exported for testing)
// ---------------------------------------------------------------------------

export function normalizeBackground(
  rawBackground: unknown,
  fallbackBackground: Background | null,
  inferConfiguredFromValue = false,
): Background {
  const fallback: Background = fallbackBackground ?? {
    mode: 'none',
    value: '',
    configured: false,
  };

  if (!isObject(rawBackground)) {
    return { ...fallback };
  }

  const value =
    typeof rawBackground.value === 'string'
      ? (rawBackground.value as string).trim()
      : '';
  if (!value) {
    return { mode: 'none', value: '', configured: false };
  }

  return {
    mode: rawBackground.mode === 'style' ? 'style' : 'image',
    value,
    configured:
      typeof rawBackground.configured === 'boolean'
        ? rawBackground.configured
        : inferConfiguredFromValue,
  };
}

export function buildDefaultConfig(runtime: Runtime): FireworksConfig {
  let defaultShellSize = '2';
  if (runtime.isDesktop) {
    defaultShellSize = '3';
  } else if (runtime.isHeader) {
    defaultShellSize = '1.2';
  }

  return {
    quality: String(
      runtime.isHighEndDevice
        ? fireworksAppConfig.qualityLevels.high
        : fireworksAppConfig.qualityLevels.normal,
    ),
    shell: 'Random',
    size: defaultShellSize,
    wordShell: false,
    wordShellConfigured: false,
    autoLaunch: true,
    finale: true,
    skyLighting: String(fireworksAppConfig.skyLightingModes.normal),
    hideControls: runtime.isHeader,
    longExposure: false,
    scaleFactor: runtime.defaultScaleFactor,
  };
}

export function normalizeConfig(
  rawConfig: unknown,
  defaultConfig: FireworksConfig,
): FireworksConfig {
  const config = isObject(rawConfig)
    ? (rawConfig as Record<string, unknown>)
    : {};
  return {
    quality: asAllowedString(config.quality, qualityValues, defaultConfig.quality),
    shell: asString(config.shell, defaultConfig.shell),
    size: asAllowedString(config.size, shellSizeValues, defaultConfig.size),
    wordShell: asBoolean(config.wordShell, defaultConfig.wordShell),
    wordShellConfigured: asBoolean(
      config.wordShellConfigured,
      defaultConfig.wordShellConfigured,
    ),
    autoLaunch: asBoolean(config.autoLaunch, defaultConfig.autoLaunch),
    finale: asBoolean(config.finale, defaultConfig.finale),
    skyLighting: asAllowedString(
      config.skyLighting,
      skyLightingValues,
      defaultConfig.skyLighting,
    ),
    hideControls: asBoolean(config.hideControls, defaultConfig.hideControls),
    longExposure: asBoolean(config.longExposure, defaultConfig.longExposure),
    scaleFactor: asScaleFactor(config.scaleFactor, defaultConfig.scaleFactor),
  };
}

// ---------------------------------------------------------------------------
// Internal helpers (not exported)
// ---------------------------------------------------------------------------

function normalizeLegacyWordShellConfig(
  rawConfig: unknown,
  defaultConfig: FireworksConfig,
): FireworksConfig {
  return {
    ...normalizeConfig(rawConfig, defaultConfig),
    wordShell: false,
    wordShellConfigured: false,
  };
}

export function createDefaultState(runtime: Runtime): FireworksState {
  return {
    paused: true,
    soundEnabled: true,
    menuOpen: false,
    openHelpTopic: null,
    fullscreen: runtime.fullscreen,
    config: buildDefaultConfig(runtime),
    background: { mode: 'none', value: '', configured: false },
  };
}

// ---------------------------------------------------------------------------
// Custom storage adapter – keeps {schemaVersion, data} format in localStorage
// ---------------------------------------------------------------------------

/**
 * Internal state shape carried through the persist pipeline.
 * We embed `_schemaVersion` so that `merge` can decide which migration
 * path to take, then strip it before writing to disk.
 */
type StorageState = PersistedState & { readonly _schemaVersion?: string };

function createAppStorage(): PersistStorage<PersistedState> {
  return {
    getItem(name: string) {
      const raw = localStorage.getItem(name);
      if (!raw) return null;

      try {
        const parsed: unknown = JSON.parse(raw);
        if (!isObject(parsed) || !isObject((parsed as StorageFormat).data)) {
          return null;
        }
        const fmt = parsed as StorageFormat;
        return {
          state: {
            ...fmt.data,
            _schemaVersion: fmt.schemaVersion,
          } as StorageState,
          version: 0,
        };
      } catch {
        return null;
      }
    },

    setItem(name: string, value: StorageValue<PersistedState>) {
      // Strip internal field before persisting
      const { _schemaVersion: _, ...data } =
        value.state as StorageState;
      void _;
      localStorage.setItem(
        name,
        JSON.stringify({
          schemaVersion: fireworksAppConfig.storageVersion,
          data,
        } satisfies StorageFormat),
      );
    },

    removeItem(name: string) {
      localStorage.removeItem(name);
    },
  };
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export function createFireworksStore(runtime: Runtime) {
  const defaultState = createDefaultState(runtime);

  return create<FireworksState>()(
    persist(() => defaultState, {
      name: fireworksAppConfig.storageKey,
      storage: createAppStorage(),
      version: 0,
      partialize: (state): PersistedState => ({
        config: state.config,
        background: state.background,
      }),
      merge: (persistedState: unknown, currentState: FireworksState) => {
        const base = currentState;

        if (!persistedState || typeof persistedState !== 'object') {
          // No stored data – attempt legacy migration
          return applyLegacyMigration(base);
        }

        const stored = persistedState as StorageState;
        const schemaVersion = stored._schemaVersion;

        if (schemaVersion === fireworksAppConfig.storageVersion) {
          return {
            ...base,
            config: normalizeConfig(stored.config, base.config),
            background: normalizeBackground(stored.background, base.background),
          };
        }

        if (schemaVersion === '2.1' || schemaVersion === '2.0') {
          return {
            ...base,
            config: normalizeLegacyWordShellConfig(stored.config, base.config),
            background: normalizeBackground(
              stored.background,
              base.background,
              true,
            ),
          };
        }

        if (schemaVersion === '1.2' || schemaVersion === '1.1') {
          return {
            ...base,
            config: normalizeLegacyWordShellConfig(
              stored as unknown, // In 1.x data was the config directly
              base.config,
            ),
            background: { ...base.background },
          };
        }

        // Unknown version – try legacy migration
        return applyLegacyMigration(base);
      },
    }),
  );
}

function applyLegacyMigration(defaultState: FireworksState): FireworksState {
  if (localStorage.getItem(legacyStorageKey) !== '1') {
    return defaultState;
  }

  const nextState: FireworksState = {
    ...defaultState,
    config: { ...defaultState.config },
  };

  try {
    const rawSize = localStorage.getItem('configSize');
    const parsedSize = typeof rawSize === 'string' ? JSON.parse(rawSize) : null;
    const sizeValue = String(parseInt(parsedSize as string, 10));
    if (shellSizeValues.has(sizeValue)) {
      nextState.config.size = sizeValue;
    }
  } catch {
    localStorage.removeItem('configSize');
  }

  return nextState;
}
