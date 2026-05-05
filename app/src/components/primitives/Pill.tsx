// Status pill — wraps the .pill .pill-{status} CSS classes from globals.css.
// Status drives both color and (via i18n) the label.

import type { ReactNode } from "react";

export type PillStatus =
  | "pending"
  | "registered"
  | "funded"
  | "repaid"
  | "defaulted";

type PillProps = {
  status: PillStatus;
  children: ReactNode;
};

export function Pill({ status, children }: PillProps) {
  return (
    <span className={`pill pill-${status}`}>
      <span className="dot" />
      {children}
    </span>
  );
}
