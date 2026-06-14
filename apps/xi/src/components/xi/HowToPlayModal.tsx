"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function HowToPlayModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            How to play xi<span className="text-primary">.</span>
          </DialogTitle>
          <DialogDescription>
            A famous match is revealed every day. Guess the starting XI for both
            teams.
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-3 text-sm">
          <li className="flex gap-2">
            <span>⚽</span>
            <span>
              Type a player&apos;s <strong>name</strong> to guess — first name,
              surname, or both. Small typos are forgiven.
            </span>
          </li>
          <li className="flex gap-2">
            <span>🔢</span>
            <span>
              Each slot shows the <strong>squad number</strong>,{" "}
              <strong>position</strong>, and <strong>nationality flag</strong>{" "}
              as hints.
            </span>
          </li>
          <li className="flex gap-2">
            <span>❤️</span>
            <span>
              You have <strong>3 lives</strong> — a wrong guess costs one.
            </span>
          </li>
          <li className="flex gap-2">
            <span>🏆</span>
            <span>
              Get all <strong>22 right</strong> to win.
            </span>
          </li>
        </ul>
        <p className="text-sm text-muted-foreground">
          Come back tomorrow for a new match.
        </p>
      </DialogContent>
    </Dialog>
  );
}
