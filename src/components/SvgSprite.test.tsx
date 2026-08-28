// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { SvgSprite } from "./SvgSprite";

afterEach(cleanup);

const ICON_IDS = [
  "icon-play",
  "icon-pause",
  "icon-close",
  "icon-settings",
  "icon-sound-on",
  "icon-sound-off",
];

describe("SvgSprite", () => {
  it("is zero-sized and hidden from layout/screen readers so <use> refs don't shove the page around", () => {
    const { container } = render(<SvgSprite />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.className.split(/\s+/)).toEqual(
      expect.arrayContaining(["invisible", "absolute", "h-0", "w-0"]),
    );
  });

  it("defines every icon symbol referenced elsewhere in the app", () => {
    const { container } = render(<SvgSprite />);
    for (const id of ICON_IDS) {
      expect(container.querySelector(`symbol#${id}`)).not.toBeNull();
    }
  });
});
