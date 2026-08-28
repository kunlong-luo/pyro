"use client";

/**
 * Help modal — 100% pixel-perfect port of
 * legacy.index.html lines 145-152 + CSS lines 377-477.
 *
 * Shows overlay / dialog / header / body / close button.
 * Active class toggled by openHelpTopic state.
 * Content mapped from fireworksAppConfig.helpContent.
 */

import { useStore } from "zustand";
import { useFireworksStore } from "@/stores/storeContext";
import { fireworksAppConfig } from "@/config/appConfig";
import type { HelpContent } from "@/types/app";

export function HelpModal() {
  const store = useFireworksStore();
  const openHelpTopic = useStore(store, (s) => s.openHelpTopic);

  const isActive = Boolean(openHelpTopic);
  const content = openHelpTopic
    ? fireworksAppConfig.helpContent[openHelpTopic as keyof HelpContent]
    : null;

  const handleClose = () => {
    store.setState({ openHelpTopic: null });
  };

  return (
    <div className={`help-modal ${isActive ? "active" : ""}`}>
      <div
        className="help-modal__overlay"
        onClick={handleClose}
        onKeyDown={(e) => {
          if (e.key === "Escape") handleClose();
        }}
        role="button"
        tabIndex={-1}
        aria-label="关闭帮助"
      />
      <div className="help-modal__dialog">
        <div className="help-modal__header">{content?.header ?? ""}</div>
        <div className="help-modal__body">{content?.body ?? ""}</div>
        <button type="button" className="help-modal__close-btn" onClick={handleClose}>
          关闭
        </button>
      </div>
    </div>
  );
}
