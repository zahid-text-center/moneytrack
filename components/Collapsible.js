import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function Collapsible({ title, defaultOpen = true, right, children }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 text-sm font-medium text-ink"
        >
          <ChevronDown
            size={16}
            className={`text-muted transition-transform ${open ? "" : "-rotate-90"}`}
          />
          {title}
        </button>
        {right}
      </div>
      {open && children}
    </div>
  );
}
