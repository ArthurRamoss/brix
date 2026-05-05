// Icon set — minimal stroke icons used across the app.
// Ported from Brix-handoff/brix/project/shell.jsx.

import type { ReactNode, SVGProps } from "react";

type IconProps = {
  size?: number;
  fill?: boolean;
  className?: string;
} & Omit<SVGProps<SVGSVGElement>, "fill" | "stroke" | "d">;

type IconRenderer = (p?: IconProps) => ReactNode;

function Svg({
  d,
  size = 18,
  fill = false,
  className,
  ...rest
}: IconProps & { d: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...rest}
    >
      {typeof d === "string" ? <path d={d} /> : d}
    </svg>
  );
}

export const I: Record<string, IconRenderer> = {
  arrow: (p) => <Svg {...p} d="M5 12h14M13 6l6 6-6 6" />,
  check: (p) => <Svg {...p} d="M5 12.5l4 4L19 7" />,
  x: (p) => <Svg {...p} d="M6 6l12 12M6 18L18 6" />,
  lock: (p) => (
    <Svg
      {...p}
      d={
        <>
          <rect x="5" y="11" width="14" height="9" rx="2" />
          <path d="M8 11V8a4 4 0 018 0v3" />
        </>
      }
    />
  ),
  shield: (p) => (
    <Svg {...p} d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z" />
  ),
  zap: (p) => <Svg {...p} d="M13 3L4 14h7l-1 7 9-11h-7l1-7z" />,
  wallet: (p) => (
    <Svg
      {...p}
      d={
        <>
          <rect x="3" y="6" width="18" height="14" rx="2" />
          <path d="M3 10h18M16 14.5h2" />
        </>
      }
    />
  ),
  building: (p) => (
    <Svg
      {...p}
      d={
        <>
          <rect x="4" y="3" width="16" height="18" rx="1" />
          <path d="M9 8h2M13 8h2M9 12h2M13 12h2M9 16h2M13 16h2" />
        </>
      }
    />
  ),
  trending: (p) => <Svg {...p} d="M3 17l6-6 4 4 8-8M15 7h6v6" />,
  plus: (p) => <Svg {...p} d="M12 5v14M5 12h14" />,
  search: (p) => (
    <Svg
      {...p}
      d={
        <>
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </>
      }
    />
  ),
  filter: (p) => <Svg {...p} d="M4 5h16l-6 8v6l-4-2v-4L4 5z" />,
  download: (p) => <Svg {...p} d="M12 4v12M6 11l6 6 6-6M5 20h14" />,
  link: (p) => (
    <Svg
      {...p}
      d="M10 14a4 4 0 005.66 0l3-3a4 4 0 00-5.66-5.66l-1 1M14 10a4 4 0 00-5.66 0l-3 3a4 4 0 005.66 5.66l1-1"
    />
  ),
  bell: (p) => (
    <Svg
      {...p}
      d="M6 8a6 6 0 1112 0v5l1.5 3h-15L6 13V8zM10 19a2 2 0 004 0"
    />
  ),
  copy: (p) => (
    <Svg
      {...p}
      d={
        <>
          <rect x="8" y="8" width="12" height="12" rx="2" />
          <path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" />
        </>
      }
    />
  ),
  back: (p) => <Svg {...p} d="M15 6l-6 6 6 6" />,
  menu: (p) => <Svg {...p} d="M4 7h16M4 12h16M4 17h16" />,
  chart: (p) => <Svg {...p} d="M4 20V8M10 20V4M16 20v-7M22 20H2" />,
  shieldCheck: (p) => (
    <Svg
      {...p}
      d={
        <>
          <path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z" />
          <path d="M9 12l2 2 4-4" />
        </>
      }
    />
  ),
};
