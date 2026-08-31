"use client";

import { useStore } from "zustand";
import { useFireworksStore } from "@/stores/storeContext";
import { fireworksAppConfig } from "@/config/appConfig";
import type { HelpContent } from "@/types/app";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function Help() {
  const store = useFireworksStore();
  const openHelpTopic = useStore(store, (s) => s.openHelpTopic);

  const isOpen = Boolean(openHelpTopic);
  const content = openHelpTopic
    ? fireworksAppConfig.helpContent[openHelpTopic as keyof HelpContent]
    : null;

  const handleClose = () => {
    store.setState({ openHelpTopic: null });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="glass-panel border-soft max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-fg text-lg font-semibold tracking-tight">
            {content?.header ?? ""}
          </DialogTitle>
          <DialogDescription className="sr-only">帮助信息</DialogDescription>
        </DialogHeader>
        <div className="text-fg-secondary text-sm leading-relaxed whitespace-pre-line">
          {content?.body ?? ""}
        </div>
      </DialogContent>
    </Dialog>
  );
}
