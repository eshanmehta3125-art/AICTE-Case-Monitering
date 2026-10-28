import { ArrowRight, BookOpenCheck, Play } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/layout/AppShell";
import { guideStepHref, guideSteps } from "@/components/presentation/guideSteps";
import { Panel } from "@/features/shared/ui";

export function GuideModePage() {
  const [, navigate] = useLocation();
  return <AppShell title="Guide Mode" description="A route-aware walkthrough through the synthetic institution case-monitoring demo." eyebrow="PRESENTATION MODE" action={<Button variant="outline" onClick={() => navigate("/judge")}><BookOpenCheck size={15} />Open Judge Mode</Button>}>
    <div className="presentation-page guide-page">
      <section className="presentation-hero guide-hero">
        <span className="presentation-stamp">SIH PRESENTATION · SYNTHETIC DATA</span>
        <h2>Follow one institution’s case story across the workspace.</h2>
        <p>Use the six-step tour to see how institution records, case histories, cross-Bureau coordination, workload and reports connect. The small guide card follows you between pages.</p>
        <div className="presentation-actions"><Button onClick={() => navigate(guideStepHref(0))}><Play size={15} />Start the six-step tour</Button><Button variant="outline" onClick={() => navigate("/overview")}>Open Overview</Button></div>
        <p className="presentation-disclaimer">Every person, institution, case and event shown is fictional demonstration data stored in this browser. Nothing is submitted to AICTE.</p>
      </section>
      <Panel title="Walkthrough route" description="Start at any step, or follow the recommended 4:15 story from beginning to end." className="guide-route-panel">
        <ol className="guide-step-list">{guideSteps.map((step, index) => <li className="guide-step-item" key={step.path}>
          <span className="guide-step-index">{String(index + 1).padStart(2, "0")}</span>
          <div className="guide-step-copy"><strong>{step.title}</strong><p>{step.focus}</p></div>
          <Button variant="ghost" size="sm" aria-label={`Start guided tour at ${step.title}`} onClick={() => navigate(guideStepHref(index))}>Start here<ArrowRight size={14} /></Button>
        </li>)}</ol>
      </Panel>
    </div>
  </AppShell>;
}
