// src/components/ui/dialog.jsx
import React from "react";

export function Dialog({ open, onOpenChange, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={() => onOpenChange?.(false)} />
      <div className="relative z-10 bg-white rounded shadow-lg w-full max-w-lg">{children}</div>
    </div>
  );
}
export function DialogContent({ children }) {
  return <div className="p-4">{children}</div>;
}
export function DialogHeader({ children }) {
  return <div className="border-b border-slate-200 p-4">{children}</div>;
}
export function DialogTitle({ children }) {
  return <h3 className="text-lg font-semibold">{children}</h3>;
}
export function DialogFooter({ children }) {
  return <div className="border-t border-slate-200 p-4 flex justify-end gap-2">{children}</div>;
}

export function DialogDescription({ children }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}