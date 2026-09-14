"use client";

import type { ReceiptInput } from "@/lib/contracts";
import { formatNumber } from "@/lib/receipts";
import { Icon } from "./icons";
import { Dialog, shortDate } from "./ui";

function newestFirst(receipts: ReceiptInput[]) {
  return [...receipts].sort((a, b) => (b.receiptDate ?? "").localeCompare(a.receiptDate ?? "") || a.number - b.number);
}

function ReceiptDate({ date }: { date?: string }) {
  return date ? <time dateTime={date}>{shortDate(date)}</time> : <>Receipt date not recorded</>;
}

export function ActivityList({ receipts, compact = false, onNumber, onViewAll }: {
  receipts: ReceiptInput[];
  compact?: boolean;
  onNumber: (number: string) => void;
  onViewAll?: () => void;
}) {
  const ordered = newestFirst(receipts);
  const visible = compact ? ordered.slice(0, 5) : ordered;
  return <section className={`panel activity-panel ${compact ? "activity-compact" : ""}`} aria-labelledby={compact ? "recent-activity-title" : "activity-title"}>
    <div className="panel-heading"><div><p className="eyebrow">FROM OUR SHARED MEALS</p><h2 id={compact ? "recent-activity-title" : "activity-title"}>{compact ? "Latest receipt dates" : "The collection journal"}</h2></div>
      {compact && onViewAll ? <button className="text-button" type="button" onClick={onViewAll}>View all<Icon name="arrow" size={15}/></button> : <Icon name="clock" size={23}/>}
    </div>
    {!compact && <p className="panel-description">Current receipts grouped by number and receipt date; undated receipts appear last. For who changed what and when, see the repository&apos;s pull requests and Git history.</p>}
    {!visible.length ? <div className="activity-empty"><span className="empty-icon"><Icon name="receipt" size={27}/></span><h3>A fresh page, just for us.</h3><p>Receipts will appear here after the collection owner adds them via PR.</p></div>
      : <ol className="activity-list">{visible.map((receipt) => <li key={`${receipt.number}:${receipt.receiptDate ?? ""}`}>
        <span className="event-symbol"><Icon name="receipt" size={18}/></span>
        <div className="event-body"><p>Receipt <button type="button" className="event-number mono" onClick={() => onNumber(formatNumber(receipt.number))}>{formatNumber(receipt.number)}</button><span className="event-quantity">{receipt.quantity.toLocaleString()} {receipt.quantity === 1 ? "copy" : "copies"}</span></p>
          <div className="event-meta"><ReceiptDate date={receipt.receiptDate}/></div>
        </div>
      </li>)}</ol>}
    {compact && <div className="panel-bottom-note"><Icon name="people" size={15}/>Small finds. Reviewed together.</div>}
  </section>;
}

export function NumberDetail({ number, count, receipts, onClose }: {
  number: string;
  count: number;
  receipts: ReceiptInput[];
  onClose: () => void;
}) {
  return <Dialog title={`The story of ${number}`} eyebrow="A LITTLE PIECE OF THE ALBUM" onClose={onClose} wide>
    <div className="number-detail-summary"><div className={`detail-number mono ${count === 0 ? "detail-missing" : count === 1 ? "detail-collected" : "detail-duplicate"}`}>{number}</div>
      <div><span className={`status-pill ${count ? "status-collected" : ""}`}>{count === 0 ? "Still to discover" : count === 1 ? "Collected" : "Collected, with extra copies"}</span>
        <h3>{count.toLocaleString()} {count === 1 ? "receipt" : "receipts"}</h3><p className="muted">{count === 0 ? "Your next meal could come with this number on the receipt." : `${Math.max(0, count - 1).toLocaleString()} extra copies. Every one counts.`}</p>
      </div>
    </div>
    <div className="detail-history-heading"><h3>Receipt dates</h3><span className="muted small">Current collection</span></div>
    {!receipts.length ? <div className="detail-empty"><Icon name="clock" size={24}/><p>No receipts yet. Be the first to find this one.</p></div>
      : <ol className="detail-history">{newestFirst(receipts).map((receipt) => <li key={receipt.receiptDate ?? ""}><span className="detail-event-count">{receipt.quantity.toLocaleString()}</span><div><strong>{receipt.quantity === 1 ? "Receipt" : "Receipts"}</strong><span className="event-meta"><ReceiptDate date={receipt.receiptDate}/></span></div></li>)}</ol>}
    <p className="dialog-fine-print">Receipt additions and corrections are made via PR by the collection owner.</p>
  </Dialog>;
}
