"use client";

import { useMemo, useState } from "react";
import type { Snapshot } from "@/lib/contracts";
import { formatNumber } from "@/lib/receipts";
import { Icon } from "./icons";
import { CopyButton } from "./ui";

type Filter = "all" | "missing" | "collected" | "duplicates";

export function CollectionBoard({ snapshot, onNumber }: {
  snapshot: Snapshot;
  onNumber: (number: string) => void;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [openGroups, setOpenGroups] = useState<Set<number>>(new Set([0]));
  const [copyOpen, setCopyOpen] = useState(false);
  const validSearch = /^\d{1,3}$/.test(search.trim());
  const searchedNumber = validSearch ? Number(search.trim()) : null;
  const numbers = useMemo(() => snapshot.counts.map((count, number) => ({ count, number })).filter(({ count, number }) => {
    if (search.trim()) return validSearch && number === searchedNumber;
    return filter === "all" || (filter === "missing" && count === 0) || (filter === "collected" && count > 0) || (filter === "duplicates" && count > 1);
  }), [snapshot.counts, search, validSearch, searchedNumber, filter]);
  const missing = snapshot.counts.flatMap((count, index) => count === 0 ? [formatNumber(index)] : []).join(", ");
  const filters: { value: Filter; label: string; count: number }[] = [
    { value: "all", label: "All numbers", count: 1000 },
    { value: "missing", label: "Missing", count: snapshot.stats.missing },
    { value: "collected", label: "Collected", count: snapshot.stats.unique },
    { value: "duplicates", label: "Duplicates", count: snapshot.stats.duplicateNumbers },
  ];

  return <section className="panel board-panel" aria-labelledby="board-title">
    <div className="panel-heading board-heading"><div><p className="eyebrow">THE COLLECTOR&apos;S ALBUM</p><h2 id="board-title">A place for every number<span className="orange-dot">.</span></h2><p className="muted">One thousand little spaces. Every meal brings us closer.</p></div>
      <button className="button button-secondary button-small" type="button" onClick={() => setCopyOpen(!copyOpen)} aria-expanded={copyOpen} aria-controls="missing-copy"><Icon name="copy" size={15}/>Missing list</button>
    </div>
    {copyOpen && <div className="missing-copy" id="missing-copy">
      <div><strong>{snapshot.stats.missing.toLocaleString()} numbers still to find</strong><p className="muted small">Copy the list for your next meal out.</p></div>
      {missing ? <><label className="sr-only" htmlFor="missing-numbers">Missing receipt numbers</label><textarea id="missing-numbers" value={missing} readOnly rows={3} className="mono" onFocus={(event) => event.target.select()}/><CopyButton value={missing} label="Copy missing numbers"/></>
        : <p className="success-text">Nothing missing. The album is complete!</p>}
    </div>}
    <div className="board-toolbar">
      <div className="segmented board-filters" aria-label="Filter collection numbers">{filters.map((item) =>
        <button key={item.value} type="button" aria-pressed={filter === item.value && !search.trim()}
          onClick={() => { setFilter(item.value); setSearch(""); }}>
          {item.label}<span>{item.count.toLocaleString()}</span>
        </button>)}</div>
      <div className="search-field"><Icon name="search" size={17}/><label className="sr-only" htmlFor="number-search">Find a receipt number</label>
        <input id="number-search" type="search" inputMode="numeric" placeholder="Find a number..." value={search}
          onChange={(event) => setSearch(event.target.value)} aria-describedby={search ? "search-result" : "search-help"}/>
      </div>
    </div>
    <div className="board-meta"><div className="board-legend"><span><i className="legend-swatch legend-missing"/>Missing</span><span><i className="legend-swatch legend-collected"/>Collected</span><span><i className="legend-swatch legend-duplicate"/>2+ copies</span></div>
      <button className="text-button expand-groups" type="button" disabled={Boolean(search.trim())} onClick={() => setOpenGroups(openGroups.size === 10 ? new Set() : new Set(Array.from({ length: 10 }, (_, index) => index)))}>{openGroups.size === 10 ? "Collapse all" : "Expand all"}</button>
      <span className="sr-only" id="search-help">Enter one to three digits to find an exact number. Select a number to see its story.</span></div>
    {search.trim() && <div className="search-summary" id="search-result" role="status">
      {validSearch ? <>Showing <strong className="mono">{formatNumber(searchedNumber!)}</strong> across all filters.</> : "Enter a number from 000 to 999. Try 7 to find 007."}
      <button className="text-button" type="button" onClick={() => setSearch("")}>Clear search</button>
    </div>}
    {!numbers.length ? <div className="board-empty"><span className="empty-icon"><Icon name={filter === "duplicates" ? "layers" : "search"} size={27}/></span>
      <h3>{search ? "No number found." : filter === "duplicates" ? "No doubles. Just possibilities." : filter === "collected" ? "Your first find belongs here." : "Every space has a story."}</h3>
      <p>{search ? "Use one to three digits to find an exact number." : filter === "collected" ? "Receipts added via PR by the collection owner will appear here." : filter === "duplicates" ? "When a number comes around again, its extra copies will appear here." : "All 1,000 numbers have been collected. What a team."}</p>
    </div> : <div className="hundred-groups">
      {Array.from({ length: 10 }, (_, group) => {
        const entries = numbers.filter((entry) => Math.floor(entry.number / 100) === group);
        if (!entries.length) return null;
        const collected = snapshot.counts.slice(group * 100, group * 100 + 100).filter((count) => count > 0).length;
        const open = Boolean(search.trim()) || openGroups.has(group);
        const label = `${formatNumber(group * 100)} - ${formatNumber(group * 100 + 99)}`;
        return <div className={`hundred-group ${open ? "group-open" : ""}`} key={group}>
          <div className="hundred-heading">
            <div className="hundred-desktop-title"><h3 className="mono">{label}</h3><span>{collected === 100 ? <><Icon name="check" size={13}/>Complete</> : `${collected} / 100 collected`}</span></div>
            <button type="button" className="hundred-toggle" aria-expanded={open} aria-controls={`hundred-${group}`} disabled={Boolean(search.trim())}
              onClick={() => setOpenGroups((previous) => { const next = new Set(previous); if (next.has(group)) next.delete(group); else next.add(group); return next; })}>
              <span className="mono">{label}</span><span className="hundred-mobile-count">{collected === 100 ? "Complete" : `${collected} / 100`}<Icon name="chevron" size={15}/></span>
            </button>
            <div className="hundred-progress" role="img" aria-label={`${label}: ${collected} of 100 collected`}><span style={{ width: `${collected}%` }}/></div>
          </div>
          <div className="number-grid" id={`hundred-${group}`}>
            {entries.map(({ number, count }) => <button type="button" key={number}
              className={`number-tile ${count === 0 ? "number-missing" : count === 1 ? "number-collected" : "number-duplicate"}`}
              onClick={() => onNumber(formatNumber(number))}
              aria-label={`${formatNumber(number)}, ${count === 0 ? "missing" : `${count} ${count === 1 ? "receipt, collected" : "receipts, duplicate"}`}. View details.`}
              title={`${formatNumber(number)} - ${count === 0 ? "Not collected yet" : `${count.toLocaleString()} ${count === 1 ? "receipt" : "receipts"}`}`}>
              {formatNumber(number)}
              {count > 1 && <span className="quantity-badge" aria-hidden="true">{count > 99 ? "99+" : count}</span>}
            </button>)}
          </div>
        </div>;
      })}
    </div>}
    <div className="board-bottom"><span><Icon name="dining" size={16}/>Collect moments. Keep the numbers.</span><span className="mono">{numbers.length.toLocaleString()} / 1,000 numbers shown</span></div>
  </section>;
}
