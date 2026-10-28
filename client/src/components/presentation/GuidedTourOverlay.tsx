import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { guideStepHref, guideSteps } from "@/components/presentation/guideSteps";

export function GuidedTourOverlay() {
  const [, navigate] = useLocation();
  const params = new URLSearchParams(window.location.search);
  if (params.get("guided") !== "1") return null;

  const parsedStep = Number(params.get("step") ?? "0");
  const stepIndex = Number.isFinite(parsedStep) ? Math.min(Math.max(parsedStep, 0), guideSteps.length - 1) : 0;
  const step = guideSteps[stepIndex];
  const progress = Math.round(((stepIndex + 1) / guideSteps.length) * 100);
  const finish = stepIndex === guideSteps.length - 1;

  return <aside className="guided-tour-card" aria-labelledby="guided-tour-title" aria-live="polite">
    <div className="guided-tour-topline">
      <span>GUIDED TOUR <i aria-hidden="true">·</i> SYNTHETIC DATA</span>
      <button type="button" className="guided-tour-close" aria-label="Exit guided tour" onClick={() => navigate("/overview")}><X size={15} /></button>
    </div>
    <div className="guided-tour-progress-copy"><strong>Step {stepIndex + 1} of {guideSteps.length}</strong><span>{progress}%</span></div>
    <div className="guided-tour-progress" role="progressbar" aria-label="Guided tour progress" aria-valuemin={0} aria-valuemax={guideSteps.length} aria-valuenow={stepIndex + 1} aria-valuetext={`Step ${stepIndex + 1} of ${guideSteps.length}`}><span style={{ width: `${progress}%` }} /></div>
    <h2 id="guided-tour-title">{step.title}</h2>
    <p className="guided-tour-description">{step.description}</p>
    <div className="guided-tour-focus"><strong>On this screen</strong><span>{step.focus}</span></div>
    <div className="guided-tour-actions">
      <Button variant="outline" size="sm" disabled={stepIndex === 0} onClick={() => navigate(guideStepHref(stepIndex - 1))}><ArrowLeft size={14} />Previous</Button>
      <Button size="sm" onClick={() => navigate(finish ? "/overview" : guideStepHref(stepIndex + 1))}>{finish ? "Finish tour" : "Next step"}{!finish && <ArrowRight size={14} />}</Button>
    </div>
    <button type="button" className="guided-tour-exit" onClick={() => navigate("/overview")}>Exit tour</button>
  </aside>;
}
