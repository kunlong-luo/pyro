"use client";

/**
 * Top-bar controls — 100% pixel-perfect port of
 * legacy.index.html lines 54-70.
 *
 * Three buttons: pause, sound, settings.
 * Lucide-react icons via <Icon name="..." />.
 */

import { useStore } from "zustand";
import { useFireworksStore } from "@/stores/storeContext";
import { Icon } from "./Icons";

export function Controls() {
  const store = useFireworksStore();
  const paused = useStore(store, (s) => s.paused);
  const soundEnabled = useStore(store, (s) => s.soundEnabled);
  const menuOpen = useStore(store, (s) => s.menuOpen);
  const hideControls = useStore(store, (s) => s.config.hideControls);

  const isHidden = menuOpen || hideControls;
  const soundIconName = soundEnabled ? "icon-sound-on" : "icon-sound-off";

  return (
    <div className={`controls ${isHidden ? "hide" : ""}`}>
      <button
        className="btn pause-btn"
        type="button"
        aria-label="暂停或继续"
        onClick={() => {
          store.setState({ paused: !store.getState().paused });
        }}
      >
        <Icon name={paused ? "icon-play" : "icon-pause"} size={24} className="text-white" />
      </button>
      <button
        className="btn sound-btn"
        type="button"
        aria-label="切换声音"
        onClick={() => {
          store.setState({ soundEnabled: !store.getState().soundEnabled });
        }}
      >
        <Icon name={soundIconName} size={24} className="text-white" />
      </button>
      <button
        className="btn settings-btn"
        type="button"
        aria-label="打开设置"
        onClick={() => {
          store.setState({ menuOpen: true });
        }}
      >
        <Icon name="icon-settings" size={24} className="text-white" />
      </button>
    </div>
  );
}
