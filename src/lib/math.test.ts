// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { MyMath } from "./math";

function stubCanvasContext(overrides: Partial<CanvasRenderingContext2D> = {}) {
  const ctx = {
    font: "",
    measureText: vi.fn(() => ({ width: 40 }) as TextMetrics),
    fillText: vi.fn(),
    getImageData: vi.fn(
      (_x: number, _y: number, w: number, h: number) =>
        ({
          width: w,
          height: h,
          data: new Uint8ClampedArray(w * h * 4),
        }) as ImageData,
    ),
    ...overrides,
  };
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
    ctx as unknown as CanvasRenderingContext2D,
  );
  return ctx;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("MyMath constants", () => {
  it("converts between degrees and radians", () => {
    expect(MyMath.toRad * MyMath.toDeg).toBeCloseTo(1);
    expect(180 * MyMath.toRad).toBeCloseTo(Math.PI);
    expect(Math.PI * MyMath.toDeg).toBeCloseTo(180);
  });

  it("exposes half and full turn constants", () => {
    expect(MyMath.halfPI).toBeCloseTo(Math.PI / 2);
    expect(MyMath.twoPI).toBeCloseTo(Math.PI * 2);
  });
});

describe("MyMath.dist / pointDist", () => {
  it("computes the hypotenuse of a width/height pair", () => {
    expect(MyMath.dist(3, 4)).toBe(5);
    expect(MyMath.dist(0, 0)).toBe(0);
  });

  it("computes the distance between two points", () => {
    expect(MyMath.pointDist(0, 0, 3, 4)).toBe(5);
    expect(MyMath.pointDist(10, 10, 10, 10)).toBe(0);
  });
});

describe("MyMath.angle / pointAngle", () => {
  it("returns halfPI-offset atan2 of width/height", () => {
    expect(MyMath.angle(0, 0)).toBeCloseTo(MyMath.halfPI);
  });

  it("returns halfPI-offset atan2 between two points", () => {
    expect(MyMath.pointAngle(0, 0, 0, 0)).toBeCloseTo(MyMath.halfPI);
    // Straight up (dy negative) should land near angle 0.
    expect(MyMath.pointAngle(0, 0, 0, -10)).toBeCloseTo(0);
  });
});

describe("MyMath.splitVector", () => {
  it("splits a speed/angle pair into x/y components", () => {
    const v = MyMath.splitVector(10, 0);
    expect(v.x).toBeCloseTo(0);
    expect(v.y).toBeCloseTo(-10);
  });

  it("points right at angle halfPI", () => {
    const v = MyMath.splitVector(10, MyMath.halfPI);
    expect(v.x).toBeCloseTo(10);
    expect(v.y).toBeCloseTo(0);
  });
});

describe("MyMath.random / randomInt", () => {
  it("stays within [min, max) for random()", () => {
    for (let i = 0; i < 50; i++) {
      const v = MyMath.random(5, 10);
      expect(v).toBeGreaterThanOrEqual(5);
      expect(v).toBeLessThan(10);
    }
  });

  it("stays within [min, max] (inclusive) for randomInt()", () => {
    for (let i = 0; i < 50; i++) {
      const v = MyMath.randomInt(1, 3);
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(3);
    }
  });

  it("can return the exact bounds of randomInt() given enough samples", () => {
    const seen = new Set<number>();
    for (let i = 0; i < 200; i++) seen.add(MyMath.randomInt(0, 1));
    expect(seen).toEqual(new Set([0, 1]));
  });
});

describe("MyMath.randomChoice", () => {
  it("picks an element from an array argument", () => {
    const choices = ["a", "b", "c"];
    for (let i = 0; i < 20; i++) {
      expect(choices).toContain(MyMath.randomChoice(choices));
    }
  });

  it("picks from variadic arguments when not given a single array", () => {
    for (let i = 0; i < 20; i++) {
      expect([1, 2, 3]).toContain(MyMath.randomChoice(1, 2, 3));
    }
  });

  it("returns the only element for a single-element array", () => {
    expect(MyMath.randomChoice(["only"])).toBe("only");
  });
});

describe("MyMath.clamp", () => {
  it("passes values through unchanged when in range", () => {
    expect(MyMath.clamp(5, 0, 10)).toBe(5);
  });

  it("clamps to the lower bound", () => {
    expect(MyMath.clamp(-5, 0, 10)).toBe(0);
  });

  it("clamps to the upper bound", () => {
    expect(MyMath.clamp(15, 0, 10)).toBe(10);
  });
});

describe("MyMath.literalLattice", () => {
  it("sizes the canvas from measured text width and font pixel size", () => {
    const ctx = stubCanvasContext({
      measureText: vi.fn(() => ({ width: 100 }) as TextMetrics),
    });
    const result = MyMath.literalLattice("烟花", 3, "Georgia", "40px");

    expect(result.width).toBe(120); // measured width (100) + 20 padding
    expect(result.height).toBe(60); // font pixel size (40) + 20 padding
    expect(ctx.fillText).toHaveBeenCalledWith("烟花", 10, 50);
  });

  it("defaults to a 60px font when the size string has no px suffix", () => {
    stubCanvasContext();
    const result = MyMath.literalLattice("x", 3, "Georgia", "not-a-size");
    expect(result.height).toBe(80); // default 60 + 20 padding
  });

  it("collects a lattice point for every opaque pixel on a density grid", () => {
    stubCanvasContext({
      measureText: vi.fn(() => ({ width: 4 }) as TextMetrics),
      getImageData: vi.fn((_x: number, _y: number, w: number, h: number) => {
        const data = new Uint8ClampedArray(w * h * 4);
        // Mark pixel (0,0) and (2,0) as opaque; everything else transparent.
        data[3] = 255;
        data[2 * 4 + 3] = 255;
        return { width: w, height: h, data } as ImageData;
      }),
    });

    const result = MyMath.literalLattice("x", 2, "Georgia", "1px");
    expect(result.points).toContainEqual({ x: 0, y: 0 });
    expect(result.points).toContainEqual({ x: 2, y: 0 });
    // Density of 2 skips odd x/y, so an opaque pixel at x=1 would never be sampled.
    expect(result.points).not.toContainEqual({ x: 1, y: 0 });
  });

  it("returns no points when the rendered text has no opaque pixels", () => {
    stubCanvasContext();
    const result = MyMath.literalLattice("x");
    expect(result.points).toEqual([]);
  });
});
