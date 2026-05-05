// BrixWordmark — logo + "brix" lowercase wordmark in IBM Plex Sans.
// Ported from Brix-handoff/brix/project/shell.jsx.

import { Logo } from "./Logo";

type WordmarkProps = {
  size?: number;
};

export function Wordmark({ size = 22 }: WordmarkProps) {
  return (
    <div className="flex items-center gap-2.5">
      <Logo size={size + 6} />
      <span
        className="font-sans"
        style={{
          fontWeight: 600,
          fontSize: size,
          letterSpacing: "-0.02em",
          color: "var(--fg-0)",
        }}
      >
        brix
      </span>
    </div>
  );
}
