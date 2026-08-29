/*
Copyright © 2022 NianBroken. All rights reserved.
Github：https://github.com/NianBroken/Firework_Simulator
Gitee：https://gitee.com/nianbroken/Firework_Simulator
本项目采用 Apache-2.0 许可证
简而言之，你可以自由使用、修改和分享本项目的代码，但前提是在其衍生作品中必须保留原始许可证和版权信息，并且必须以相同的许可证发布所有修改过的代码。
*/

import { MyMath } from "@/lib/math";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SoundType = "lift" | "burst" | "burstSmall" | "crackle" | "crackleSmall";

export interface SoundSource {
  volume: number;
  playbackRateMin: number;
  playbackRateMax: number;
  fileNames: string[];
  rawBuffers?: ArrayBuffer[];
  buffers?: AudioBuffer[];
}

export type SoundSources = Record<SoundType, SoundSource>;

export interface SoundManagerDeps {
  /** Returns whether sound is currently allowed (soundEnabled && isRunning). */
  getCanPlaySound: () => boolean;
  /** Returns the current simulation speed. */
  getSimSpeed: () => number;
}

export interface SoundManager {
  readonly baseURL: string;
  readonly sources: SoundSources;
  registerInteraction(): void;
  ensureContext(): AudioContext;
  preload(): Promise<ArrayBuffer[]>;
  pauseAll(): void;
  resumeAll(): void;
  playSound(type: SoundType, scale?: number): void;
}

// ---------------------------------------------------------------------------
// Sources config – values frozen from original JS
// ---------------------------------------------------------------------------

function createDefaultSources(): SoundSources {
  return {
    lift: {
      volume: 1,
      playbackRateMin: 0.85,
      playbackRateMax: 0.95,
      fileNames: ["lift1.mp3", "lift2.mp3", "lift3.mp3"],
    },
    burst: {
      volume: 1,
      playbackRateMin: 0.8,
      playbackRateMax: 0.9,
      fileNames: ["burst1.mp3", "burst2.mp3"],
    },
    burstSmall: {
      volume: 0.25,
      playbackRateMin: 0.8,
      playbackRateMax: 1,
      fileNames: ["burst-sm-1.mp3", "burst-sm-2.mp3"],
    },
    crackle: {
      volume: 0.2,
      playbackRateMin: 1,
      playbackRateMax: 1,
      fileNames: ["crackle1.mp3"],
    },
    crackleSmall: {
      volume: 0.3,
      playbackRateMin: 1,
      playbackRateMax: 1,
      fileNames: ["crackle-sm-1.mp3"],
    },
  };
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createSoundManager(deps: SoundManagerDeps): SoundManager {
  const baseURL = "./audio/";
  let ctx: AudioContext | null = null;
  let userInteracted = false;
  let decodePromise: Promise<void[]> | null = null;
  let lastSmallBurstTime = 0;
  const sources = createDefaultSources();

  function ensureContext(): AudioContext {
    if (!ctx) {
      ctx = new (
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      )();
    }

    if (!decodePromise) {
      decodePromise = decodeBuffers();
    }

    return ctx;
  }

  async function decodeBuffers(): Promise<void[]> {
    const context = ctx;
    const tasks: Promise<void>[] = [];

    for (const type of Object.keys(sources) as SoundType[]) {
      const source = sources[type];
      const rawBuffers = source.rawBuffers ?? [];
      if (rawBuffers.length === 0) {
        source.buffers = [];
        continue;
      }

      const decodeTasks = rawBuffers.map(
        (rawBuffer) =>
          new Promise<AudioBuffer>((resolve, reject) => {
            context!.decodeAudioData(rawBuffer.slice(0), resolve, reject);
          }),
      );

      tasks.push(
        Promise.all(decodeTasks).then((buffers) => {
          source.buffers = buffers;
        }),
      );
    }

    return Promise.all(tasks).catch(() => {
      for (const type of Object.keys(sources) as SoundType[]) {
        sources[type].buffers = sources[type].buffers ?? [];
      }
      return [] as void[];
    });
  }

  const manager: SoundManager = {
    baseURL,
    sources,

    registerInteraction(): void {
      if (userInteracted) {
        return;
      }

      userInteracted = true;
      ensureContext();
      manager.resumeAll();
    },

    ensureContext,

    preload(): Promise<ArrayBuffer[]> {
      const requests: Promise<ArrayBuffer>[] = [];

      const ensureSuccessfulResponse = (response: Response): Response => {
        if (response.ok) {
          return response;
        }

        throw new Error(response.statusText);
      };

      for (const type of Object.keys(sources) as SoundType[]) {
        const source = sources[type];
        const sourceRequests = source.fileNames.map((fileName) =>
          fetch(baseURL + fileName)
            .then(ensureSuccessfulResponse)
            .then((response) => response.arrayBuffer()),
        );

        Promise.all(sourceRequests)
          .then((buffers) => {
            source.rawBuffers = buffers;
          })
          .catch((err) => {
            // Swallowed here: the same underlying request promises are also
            // in `requests` below, so the failure is still surfaced through
            // the Promise.all(requests) this function returns. Without this
            // catch, a failed fetch would produce a second, unhandled
            // rejection on this separate derived promise.
            // Log for debugging — do not remove.
            console.warn(`[SoundManager] Failed to preload audio for ${type}:`, err);
          });
        requests.push(...sourceRequests);
      }

      return Promise.all(requests);
    },

    pauseAll(): void {
      if (ctx) {
        ctx.suspend().catch(() => {});
      }
    },

    resumeAll(): void {
      if (!userInteracted) {
        return;
      }

      ensureContext();
      manager.playSound("lift", 0);
      setTimeout(() => {
        if (ctx) {
          ctx.resume().catch(() => {});
        }
      }, 250);
    },

    playSound(type, scale = 1): void {
      scale = MyMath.clamp(scale, 0, 1);
      if (!deps.getCanPlaySound() || deps.getSimSpeed() < 0.95 || !userInteracted) {
        return;
      }

      if (type === "burstSmall") {
        const now = Date.now();
        if (now - lastSmallBurstTime < 20) {
          return;
        }
        lastSmallBurstTime = now;
      }

      const source = sources[type];
      if (!source) {
        throw new Error(`不存在声音类型: ${type}`);
      }

      ensureContext();
      if (!source.buffers || source.buffers.length === 0) {
        return;
      }

      const initialVolume = source.volume;
      const initialPlaybackRate = MyMath.random(source.playbackRateMin, source.playbackRateMax);
      const scaledVolume = initialVolume * scale;
      const scaledPlaybackRate = initialPlaybackRate * (2 - scale);
      const gainNode = ctx!.createGain();
      gainNode.gain.value = scaledVolume;

      const buffer = MyMath.randomChoice(source.buffers) as AudioBuffer;
      const bufferSource = ctx!.createBufferSource();
      bufferSource.playbackRate.value = scaledPlaybackRate;
      bufferSource.buffer = buffer;
      bufferSource.connect(gainNode);
      gainNode.connect(ctx!.destination);
      bufferSource.onended = () => {
        bufferSource.disconnect();
        gainNode.disconnect();
      };
      bufferSource.start(0);
    },
  };

  return manager;
}
