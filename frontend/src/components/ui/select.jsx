import React from "react";

function collectItems(children, acc = []) {
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    const typeName = child.type?.displayName || child.type?.name;
    if (typeName === "SelectItem") {
      acc.push({ value: child.props.value, label: child.props.children });
    }
    if (child.props?.children) collectItems(child.props.children, acc);
  });
  return acc;
}

function findPlaceholder(children) {
  let ph;
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    const typeName = child.type?.displayName || child.type?.name;
    if (typeName === "SelectValue" && child.props?.placeholder) {
      ph = child.props.placeholder;
    } else if (child.props?.children && ph === undefined) {
      ph = findPlaceholder(child.props.children);
    }
  });
  return ph;
}

export function Select({ value, onValueChange, children, className = "" }) {
  const items = collectItems(children, []);
  const placeholder = findPlaceholder(children);
  const hasPlaceholder = placeholder && (value === undefined || value === null || value === "");
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onValueChange?.(e.target.value)}
      className={`px-3 py-2 border border-slate-300 rounded ${className}`}
    >
      {placeholder && (
        <option value="" disabled={true} hidden={!hasPlaceholder}>
          {placeholder}
        </option>
      )}
      {items.map((it) => (
        <option key={String(it.value)} value={it.value}>
          {it.label}
        </option>
      ))}
    </select>
  );
}

export function SelectItem({ value, children }) {
  // Render nothing here; options are rendered by Select
  return null;
}
SelectItem.displayName = "SelectItem";

export function SelectTrigger({ children }) {
  return <>{children}</>;
}
SelectTrigger.displayName = "SelectTrigger";

export function SelectValue({ children }) {
  return <>{children}</>;
}
SelectValue.displayName = "SelectValue";

export function SelectContent({ children }) {
  return <>{children}</>;
}
SelectContent.displayName = "SelectContent";
