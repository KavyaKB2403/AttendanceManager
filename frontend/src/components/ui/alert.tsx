// src/components/ui/alert.tsx
import * as React from "react";
import clsx from "clsx";

type AlertProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "destructive" | "success" | "warning";
};

export function Alert({ className = "", variant = "default", ...props }: AlertProps) {
  const variants = {
    default: "border-blue-300 bg-blue-50 text-blue-800",
    destructive: "border-red-300 bg-red-50 text-red-800",
    success: "border-green-300 bg-green-50 text-green-800",
    warning: "border-yellow-300 bg-yellow-50 text-yellow-800",
  };
  return <div className={clsx("w-full rounded border p-3 text-sm", variants[variant], className)} {...props} />;
}

export function AlertTitle(props: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h5 className="mb-1 font-medium leading-none tracking-tight" {...props} />;
}

export function AlertDescription(props: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p {...props} />;
}
