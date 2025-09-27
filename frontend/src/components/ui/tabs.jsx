// src/components/ui/tabs.jsx
import React from "react";

const TabsContext = React.createContext({
  value: "",
  setValue: (v) => {},
});

export function Tabs({ defaultValue, value: controlled, onValueChange, children, className = "" }) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue);
  const isControlled = controlled !== undefined;
  const value = isControlled ? controlled : uncontrolled;
  const setValue = (v) => {
    if (isControlled) onValueChange?.(v);
    else setUncontrolled(v);
  };
  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className = "", ...props }) {
  return <div role="tablist" className={`inline-flex gap-2 ${className}`} {...props} />;
}

export function TabsTrigger({ value, className = "", children, ...props }) {
  const { value: active, setValue } = React.useContext(TabsContext);
  const activeClass = active === value ? "bg-amber-400 text-black border-amber-500" : "bg-white text-slate-700 border-slate-300";
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active === value}
      data-state={active === value ? "active" : "inactive"}
      className={`px-3 py-1 rounded border ${activeClass} ${className}`}
      onClick={() => setValue(value)}
      {...props}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, className = "", children, ...props }) {
  const { value: active } = React.useContext(TabsContext);
  if (active !== value) return null;
  return (
    <div role="tabpanel" className={`mt-2 ${className}`} {...props}>
      {children}
    </div>
  );
}
