/*
Copyright © 2022 NianBroken. All rights reserved.
Github: https://github.com/NianBroken/Firework_Simulator
Gitee: https://gitee.com/nianbroken/Firework_Simulator
Licensed under Apache-2.0. You are free to use, modify, and distribute this code,
provided that you retain the original license and copyright notice in derivative works
and publish any modifications under the same license.
*/

export interface Point {
  x: number;
  y: number;
}

export interface LatticeResult {
  width: number;
  height: number;
  points: Point[];
}

function extractFontPixelSize(fontSize: string): number {
  const match = String(fontSize).match(/(\d+)px/);
  return match ? Number.parseInt(match[1], 10) : 60;
}

export interface MyMathType {
  readonly toDeg: number;
  readonly toRad: number;
  readonly halfPI: number;
  readonly twoPI: number;
  dist(width: number, height: number): number;
  pointDist(x1: number, y1: number, x2: number, y2: number): number;
  angle(width: number, height: number): number;
  pointAngle(x1: number, y1: number, x2: number, y2: number): number;
  splitVector(speed: number, angle: number): Point;
  random(min: number, max: number): number;
  randomInt(min: number, max: number): number;
  randomChoice<T>(choices: T[]): T;
  randomChoice(...choices: unknown[]): unknown;
  clamp(num: number, min: number, max: number): number;
  literalLattice(
    text: string,
    density?: number,
    fontFamily?: string,
    fontSize?: string,
  ): LatticeResult;
}

export const MyMath: MyMathType = {
  toDeg: 180 / Math.PI,
  toRad: Math.PI / 180,
  halfPI: Math.PI / 2,
  twoPI: Math.PI * 2,

  dist(width, height) {
    return Math.sqrt(width * width + height * height);
  },

  pointDist(x1, y1, x2, y2) {
    const distX = x2 - x1;
    const distY = y2 - y1;
    return Math.sqrt(distX * distX + distY * distY);
  },

  angle(width, height) {
    return this.halfPI + Math.atan2(height, width);
  },

  pointAngle(x1, y1, x2, y2) {
    return this.halfPI + Math.atan2(y2 - y1, x2 - x1);
  },

  splitVector(speed, angle) {
    return {
      x: Math.sin(angle) * speed,
      y: -Math.cos(angle) * speed,
    };
  },

  random(min, max) {
    return Math.random() * (max - min) + min;
  },

  randomInt(min, max) {
    return ((Math.random() * (max - min + 1)) | 0) + min;
  },

  randomChoice(...args: unknown[]): unknown {
    if (args.length === 1 && Array.isArray(args[0])) {
      return args[0][(Math.random() * args[0].length) | 0];
    }
    return args[(Math.random() * args.length) | 0];
  },

  clamp(num, min, max) {
    return Math.min(Math.max(num, min), max);
  },

  literalLattice(text, density = 3, fontFamily = "Georgia", fontSize = "60px") {
    const dots: Point[] = [];
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d")!;
    const font = `${fontSize} ${fontFamily}`;
    const fontPixelSize = extractFontPixelSize(fontSize);

    context.font = font;
    const width = context.measureText(text).width;
    canvas.width = width + 20;
    canvas.height = fontPixelSize + 20;

    context.font = font;
    context.fillText(text, 10, fontPixelSize + 10);

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < imageData.height; y += density) {
      for (let x = 0; x < imageData.width; x += density) {
        const index = (y * imageData.width + x) * 4;
        if (imageData.data[index + 3] > 0) {
          dots.push({ x, y });
        }
      }
    }

    return {
      width: canvas.width,
      height: canvas.height,
      points: dots,
    };
  },
};
