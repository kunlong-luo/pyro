/*
Copyright © 2022 NianBroken. All rights reserved.
Github: https://github.com/NianBroken/Firework_Simulator
Gitee: https://gitee.com/nianbroken/Firework_Simulator

Licensed under Apache-2.0. You are free to use, modify, and distribute this code,
provided that you retain the original license and copyright notice in derivative works
and publish any modifications under the same license.
*/

type FullscreenEventHandler = ((event: Event) => void) | null;

export interface Fscreen {
  requestFullscreen(element: Element): void;
  requestFullscreenFunction(element: Element): (() => void) | undefined;
  readonly exitFullscreen: () => void;
  addEventListener(
    type: string,
    handler: EventListener,
    options?: boolean | AddEventListenerOptions,
  ): void;
  removeEventListener(type: string, handler: EventListener): void;
  readonly fullscreenEnabled: boolean;
  readonly fullscreenElement: Element | null;
  onfullscreenchange: FullscreenEventHandler;
  onfullscreenerror: FullscreenEventHandler;
}

const keyIndex = {
  fullscreenEnabled: 0,
  fullscreenElement: 1,
  requestFullscreen: 2,
  exitFullscreen: 3,
  fullscreenchange: 4,
  fullscreenerror: 5,
} as const;

const vendorMaps: string[][] = [
  Object.keys(keyIndex),
  [
    "webkitFullscreenEnabled",
    "webkitFullscreenElement",
    "webkitRequestFullscreen",
    "webkitExitFullscreen",
    "webkitfullscreenchange",
    "webkitfullscreenerror",
  ],
  [
    "mozFullScreenEnabled",
    "mozFullScreenElement",
    "mozRequestFullScreen",
    "mozCancelFullScreen",
    "mozfullscreenchange",
    "mozfullscreenerror",
  ],
  [
    "msFullscreenEnabled",
    "msFullscreenElement",
    "msRequestFullscreen",
    "msExitFullscreen",
    "MSFullscreenChange",
    "MSFullscreenError",
  ],
];

// Handle non-browser environments gracefully
const doc: Document | Record<string, never> = typeof document !== "undefined" ? document : {};
const vendor: string[] = vendorMaps.find((map) => map[0] in doc) || [];

// Cast for dynamic vendor-prefixed property access
const dynamicDoc = doc as Record<string, unknown>;

export const fscreen: Fscreen = {
  requestFullscreen(element) {
    const method = vendor[keyIndex.requestFullscreen] as keyof Element;
    (element[method] as () => void)();
  },
  requestFullscreenFunction(element) {
    const method = vendor[keyIndex.requestFullscreen] as keyof Element;
    return element[method] as (() => void) | undefined;
  },
  get exitFullscreen() {
    const method = vendor[keyIndex.exitFullscreen] as keyof Document;
    return (dynamicDoc[method] as () => void).bind(dynamicDoc);
  },
  addEventListener(type, handler, options) {
    const eventType = vendor[keyIndex[type as keyof typeof keyIndex]] as string;
    doc.addEventListener(eventType, handler, options);
  },
  removeEventListener(type, handler) {
    const eventType = vendor[keyIndex[type as keyof typeof keyIndex]] as string;
    doc.removeEventListener(eventType, handler);
  },
  get fullscreenEnabled() {
    return Boolean(dynamicDoc[vendor[keyIndex.fullscreenEnabled]]);
  },
  get fullscreenElement() {
    return dynamicDoc[vendor[keyIndex.fullscreenElement]] as Element | null;
  },
  get onfullscreenchange() {
    const eventName = `on${vendor[keyIndex.fullscreenchange]}`.toLowerCase();
    return dynamicDoc[eventName] as FullscreenEventHandler;
  },
  set onfullscreenchange(handler) {
    const eventName = `on${vendor[keyIndex.fullscreenchange]}`.toLowerCase();
    dynamicDoc[eventName] = handler;
  },
  get onfullscreenerror() {
    const eventName = `on${vendor[keyIndex.fullscreenerror]}`.toLowerCase();
    return dynamicDoc[eventName] as FullscreenEventHandler;
  },
  set onfullscreenerror(handler) {
    const eventName = `on${vendor[keyIndex.fullscreenerror]}`.toLowerCase();
    dynamicDoc[eventName] = handler;
  },
};
