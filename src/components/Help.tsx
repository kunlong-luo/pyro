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
      <DialogContent className="max-w-md glass-panel rounded-2xl border-soft">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold tracking-tight text-fg">
            {content?.header ?? ""}
          </DialogTitle>
          <DialogDescription className="sr-only">帮助信息</DialogDescription>
        </DialogHeader>
        <div className="text-sm leading-relaxed whitespace-pre-line text-fg-secondary">
          {content?.body ?? ""}
        </div>
      </DialogContent>
    </Dialog>
  );
}
