// src/components/ui/input.tsx
import * as React from "react";
import clsx from "clsx";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = "", ...props }, ref) {
    return (
      <input
        ref={ref}
        className={clsx(
          "w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-400",
          className
        )}
        {...props}
      />
    );
  }
);
