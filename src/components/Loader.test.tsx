// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, screen } from "@testing-library/react";
import { Loader } from "./Loader";

afterEach(cleanup);

describe("Loader", () => {
  it("shows the default status message when none is given", () => {
    render(<Loader />);
    expect(screen.getByText("正在装配烟花")).toBeInTheDocument();
    expect(screen.getByText("加载中")).toBeInTheDocument();
  });

  it("shows a custom status message", () => {
    render(<Loader status="正在点燃导火线" />);
    expect(screen.getByText("正在点燃导火线")).toBeInTheDocument();
  });
});
