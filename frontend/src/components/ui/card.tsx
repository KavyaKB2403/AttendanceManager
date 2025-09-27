// src/components/ui/card.tsx
import * as React from "react";
import clsx from "clsx";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "outlined";
};

export function Card({ className = "", variant = "default", ...props }: CardProps) {
  const variants = {
    default: "bg-white border border-slate-200 shadow-sm",
    outlined: "bg-transparent border-2 border-slate-400",
  };
  return <div className={clsx("rounded", variants[variant], className)} {...props} />;
}

export function CardHeader(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div className="border-b border-slate-200 p-4" {...props} />;
}
export function CardTitle(props: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className="text-lg font-semibold" {...props} />;
}
export function CardDescription(props: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className="text-slate-600 text-sm" {...props} />;
}
export function CardContent(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div className="p-4" {...props} />;
}
