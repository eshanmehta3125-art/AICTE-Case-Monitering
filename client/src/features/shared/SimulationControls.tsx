import { useState } from "react";
import { Activity, CirclePause, Play, RotateCcw, Zap } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useSimulation, type SimulationSpeed } from "@/contexts/SimulationContext";

const speedOptions: { value: SimulationSpeed; label: string }[] = [
  { value: "fast", label: "Fast · 6–7 sec" },
  { value: "steady", label: "Normal · 7.5–8.5 sec" },
  { value: "slow", label: "Slow · 8.5–9.5 sec" },
];

export function SimulationControls({ compact = false }: { compact?: boolean }) {
  const { paused, speed, sequence, pause, resume, setSpeed, triggerSampleEvent, resetSimulation } = useSimulation();
  const [resetOpen, setResetOpen] = useState(false);

  const trigger = () => {
    triggerSampleEvent();
    toast.success("One linked sample event was added to the demonstration stream.");
  };
  const confirmReset = () => {
    resetSimulation();
    setResetOpen(false);
    toast.success("Synthetic seed state restored. No official record was changed.");
  };

  return <>
    <section className={`simulation-controls ${compact ? "simulation-controls-compact" : ""}`} aria-labelledby="simulation-control-title">
      <div className="simulation-control-header">
        <div className="simulation-status-group"><span className={`simulation-live-dot ${paused ? "paused" : "running"}`} aria-hidden="true" /><div><strong id="simulation-control-title">Live demo controls</strong><small>LIVE DEMO · SIMULATED DATA</small></div></div>
        <span className="simulation-event-count">{sequence} simulated {sequence === 1 ? "event" : "events"}</span>
      </div>
      <div className="simulation-control-actions">
        <Button type="button" size="sm" variant="outline" className="simulation-pause-button" onClick={paused ? resume : pause} aria-label={paused ? "Resume automatic simulated events" : "Pause automatic simulated events"}>{paused ? <Play size={14} aria-hidden="true" /> : <CirclePause size={14} aria-hidden="true" />}{paused ? "Resume" : "Pause"}</Button>
        <label className="simulation-speed"><span>Event interval</span><select value={speed} onChange={(event) => setSpeed(event.target.value as SimulationSpeed)} aria-label="Automatic event interval">{speedOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        <Button type="button" size="sm" className="simulation-trigger-button" onClick={trigger}><Zap size={14} aria-hidden="true" />Trigger sample event</Button>
        {!compact && <Button type="button" size="sm" variant="ghost" className="simulation-reset-button" onClick={() => setResetOpen(true)}><RotateCcw size={14} aria-hidden="true" />Reset</Button>}
      </div>
      {!compact && <p className="simulation-control-footer"><Activity size={13} aria-hidden="true" /> All activity is synthetic and stored only in this browser.</p>}
    </section>
    {!compact && <AlertDialog open={resetOpen} onOpenChange={setResetOpen}><AlertDialogContent className="dialog-glass"><AlertDialogHeader><AlertDialogTitle>Reset the demonstration scenario?</AlertDialogTitle><AlertDialogDescription>All local sample events, generated cases, case actions, role selection, review decisions, and notification read state will return to the original fictional seed. No AICTE system is connected.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmReset}>Restore initial demo</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>}
  </>;
}
