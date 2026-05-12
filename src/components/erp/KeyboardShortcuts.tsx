"use client";

import { useEffect } from "react";

export default function KeyboardShortcuts({
  onNewSale,
  onSave,
}: {
  onNewSale?: () => void;
  onSave?: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "F2" && onNewSale) {
        e.preventDefault();
        onNewSale();
      }
      if (e.key === "F5" && onSave) {
        e.preventDefault();
        onSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onNewSale, onSave]);

  return null;
}
