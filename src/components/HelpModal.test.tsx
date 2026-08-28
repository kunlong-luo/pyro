// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HelpModal } from "./HelpModal";
import { renderWithStore } from "./testUtils";
import { fireworksAppConfig } from "@/config/appConfig";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("HelpModal visibility class", () => {
  it("has just 'help-modal' (no stray 'active') when no topic is open", () => {
    const { container } = renderWithStore(<HelpModal />, { openHelpTopic: null });
    const root = container.firstElementChild as HTMLElement;
    expect(root.className.trim()).toBe("help-modal");
  });

  it("carries a distinct 'active' token (not mashed into 'help-modalactive') when a topic is open", () => {
    const { container } = renderWithStore(<HelpModal />, { openHelpTopic: "shellType" });
    const root = container.firstElementChild as HTMLElement;
    expect(root.className.split(/\s+/)).toEqual(expect.arrayContaining(["help-modal", "active"]));
  });
});

describe("HelpModal content and dismissal", () => {
  it("renders the header/body text for the open topic from appConfig.helpContent", () => {
    const { container } = renderWithStore(<HelpModal />, { openHelpTopic: "shellType" });
    const expected = fireworksAppConfig.helpContent.shellType;
    expect(container.querySelector(".help-modal__header")?.textContent).toBe(expected.header);
    expect(container.querySelector(".help-modal__body")?.textContent).toBe(expected.body);
  });

  it("clears openHelpTopic when the close button is clicked", async () => {
    const user = userEvent.setup();
    const { store, container } = renderWithStore(<HelpModal />, { openHelpTopic: "shellType" });

    await user.click(container.querySelector(".help-modal__close-btn")!);
    expect(store.getState().openHelpTopic).toBeNull();
  });

  it("clears openHelpTopic when the overlay is clicked", async () => {
    const user = userEvent.setup();
    const { store, container } = renderWithStore(<HelpModal />, { openHelpTopic: "shellType" });

    await user.click(container.querySelector(".help-modal__overlay")!);
    expect(store.getState().openHelpTopic).toBeNull();
  });
});
