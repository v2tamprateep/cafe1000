"use client";

import { useId } from "react";
import type { Snapshot } from "@/lib/contracts";
import { formatNumber } from "@/lib/receipts";
import { Icon, type IconName } from "./icons";
import { shortDate } from "./ui";

export function SummaryCards({ snapshot }: { snapshot: Snapshot }) {
  const cards: { label: string; value: number; note: string; icon: IconName; tone: string }[] = [
    { label: "Total receipts", value: snapshot.stats.total, note: "Every meal, counted", icon: "receipt", tone: "cream" },
    { label: "Unique numbers", value: snapshot.stats.unique, note: "Little spaces filled", icon: "board", tone: "green" },
    { label: "Extra copies", value: snapshot.stats.duplicates, note: `${snapshot.stats.duplicateNumbers.toLocaleString()} numbers with duplicates`, icon: "layers", tone: "orange" },
    { label: "Still to discover", value: snapshot.stats.missing, note: "The next one could be yours", icon: "search", tone: "neutral" },
  ];
  return <section className="summary-grid" aria-label="Collection at a glance">
    {cards.map((card) => <div className={`summary-card summary-${card.tone}`} key={card.label}>
      <div className="summary-card-top"><span>{card.label}</span><span className={`stat-icon stat-icon-${card.tone}`}><Icon name={card.icon} size={19}/></span></div>
      <strong className="stat-value">{card.value.toLocaleString()}</strong><span className="stat-note">{card.note}</span>
    </div>)}
  </section>;
}

export function CompletionCard({ snapshot }: { snapshot: Snapshot }) {
  const percent = snapshot.stats.completion;
  const complete = percent === 100;
  const next = snapshot.stats.unique < 100 ? 100 : snapshot.stats.unique < 500 ? 500 : 1000;
  return <section className="completion-card" aria-labelledby="completion-title">
    <div className="completion-copy"><p className="eyebrow">A SHARED LITTLE OBSESSION</p>
      <h2 id="completion-title">{complete ? <>One thousand numbers.<br/><em>One incredible team.</em></> : <>More than a meal.<br/><em>A little piece of the collection.</em></>}</h2>
      <p>{complete ? "Every space filled. Every receipt part of the story. Here's to all the meals we shared along the way."
        : snapshot.stats.unique === 0 ? "Our story starts with a single receipt. Your next meal could be the first page."
          : `${snapshot.stats.unique.toLocaleString()} numbers found, ${snapshot.stats.missing.toLocaleString()} waiting. Let's see what the next meal brings.`}</p>
    </div>
    <div className="completion-visual">
      <div className="completion-donut">
        <svg viewBox="0 0 180 180" role="img" aria-label={`Collection ${percent.toFixed(1)} percent complete. ${snapshot.stats.unique} of 1000 unique numbers collected.`}>
          <circle className="donut-track" cx="90" cy="90" r="73"/>
          <circle className="donut-progress" cx="90" cy="90" r="73" pathLength="100"
            strokeDasharray={`${percent} ${100 - percent}`} strokeDashoffset="0" transform="rotate(-90 90 90)"/>
          <circle className="donut-inner" cx="90" cy="90" r="60"/>
        </svg>
        <div className="donut-label" aria-hidden="true"><Icon name={complete ? "check" : "dining"} size={19}/><strong>{Number(percent.toFixed(1))}<span>%</span></strong><span>COLLECTED</span></div>
      </div>
      <p className="completion-next">{complete ? <><Icon name="spark" size={14}/>The album is complete</> : <><span className="next-dot"/>{next - snapshot.stats.unique} to the {next.toLocaleString()} milestone</>}</p>
    </div>
    <span className="completion-orbit completion-orbit-one" aria-hidden="true"/><span className="completion-orbit completion-orbit-two" aria-hidden="true"/>
  </section>;
}

export function ProgressChart({ receiptProgress, undatedReceipts, compact = false }: {
  receiptProgress: Snapshot["receiptProgress"]; undatedReceipts: number; compact?: boolean;
}) {
  const chartId = useId();
  const points = receiptProgress;
  const width = 600;
  const height = 215;
  const left = 43;
  const right = 584;
  const top = 22;
  const bottom = 177;
  const max = Math.max(4, Math.ceil(Math.max(...points.map((point) => Math.max(point.total, point.unique)), 0) / 4) * 4);
  const firstDay = points.length ? new Date(`${points[0].date}T00:00:00Z`).getTime() : 0;
  const lastDay = points.length ? new Date(`${points[points.length - 1].date}T00:00:00Z`).getTime() : 0;
  const x = (date: string) => firstDay === lastDay ? (left + right) / 2
    : left + (new Date(`${date}T00:00:00Z`).getTime() - firstDay) / (lastDay - firstDay) * (right - left);
  const y = (value: number) => bottom - value / max * (bottom - top);
  const path = (key: "total" | "unique") => points.map((point, index) => `${index === 0 ? "M" : "L"}${x(point.date)},${y(point[key])}`).join(" ");
  const latest = points[points.length - 1];
  return <section className={`panel progress-panel ${compact ? "progress-compact" : ""}`} aria-labelledby={`${chartId}-heading`}>
    <div className="panel-heading"><div><p className="eyebrow">MEAL BY MEAL, NUMBER BY NUMBER</p><h2 id={`${chartId}-heading`}>The story so far</h2></div><span className="subtle-pill">All time</span></div>
    <div className="chart-date-basis">Timeline: receipt dates</div>
    <div className="chart-legend"><span><i className="chart-key chart-key-unique"/>Unique numbers</span><span><i className="chart-key chart-key-total"/>Total receipts</span></div>
    <figure className="chart-figure">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby={`${chartId}-title ${chartId}-desc`}>
        <title id={`${chartId}-title`}>Collection progress over time</title>
        <desc id={`${chartId}-desc`}>{latest
          ? `Daily cumulative receipt totals and unique numbers by receipt date across ${points.length} days. Latest: ${latest.total} receipts and ${latest.unique} unique numbers on ${latest.date}. Solid green shows unique numbers; dashed orange shows total receipts. A data table follows.`
          : "No dated receipts recorded yet. The chart will begin with your first dated receipt."}</desc>
        {[0, 1, 2, 3, 4].map((tick) => <g key={tick}><line x1={left} x2={right} y1={y(max * tick / 4)} y2={y(max * tick / 4)} className="chart-grid-line"/>{points.length > 0 && <text x={left - 11} y={y(max * tick / 4) + 4} textAnchor="end" className="chart-axis-label">{(max * tick / 4).toLocaleString()}</text>}</g>)}
        {points.length > 0 && <>
          {points.length > 1 && <path d={`${path("unique")} L${x(latest.date)},${bottom} L${x(points[0].date)},${bottom} Z`} className="chart-area"/>}
          <path d={path("total")} className="chart-line chart-total"/>
          <path d={path("unique")} className="chart-line chart-unique"/>
          <circle cx={x(latest.date)} cy={y(latest.total)} r={5} className="chart-dot-total"/>
          <circle cx={x(latest.date)} cy={y(latest.unique)} r={3.5} className="chart-dot-unique"/>
          <text x={points.length === 1 ? (left + right) / 2 : left} y={204} textAnchor={points.length === 1 ? "middle" : "start"} className="chart-axis-label">{shortDate(points[0].date)}</text>
          {points.length > 1 && <text x={right} y={204} textAnchor="end" className="chart-axis-label">{shortDate(latest.date)}</text>}
        </>}
      </svg>
      {points.length === 0 && <div className="chart-empty"><span><Icon name="chart" size={24}/></span><strong>Every story starts somewhere.</strong><p>The timeline begins with the first dated receipt.</p></div>}
      <figcaption className="chart-caption">By receipt date in the current collection.{undatedReceipts > 0 && <> {undatedReceipts.toLocaleString()} undated {undatedReceipts === 1 ? "receipt is" : "receipts are"} included in collection totals, but excluded from this timeline.</>}</figcaption>
    </figure>
    {points.length > 0 && <details className="chart-data"><summary>View chart data <Icon name="chevron" size={13}/></summary><div className="table-scroll"><table><caption className="sr-only">Daily cumulative collection progress</caption><thead><tr><th scope="col">Date</th><th scope="col">Total receipts</th><th scope="col">Unique numbers</th></tr></thead>
      <tbody>{points.map((point) => <tr key={point.date}><th scope="row">{shortDate(point.date)}</th><td>{point.total.toLocaleString()}</td><td>{point.unique.toLocaleString()}</td></tr>)}</tbody></table></div></details>}
  </section>;
}

export function TopDuplicates({ snapshot, onNumber }: { snapshot: Snapshot; onNumber: (number: string) => void }) {
  const items = snapshot.topDuplicates.slice(0, 5);
  return <section className="panel duplicates-panel" aria-labelledby="duplicates-title">
    <div className="panel-heading"><div><p className="eyebrow">FAMILIAR FACES</p><h2 id="duplicates-title">Back for another</h2></div><span className="soft-icon"><Icon name="layers" size={21}/></span></div>
    <p className="panel-description">Some numbers love our company.</p>
    {items.length ? <ol className="duplicate-ranking">{items.map((item, index) => <li key={item.number}>
      <button type="button" onClick={() => onNumber(item.number)}><span className="rank-position">{String(index + 1).padStart(2, "0")}</span><span className="rank-number mono">{item.number}</span>
        <span className="rank-bar"><span style={{ width: `${item.count / items[0].count * 100}%` }}/></span>
        <span className="rank-count">{item.count.toLocaleString()}<small>copies</small></span><Icon name="chevron" size={14}/>
      </button>
    </li>)}</ol> : <div className="duplicate-empty"><div className="duplicate-empty-art" aria-hidden="true"><span>?</span><span>?</span></div><h3>No repeat visitors. Yet.</h3><p>Our most-collected numbers will find a home right here.</p></div>}
    <div className="panel-bottom-note"><Icon name="spark" size={15}/>{snapshot.stats.duplicates ? `${snapshot.stats.duplicates.toLocaleString()} extra copies, each part of the story.` : "Even a duplicate comes with a good meal."}</div>
  </section>;
}

export function Milestones({ snapshot }: { snapshot: Snapshot }) {
  const unique = snapshot.stats.unique;
  const milestones = [
    { count: 1, title: "The first bite", description: "One receipt. A new tradition." },
    { count: 100, title: "A hundred little wins", description: "The collection is taking shape." },
    { count: 500, title: "Halfway to wonderful", description: "Five hundred stories, and counting." },
    { count: 1000, title: "The full house", description: "Every single number. Together." },
  ];
  return <section className="panel milestones-panel" aria-labelledby="milestone-title"><div className="panel-heading"><div><p className="eyebrow">WORTH A LITTLE CELEBRATION</p><h2 id="milestone-title">Along the way</h2></div><Icon name="target" size={23}/></div>
    <div className="milestone-list">{milestones.map((milestone) => <div key={milestone.count} className={`milestone ${unique >= milestone.count ? "milestone-done" : ""}`}><span className="milestone-symbol"><Icon name={unique >= milestone.count ? "check" : "dining"} size={18}/></span><div><strong>{milestone.title}</strong><p>{milestone.description}</p></div><span className="milestone-target">{unique >= milestone.count ? "Reached" : `${milestone.count.toLocaleString()} unique`}</span></div>)}</div>
    <div className="hundred-milestones"><h3>The hundred club</h3><p className="muted small">Collect every number in a hundred to complete a chapter.</p><div className="hundred-chapters">{Array.from({ length: 10 }, (_, group) => {
      const count = snapshot.counts.slice(group * 100, group * 100 + 100).filter((quantity) => quantity > 0).length;
      return <div className={`hundred-chapter ${count === 100 ? "chapter-done" : ""}`} key={group}><span className="mono">{formatNumber(group * 100)}-{formatNumber(group * 100 + 99)}</span><strong>{count === 100 ? <><Icon name="check" size={14}/>Complete</> : `${count}/100`}</strong></div>;
    })}</div></div>
  </section>;
}
