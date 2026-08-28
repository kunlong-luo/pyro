// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";

/**
 * IS_MOBILE/IS_DESKTOP/IS_HEADER/IS_HIGH_END_DEVICE are computed once at
 * module load time from window.innerWidth/innerHeight/navigator
 * .hardwareConcurrency. To test different device shapes we have to stub
 * those globals *before* a fresh import of the module for each scenario.
 */
async function loadDeviceModule(overrides: {
  innerWidth: number;
  innerHeight?: number;
  hardwareConcurrency?: number;
}) {
  vi.resetModules();
  Object.defineProperty(window, "innerWidth", { value: overrides.innerWidth, configurable: true });
  Object.defineProperty(window, "innerHeight", {
    value: overrides.innerHeight ?? 800,
    configurable: true,
  });
  Object.defineProperty(navigator, "hardwareConcurrency", {
    value: overrides.hardwareConcurrency,
    configurable: true,
  });
  return import("./device");
}

afterEach(() => {
  vi.resetModules();
});

describe("device detection", () => {
  it("classifies a narrow viewport as mobile, not desktop", async () => {
    const device = await loadDeviceModule({ innerWidth: 400 });
    expect(device.IS_MOBILE).toBe(true);
    expect(device.IS_DESKTOP).toBe(false);
  });

  it("classifies a wide viewport as desktop, not mobile", async () => {
    const device = await loadDeviceModule({ innerWidth: 1200 });
    expect(device.IS_MOBILE).toBe(false);
    expect(device.IS_DESKTOP).toBe(true);
  });

  it("treats a mid-range width (641-800) as neither mobile nor desktop", async () => {
    const device = await loadDeviceModule({ innerWidth: 700 });
    expect(device.IS_MOBILE).toBe(false);
    expect(device.IS_DESKTOP).toBe(false);
  });

  it("is a header only when desktop-wide and short", async () => {
    const header = await loadDeviceModule({ innerWidth: 1200, innerHeight: 200 });
    expect(header.IS_HEADER).toBe(true);

    const tallDesktop = await loadDeviceModule({ innerWidth: 1200, innerHeight: 800 });
    expect(tallDesktop.IS_HEADER).toBe(false);

    const shortMobile = await loadDeviceModule({ innerWidth: 400, innerHeight: 200 });
    expect(shortMobile.IS_HEADER).toBe(false);
  });

  it("requires >= 8 cores as high-end on a wide viewport", async () => {
    const sevenCores = await loadDeviceModule({ innerWidth: 1200, hardwareConcurrency: 7 });
    expect(sevenCores.IS_HIGH_END_DEVICE).toBe(false);

    const eightCores = await loadDeviceModule({ innerWidth: 1200, hardwareConcurrency: 8 });
    expect(eightCores.IS_HIGH_END_DEVICE).toBe(true);
  });

  it("only requires >= 4 cores as high-end on a narrow viewport", async () => {
    const threeCores = await loadDeviceModule({ innerWidth: 800, hardwareConcurrency: 3 });
    expect(threeCores.IS_HIGH_END_DEVICE).toBe(false);

    const fourCores = await loadDeviceModule({ innerWidth: 800, hardwareConcurrency: 4 });
    expect(fourCores.IS_HIGH_END_DEVICE).toBe(true);
  });

  it("treats a missing hardwareConcurrency as not high-end", async () => {
    const device = await loadDeviceModule({ innerWidth: 1200, hardwareConcurrency: undefined });
    expect(device.IS_HIGH_END_DEVICE).toBe(false);
  });
});

describe("getDefaultScaleFactor", () => {
  it("is 0.9 on mobile", async () => {
    const device = await loadDeviceModule({ innerWidth: 400 });
    expect(device.getDefaultScaleFactor()).toBe(0.9);
  });

  it("is 0.75 in header mode", async () => {
    const device = await loadDeviceModule({ innerWidth: 1200, innerHeight: 200 });
    expect(device.getDefaultScaleFactor()).toBe(0.75);
  });

  it("is 1 on a normal desktop viewport", async () => {
    const device = await loadDeviceModule({ innerWidth: 1200, innerHeight: 800 });
    expect(device.getDefaultScaleFactor()).toBe(1);
  });
});
