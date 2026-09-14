"use client";

import { useState } from "react";
import type { Snapshot } from "@/lib/contracts";
import { exportCsv } from "@/lib/receipts";
import { ActivityList, NumberDetail } from "./activity";
import { CollectionBoard } from "./collection-board";
import { Brand, Icon, type IconName } from "./icons";
import { CompletionCard, Milestones, ProgressChart, SummaryCards, TopDuplicates } from "./insights";

type Section = "board" | "insights" | "activity";
const sections: { id: Section; title: string; icon: IconName; subtitle: string }[] = [
  { id: "board", title: "Collection board", icon: "board", subtitle: "A thousand numbers. One shared dining tradition." },
  { id: "insights", title: "A little perspective", icon: "chart", subtitle: "Small finds add up to something wonderful." },
  { id: "activity", title: "The dining journal", icon: "clock", subtitle: "Our collected receipts, ordered by the date of the meal." },
];

export function CollectionSite({ snapshot, repositoryUrl }: { snapshot: Snapshot; repositoryUrl: string | null }) {
  const [section, setSection] = useState<Section>("board");
  const [detail, setDetail] = useState<string | null>(null);
  const active = sections.find((item) => item.id === section)!;

  function navigate(next: Section) {
    setSection(next);
    requestAnimationFrame(() => document.getElementById("page-title")?.focus({ preventScroll: true }));
  }

  function download() {
    const url = URL.createObjectURL(new Blob([exportCsv(snapshot.receipts)], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "cafe-1000.csv";
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <div className="app-shell">
    <a href="#main-content" className="skip-link">Skip to collection</a>
    <aside className="sidebar" aria-label="Collection navigation">
      <Brand light/>
      <div className="sidebar-collection"><span className="eyebrow">OUR SHARED TABLE</span><strong>{snapshot.collection.name}</strong><span><Icon name="people" size={12}/>Owner-managed collection</span></div>
      <nav className="main-nav" aria-label="Main navigation">{sections.map((item) => <button key={item.id} type="button" aria-current={section === item.id ? "page" : undefined} onClick={() => navigate(item.id)}><Icon name={item.icon} size={20}/><span>{item.id === "board" ? "The board" : item.id === "insights" ? "Insights" : "Receipts"}</span>{section === item.id && <span className="nav-indicator" aria-hidden="true"/>}</button>)}
      </nav>
      <div className="sidebar-bottom"><div className="sidebar-note"><span className="sidebar-note-icon"><Icon name="dining" size={29}/></span><p>Good food.<br/><em>Better together.</em></p><span>000 &mdash; 999</span><div className="sidebar-mini-rule"/></div></div>
    </aside>
    <div className="workspace">
      <header className="topbar"><div className="breadcrumb"><Icon name="dining" size={16}/><span>{snapshot.collection.name}</span><span className="breadcrumb-slash">/</span><strong>{section === "board" ? "The board" : section === "insights" ? "Insights" : "Receipts"}</strong></div>
        <div className="topbar-actions"><button type="button" onClick={download} className="topbar-button"><Icon name="download" size={16}/><span>Export CSV</span></button>{repositoryUrl && <a href={repositoryUrl} target="_blank" rel="noreferrer" className="topbar-button"><Icon name="link" size={16}/><span>Repository</span></a>}</div>
      </header>
      <main id="main-content" className="main-content">
        <div className="page-heading"><div><div className="page-eyebrow"><span className="little-line"/>CAFE 1000 &nbsp; / &nbsp; THE COLLECTOR&apos;S EDITION</div><h1 id="page-title" tabIndex={-1}>{active.title}<span className="orange-dot">.</span></h1><p>{active.subtitle}</p></div>
        </div>
        <div className="static-notice"><Icon name="receipt" size={20}/><p>This is a read-only collection. Receipts are added via PR by the collection owner. Merged changes appear after the next deployment.</p></div>
        {section === "board" && <CompletionCard snapshot={snapshot}/>}
        <SummaryCards snapshot={snapshot}/>
        {section === "board" && <div className="dashboard-columns"><CollectionBoard snapshot={snapshot} onNumber={setDetail}/><aside className="dashboard-rail" aria-label="Collection highlights">
          <ProgressChart receiptProgress={snapshot.receiptProgress} undatedReceipts={snapshot.undatedReceipts} compact/>
          <TopDuplicates snapshot={snapshot} onNumber={setDetail}/>
          <ActivityList receipts={snapshot.receipts} compact onNumber={setDetail} onViewAll={() => navigate("activity")}/>
          <div className="rail-note"><Icon name="dining" size={21}/><span>The best collections<br/>are built <em>together.</em></span></div>
        </aside></div>}
        {section === "insights" && <div className="insights-grid"><div className="insights-main"><ProgressChart receiptProgress={snapshot.receiptProgress} undatedReceipts={snapshot.undatedReceipts}/><Milestones snapshot={snapshot}/></div><div className="insights-side"><CompletionCard snapshot={snapshot}/><TopDuplicates snapshot={snapshot} onNumber={setDetail}/></div></div>}
        {section === "activity" && <ActivityList receipts={snapshot.receipts} onNumber={setDetail}/>}
        <footer className="page-footer"><span>Made of shared meals &amp; little victories.</span><span>Static snapshot &middot; Changes reviewed in Git</span></footer>
      </main>
    </div>
    {detail && <NumberDetail number={detail} count={snapshot.counts[Number(detail)]} receipts={snapshot.receipts.filter((receipt) => receipt.number === Number(detail))} onClose={() => setDetail(null)}/>}
  </div>;
}
