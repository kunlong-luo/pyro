"use client";

import { useCallback } from "react";
import { useStore } from "zustand";
import { motion, AnimatePresence } from "framer-motion";
import { useFireworksStore } from "@/stores/storeContext";
import { Icon } from "./Icon";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface ToolbarProps {
  onToggleFullscreen?: () => void;
}

function ToolbarButton({
  label,
  shortcut,
  onClick,
  children,
  className = "",
}: {
  label: string;
  shortcut: string;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.button
          className={`btn ${className}`}
          type="button"
          aria-label={label}
          onClick={onClick}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          {children}
        </motion.button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="border-hairline bg-popover text-popover-foreground">
        <p className="text-xs text-fg">
          {label} {shortcut && <span className="ml-1 text-fg-muted">({shortcut})</span>}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

export function Toolbar({ onToggleFullscreen }: ToolbarProps) {
  const store = useFireworksStore();
  const paused = useStore(store, (s) => s.paused);
  const soundEnabled = useStore(store, (s) => s.soundEnabled);
  const menuOpen = useStore(store, (s) => s.menuOpen);
  const fullscreen = useStore(store, (s) => s.fullscreen);
  const immersiveActive = useStore(store, (s) => s.config.hideControls);

  const handleImmersiveToggle = useCallback(() => {
    const state = store.getState();
    store.setState({
      config: { ...state.config, hideControls: !state.config.hideControls },
    });
  }, [store]);

  const controlsHidden = menuOpen || immersiveActive;
  const soundIconName = soundEnabled ? "icon-sound-on" : "icon-sound-off";

  return (
    <TooltipProvider delayDuration={300}>
      <motion.div
        className={`controls glass-hud ${controlsHidden ? "hide" : ""}`}
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <ToolbarButton
          label={paused ? "继续" : "暂停"}
          shortcut="Space"
          onClick={() => store.setState({ paused: !store.getState().paused })}
          className="pause-btn"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={paused ? "play" : "pause"}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Icon name={paused ? "icon-play" : "icon-pause"} size={24} />
            </motion.div>
          </AnimatePresence>
        </ToolbarButton>

        <ToolbarButton
          label={soundEnabled ? "静音" : "开启声音"}
          shortcut="M"
          onClick={() => store.setState({ soundEnabled: !store.getState().soundEnabled })}
          className="sound-btn"
        >
          <Icon name={soundIconName} size={24} />
        </ToolbarButton>

        <ToolbarButton
          label={fullscreen ? "退出全屏" : "全屏"}
          shortcut=""
          onClick={() => onToggleFullscreen?.()}
          className="fullscreen-btn"
        >
          <Icon name={fullscreen ? "icon-minimize" : "icon-maximize"} size={24} />
        </ToolbarButton>

        <ToolbarButton
          label="设置"
          shortcut="M"
          onClick={() => store.setState({ menuOpen: true })}
          className="settings-btn"
        >
          <Icon name="icon-settings" size={24} />
        </ToolbarButton>

        <ToolbarButton
          label={immersiveActive ? "退出沉浸式" : "进入沉浸式"}
          shortcut=""
          onClick={handleImmersiveToggle}
          className="immersive-btn"
        >
          <Icon name={immersiveActive ? "icon-eye" : "icon-eye-off"} size={24} />
        </ToolbarButton>
      </motion.div>

      {immersiveActive && (
        <AnimatePresence>
          <motion.button
            className="immersive-toggle"
            type="button"
            aria-label="退出沉浸式"
            onClick={handleImmersiveToggle}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            title="退出沉浸式"
          >
            <Icon name="icon-eye" size={20} />
          </motion.button>
        </AnimatePresence>
      )}
    </TooltipProvider>
  );
}
