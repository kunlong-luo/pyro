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

export function HelpModal() {
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
      <DialogContent className="bg-black/90 border-white/20 text-white/90 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium text-white/90">
            {content?.header ?? ""}
          </DialogTitle>
          <DialogDescription className="sr-only">
            帮助信息
          </DialogDescription>
        </DialogHeader>
        <div className="text-sm text-white/70 leading-relaxed whitespace-pre-line">
          {content?.body ?? ""}
        </div>
      </DialogContent>
    </Dialog>
  );
}
