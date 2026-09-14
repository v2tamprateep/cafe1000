import type { CSSProperties } from "react";

export type IconName =
  | "dining" | "board" | "chart" | "clock" | "plus" | "arrow"
  | "search" | "close" | "check" | "copy" | "download" | "upload"
  | "people" | "chevron" | "receipt" | "layers" | "target" | "spark"
  | "undo" | "link" | "logout" | "refresh" | "alert" | "lock";

const paths: Record<IconName, React.ReactNode> = {
  dining: <><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="3.5"/><path d="M3 3v18M1 3v5a2 2 0 0 0 4 0V3M22 3c-2 2-2 5-2 8h2m0-8v18"/></>,
  board: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
  chart: <><path d="M4 3v17h17M8 15l4-5 4 2 5-8"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  plus: <path d="M12 5v14M5 12h14"/>,
  arrow: <path d="M4 12h15m-6-6 6 6-6 6"/>,
  search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></>,
  close: <path d="m6 6 12 12M6 18 18 6"/>,
  check: <path d="m5 12 4 4L19 6"/>,
  copy: <><rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h4"/></>,
  download: <><path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/></>,
  upload: <><path d="M12 16V4m-5 5 5-5 5 5M4 16v5h16v-5"/></>,
  people: <><circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M17 5a3 3 0 0 1 0 6m1 4a5 5 0 0 1 3 5"/></>,
  chevron: <path d="m8 5 7 7-7 7"/>,
  receipt: <><path d="m5 3 2 2 2-2 3 2 3-2 2 2 2-2v18l-2-2-2 2-3-2-3 2-2-2-2 2V3Z"/><path d="M9 9h6m-6 4h6m-6 4h3"/></>,
  layers: <><path d="m12 3 10 5-10 5L2 8l10-5Zm-9 9 9 5 9-5m-18 5 9 5 9-5"/></>,
  target: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></>,
  spark: <><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3ZM20 2v4m-2-2h4"/></>,
  undo: <><path d="M8 4 3 9l5 5M3 9h10a6 6 0 0 1 0 12h-2"/></>,
  link: <><path d="m9 15 6-6m-5-3 2-2a5 5 0 0 1 7 7l-2 2M7 11l-2 2a5 5 0 0 0 7 7l2-2"/></>,
  logout: <><path d="M9 4H4v16h5m6-13 5 5-5 5M9 12h11"/></>,
  refresh: <><path d="M20 10a8 8 0 0 0-14-5L3 8m0-5v5h5M4 14a8 8 0 0 0 14 5l3-3m0 5v-5h-5"/></>,
  alert: <><path d="m12 3 10 18H2L12 3Zm0 6v5"/><path d="M12 17h.01"/></>,
  lock: <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/></>,
};

export function Icon({ name, size = 20, className, style }: {
  name: IconName;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true" className={className} style={style}>{paths[name]}</svg>;
}

export function Brand({ light = false }: { light?: boolean }) {
  return <div className={`brand ${light ? "brand-light" : ""}`}>
    <span className="brand-icon"><Icon name="dining" size={25}/></span>
    <span className="brand-wordmark">cafe<span className="brand-number">1000<span className="brand-dot">.</span></span></span>
  </div>;
}
