"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Bot } from "lucide-react";

// Welcome modal component shown on first visit
export const WelcomeModal = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem("emma_welcome_seen");
    if (!hasSeenWelcome) {
      setOpen(true);
      localStorage.setItem("emma_welcome_seen", "true");
    }
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Bot className="h-6 w-6 text-primary" />
            Welcome!
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Welcome to the coolest worker app made by Tasos, a first-class fullstack dev
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
