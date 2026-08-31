// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { Icon } from "./Icon";

describe("Icon", () => {
  beforeEach(() => {
    cleanup();
  });

  it("renders play icon", () => {
    render(<Icon name="icon-play" size={24} />);
    const svg = screen.getByTestId("icon");
    expect(svg).toBeInTheDocument();
  });

  it("renders pause icon", () => {
    render(<Icon name="icon-pause" size={24} />);
    const svg = screen.getByTestId("icon");
    expect(svg).toBeInTheDocument();
  });

  it("renders close icon", () => {
    render(<Icon name="icon-close" size={24} />);
    const svg = screen.getByTestId("icon");
    expect(svg).toBeInTheDocument();
  });

  it("renders settings icon", () => {
    render(<Icon name="icon-settings" size={24} />);
    const svg = screen.getByTestId("icon");
    expect(svg).toBeInTheDocument();
  });

  it("renders sound on icon", () => {
    render(<Icon name="icon-sound-on" size={24} />);
    const svg = screen.getByTestId("icon");
    expect(svg).toBeInTheDocument();
  });

  it("renders sound off icon", () => {
    render(<Icon name="icon-sound-off" size={24} />);
    const svg = screen.getByTestId("icon");
    expect(svg).toBeInTheDocument();
  });

  it("applies custom size", () => {
    render(<Icon name="icon-play" size={32} />);
    const svg = screen.getByTestId("icon");
    expect(svg).toHaveAttribute("width", "32");
    expect(svg).toHaveAttribute("height", "32");
  });

  it("applies custom className", () => {
    render(<Icon name="icon-play" className="custom-class" />);
    const svg = screen.getByTestId("icon");
    expect(svg).toHaveClass("custom-class");
  });

  it("renders nothing and warns for unknown icon", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    // @ts-expect-error - testing unknown icon
    render(<Icon name="icon-unknown" />);
    expect(screen.queryByTestId("icon")).not.toBeInTheDocument();
    expect(warnSpy).toHaveBeenCalledWith('Icon "icon-unknown" not found');
    warnSpy.mockRestore();
  });
});
