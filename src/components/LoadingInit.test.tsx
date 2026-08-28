// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, screen } from "@testing-library/react";
import { LoadingInit } from "./LoadingInit";

afterEach(cleanup);

describe("LoadingInit", () => {
  it("shows the default status message when none is given", () => {
    render(<LoadingInit />);
    expect(screen.getByText("正在装配烟花")).toBeInTheDocument();
    expect(screen.getByText("加载中")).toBeInTheDocument();
  });

  it("shows a custom status message", () => {
    render(<LoadingInit status="正在点燃导火线" />);
    expect(screen.getByText("正在点燃导火线")).toBeInTheDocument();
  });
});
