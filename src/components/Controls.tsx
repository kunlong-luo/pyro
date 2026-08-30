"use client";

import { useStore } from "zustand";
import { motion, AnimatePresence } from "framer-motion";
import { useFireworksStore } from "@/stores/storeContext";
import { Icon } from "./Icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function ControlButton({
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
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          {children}
        </motion.button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="bg-black/80 border-white/20 text-white/90">
        <p className="text-xs">
          {label} <span className="text-white/50 ml-1">({shortcut})</span>
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

export function Controls() {
  const store = useFireworksStore();
  const paused = useStore(store, (s) => s.paused);
  const soundEnabled = useStore(store, (s) => s.soundEnabled);
  const menuOpen = useStore(store, (s) => s.menuOpen);
  const hideControls = useStore(store, (s) => s.config.hideControls);

  const isHidden = menuOpen || hideControls;
  const soundIconName = soundEnabled ? "icon-sound-on" : "icon-sound-off";

  return (
    <TooltipProvider delayDuration={300}>
      <motion.div
        className={`controls ${isHidden ? "hide" : ""}`}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: isHidden ? 0 : 1, y: isHidden ? -10 : 0 }}
        transition={{ duration: 0.3 }}
      >
        <ControlButton
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
              <Icon name={paused ? "icon-play" : "icon-pause"} size={24} className="text-white" />
            </motion.div>
          </AnimatePresence>
        </ControlButton>

        <ControlButton
          label={soundEnabled ? "静音" : "开启声音"}
          shortcut="M"
          onClick={() => store.setState({ soundEnabled: !store.getState().soundEnabled })}
          className="sound-btn"
        >
          <Icon name={soundIconName} size={24} className="text-white" />
        </ControlButton>

        <ControlButton
          label="设置"
          shortcut="M"
          onClick={() => store.setState({ menuOpen: true })}
          className="settings-btn"
        >
          <Icon name="icon-settings" size={24} className="text-white" />
        </ControlButton>
      </motion.div>
    </TooltipProvider>
  );
}
