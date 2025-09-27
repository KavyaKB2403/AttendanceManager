// src/components/ui/button.tsx
import * as React from "react";
import clsx from "clsx";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "destructive" | "outline" | "ghost";
};

export function Button({ className = "", variant = "default", ...props }: ButtonProps) {
  const variants = {
    default: "bg-amber-400 text-black hover:bg-amber-500",
    destructive: "bg-red-500 text-white hover:bg-red-600",
    outline: "border border-gray-300 text-gray-800 bg-white hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700",
    ghost: "bg-transparent text-gray-800 hover:bg-gray-100",
  };
  return <button className={clsx("inline-flex items-center justify-center px-3 py-2 rounded", variants[variant], className)} {...props} />;
}
