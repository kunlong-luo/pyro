// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HelpModal } from "./HelpModal";
import { renderWithStore } from "./testUtils";
import { fireworksAppConfig } from "@/config/appConfig";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("HelpModal visibility", () => {
  it("does not render dialog content when no topic is open", () => {
    renderWithStore(<HelpModal />, { openHelpTopic: null });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders dialog when a topic is open", () => {
    renderWithStore(<HelpModal />, { openHelpTopic: "shellType" });
    expect(screen.getByRole("dialog")).not.toBeNull();
  });
});

describe("HelpModal content and dismissal", () => {
  it("renders the header/body text for the open topic from appConfig.helpContent", () => {
    renderWithStore(<HelpModal />, { openHelpTopic: "shellType" });
    const expected = fireworksAppConfig.helpContent.shellType;
    expect(screen.getByRole("heading")).toHaveTextContent(expected.header);
    expect(screen.getByText(expected.body, { exact: false })).not.toBeNull();
  });

  it("clears openHelpTopic when the close button is clicked", async () => {
    const user = userEvent.setup();
    const { store } = renderWithStore(<HelpModal />, { openHelpTopic: "shellType" });

    await user.click(screen.getByRole("button", { name: /close/i }));
    expect(store.getState().openHelpTopic).toBeNull();
  });

  it("clears openHelpTopic when Escape is pressed", async () => {
    const user = userEvent.setup();
    const { store } = renderWithStore(<HelpModal />, { openHelpTopic: "shellType" });

    await user.keyboard("{Escape}");
    expect(store.getState().openHelpTopic).toBeNull();
  });
});
