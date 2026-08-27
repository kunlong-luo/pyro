/**
 * Top-bar controls — 100% pixel-perfect port of
 * legacy.index.html lines 54-70.
 *
 * Three buttons: pause, sound, settings.
 * SVG sprite icons via <use href="#icon-*">.
 */

import { useStore } from "zustand";
import { useFireworksStore } from "@/stores/storeContext";

export function Controls() {
  const store = useFireworksStore();
  const paused = useStore(store, (s) => s.paused);
  const soundEnabled = useStore(store, (s) => s.soundEnabled);
  const menuOpen = useStore(store, (s) => s.menuOpen);
  const hideControls = useStore(store, (s) => s.config.hideControls);

  const isHidden = menuOpen || hideControls;
  const pauseIcon = paused ? "#icon-play" : "#icon-pause";
  const soundIcon = soundEnabled ? "#icon-sound-on" : "#icon-sound-off";

  return (
    <div className={`controls${isHidden ? " hide" : ""}`}>
      <button
        className="btn pause-btn"
        type="button"
        aria-label="暂停或继续"
        onClick={() => {
          store.setState({ paused: !store.getState().paused });
        }}
      >
        <svg fill="white" width="24" height="24" aria-hidden="true">
          <use href={pauseIcon} xlinkHref={pauseIcon} />
        </svg>
      </button>
      <button
        className="btn sound-btn"
        type="button"
        aria-label="切换声音"
        onClick={() => {
          store.setState({ soundEnabled: !store.getState().soundEnabled });
        }}
      >
        <svg fill="white" width="24" height="24" aria-hidden="true">
          <use href={soundIcon} xlinkHref={soundIcon} />
        </svg>
      </button>
      <button
        className="btn settings-btn"
        type="button"
        aria-label="打开设置"
        onClick={() => {
          store.setState({ menuOpen: true });
        }}
      >
        <svg fill="white" width="24" height="24" aria-hidden="true">
          <use href="#icon-settings" xlinkHref="#icon-settings" />
        </svg>
      </button>
    </div>
  );
}
