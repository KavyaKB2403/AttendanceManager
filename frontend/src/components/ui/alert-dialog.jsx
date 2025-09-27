// src/components/ui/alert-dialog.jsx
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./dialog";
import { Button } from "./button";

export function AlertDialog({ children }) {
  return <>{children}</>;
}

export function AlertDialogTrigger({ onClick, children }) {
  return (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  );
}

export function AlertDialogContent({ open, onOpenChange, title, description, onConfirm }) {
  if (!open) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title || "Are you sure?"}</DialogTitle>
        </DialogHeader>
        {description && <p className="text-slate-700">{description}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" onClick={() => { onConfirm?.(); onOpenChange(false); }}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AlertDialogAction({ children, ...props }) {
  return <Button {...props}>{children}</Button>;
}
export function AlertDialogCancel({ children, ...props }) {
  return <Button variant="outline" {...props}>{children}</Button>;
}
// add these named exports alongside the existing ones
export function AlertDialogHeader({ children }) {
  return <div className="mb-2">{children}</div>;
}
export function AlertDialogTitle({ children }) {
  return <h3 className="text-lg font-semibold">{children}</h3>;
}
export function AlertDialogDescription({ children }) {
  return <p className="text-slate-700 text-sm">{children}</p>;
}
export function AlertDialogFooter({ children }) {
  return <div className="mt-4 flex justify-end gap-2">{children}</div>;
}
