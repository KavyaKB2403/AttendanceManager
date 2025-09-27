// src/components/ui/table.jsx
import React from "react";
import clsx from "clsx";

export function Table({ className = "", ...props }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={clsx("w-full caption-bottom text-sm border-collapse", className)} {...props} />
    </div>
  );
}
export function TableHeader({ className = "", ...props }) {
  return <thead className={clsx("[&_tr]:border-b", className)} {...props} />;
}
export function TableBody({ className = "", ...props }) {
  return <tbody className={clsx("[&_tr:last-child]:border-0", className)} {...props} />;
}
export function TableRow({ className = "", ...props }) {
  return (
    <tr
      className={clsx(
        "border-b transition-colors hover:bg-slate-50 data-[state=selected]:bg-slate-100",
        className
      )}
      {...props}
    />
  );
}
export function TableHead({ className = "", ...props }) {
  return (
    <th
      className={clsx(
        "h-10 px-4 text-left align-middle font-medium text-slate-600 bg-slate-50 dark:text-gray-200 dark:bg-gray-800",
        className
      )}
      {...props}
    />
  );
}
export function TableCell({ className = "", ...props }) {
  return <td className={clsx("p-4 align-middle", className)} {...props} />;
}
