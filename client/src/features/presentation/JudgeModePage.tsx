import { ArrowRight, BookOpenCheck, Database, ShieldCheck } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/layout/AppShell";
import { guideStepHref } from "@/components/presentation/guideSteps";
import { Panel } from "@/features/shared/ui";

const runbook = [
  { time: "0:30", title: "Frame the problem", body: "Explain why an institution-centred view helps staff understand case history across teams.", step: 0 },
  { time: "0:45", title: "Start from the Overview", body: "Point out derived counts, the review queue and recent actions; call out the synthetic-data label.", step: 0 },
  { time: "0:45", title: "Open Institution 360°", body: "Show one institution identity consolidating separate cases and team history.", step: 1 },
  { time: "1:00", title: "Review a potential overlap", body: "Show the match reason, case relationships and human review choices; no automatic merge occurs.", step: 3 },
  { time: "0:45", title: "Check workload and reports", body: "Compare illustrative Bureau workload and a filtered report or CSV export.", step: 4 },
  { time: "0:30", title: "Close with the boundary", body: "State that live integrations, authentication and production authorization are future work, not implemented here.", step: 5 },
];

const prototypeLayers = ["React + TypeScript interface", "Local DemoStore state", "Synthetic browser-local storage"];
const proposedLayers = ["Approved source APIs", "Authenticated service + server-side authorization", "Central case database + auditable history", "Reviewed document storage + notifications"];

function ArchitectureFlow({ title, label, layers, proposed = false }: { title: string; label: string; layers: string[]; proposed?: boolean }) {
  return <section className={`judge-architecture-lane ${proposed ? "proposed" : "implemented"}`}>
    <div className="judge-architecture-heading"><strong>{title}</strong><span>{label}</span></div>
    <ol className="judge-architecture-flow">{layers.map((layer, index) => <li key={layer}><span>{layer}</span>{index < layers.length - 1 && <ArrowRight size={14} aria-hidden="true" />}</li>)}</ol>
  </section>;
}

export function JudgeModePage() {
  const [, navigate] = useLocation();
  return <AppShell title="Judge Mode" description="A concise SIH presentation brief: problem, demonstrated workflow, evidence and implementation boundary." eyebrow="SIH PRESENTATION" action={<Button variant="outline" onClick={() => navigate("/guide")}><BookOpenCheck size={15} />Open Guide Mode</Button>}>
    <div className="presentation-page judge-page">
      <section className="presentation-hero judge-hero">
        <div className="judge-hero-copy"><span className="presentation-stamp">PROTOTYPE DEMONSTRATION · ALL DATA SYNTHETIC</span><h2>One institution-centred view of complaint and regulatory casework.</h2><p>This prototype demonstrates how an operations team could find an institution’s related records, understand team ownership and coordinate a human review across Bureaus.</p><div className="presentation-actions"><Button onClick={() => navigate(guideStepHref(0))}><BookOpenCheck size={15} />Start judge walkthrough</Button><Button variant="outline" onClick={() => navigate("/overview")}>Open demo Overview</Button></div></div>
        <aside className="judge-problem-card"><span className="judge-card-kicker">PROBLEM BEING ADDRESSED</span><strong>Case histories and coordination needs are difficult to see together when institution records sit across separate workflows.</strong><p>The demo brings the institution identity, linked case records and human-review status into one operational story.</p></aside>
      </section>

      <div className="judge-evidence-grid">
        <Panel title="What the prototype demonstrates" description="Working product behavior in a fictional, browser-local workspace.">
          <div className="judge-capability-list"><article><span>01</span><div><strong>Institution-level history</strong><p>One profile consolidates its cases, Bureaus, status history and last activity.</p></div></article><article><span>02</span><div><strong>Explainable coordination</strong><p>Deterministic identity matching surfaces candidates for people to review; it does not decide or merge automatically.</p></div></article><article><span>03</span><div><strong>Operational follow-through</strong><p>Local actions update shared demo history, workload, alerts and filtered reports consistently.</p></div></article></div>
        </Panel>
        <Panel title="A 4:15 judge runbook" description="Use the buttons to start the persistent guided tour at each point.">
          <ol className="judge-runbook">{runbook.map((item) => <li key={item.title}><span className="judge-runbook-time">{item.time}</span><div><strong>{item.title}</strong><p>{item.body}</p></div><Button variant="ghost" size="icon" aria-label={`Start guided tour: ${item.title}`} onClick={() => navigate(guideStepHref(item.step))}><ArrowRight size={15} /></Button></li>)}</ol>
        </Panel>
      </div>

      <Panel title="Architecture boundary" description="The two lanes are intentionally separated: the lower lane is not connected or authorized in this demo.">
        <div className="judge-architecture"><ArchitectureFlow title="Implemented in this prototype" label="Synthetic · local · no network integration" layers={prototypeLayers} /><ArchitectureFlow title="Proposed for a future authorized deployment" label="Conceptual only · requires institutional approval and engineering" layers={proposedLayers} proposed /></div>
        <div className="judge-boundary-note"><ShieldCheck size={17} /><p><strong>Not a production system:</strong> there is no real AICTE API, live case data, sign-in, server-side role enforcement or persistent institutional database. A production implementation would need approved interfaces, security review, privacy and retention rules, server-side authorization, auditability and operational ownership.</p></div>
      </Panel>

      <div className="judge-footer-note"><Database size={15} /><span>Use this mode to present an SIH prototype; do not represent it as an official AICTE service or a live integration.</span></div>
    </div>
  </AppShell>;
}
