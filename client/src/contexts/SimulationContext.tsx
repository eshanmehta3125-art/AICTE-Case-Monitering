import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useDemoStore } from "@/contexts/DemoStore";

export type SimulationSpeed = "fast" | "steady" | "slow";
interface SimulationContextValue {
  paused: boolean;
  speed: SimulationSpeed;
  sequence: number;
  latestEventAt: string | null;
  pause(): void;
  resume(): void;
  setSpeed(speed: SimulationSpeed): void;
  triggerSampleEvent(): void;
  resetSimulation(): void;
}

const SimulationContext = createContext<SimulationContextValue | null>(null);
const BASE_DELAY: Record<SimulationSpeed, number> = { fast: 6000, steady: 7500, slow: 8500 };
const SPEED_LABEL: Record<SimulationSpeed, string> = { fast: "6–7 seconds", steady: "7.5–8.5 seconds", slow: "8.5–9.5 seconds" };

export function SimulationProvider({ children }: { children: ReactNode }) {
  const { state, dispatch } = useDemoStore();
  const [paused, setPaused] = useState(false);
  const [speed, setSpeedState] = useState<SimulationSpeed>("steady");
  const [announcement, setAnnouncement] = useState("");
  const stateRef = useRef(state);
  const dispatchRef = useRef(dispatch);
  const sequenceRef = useRef(state.simulationSequence);
  stateRef.current = state;
  dispatchRef.current = dispatch;

  useEffect(() => {
    sequenceRef.current = state.simulationSequence;
  }, [state.simulationSequence]);

  useEffect(() => {
    setPaused(false);
    setSpeedState("steady");
  }, [state.resetEpoch]);

  const dispatchNextEvent = useCallback(() => {
    const current = Math.max(sequenceRef.current, stateRef.current.simulationSequence);
    const sequence = current + 1;
    sequenceRef.current = sequence;
    dispatchRef.current({ type: "simulate-event", simulationSequence: sequence, occurredAt: new Date().toISOString() });
  }, []);

  useEffect(() => {
    if (!state.enteredDemo || paused) return undefined;
    let timer: number | undefined;
    let cancelled = false;
    const scheduleNext = () => {
      const nextSequence = sequenceRef.current + 1;
      const deterministicJitter = (nextSequence * 997) % 1001;
      timer = window.setTimeout(() => {
        if (cancelled) return;
        dispatchNextEvent();
        scheduleNext();
      }, BASE_DELAY[speed] + deterministicJitter);
    };
    scheduleNext();
    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [state.enteredDemo, state.resetEpoch, paused, speed, dispatchNextEvent]);

  const latestEventAt = useMemo(() => state.cases
    .flatMap((item) => item.history.map((entry) => entry.id.startsWith("sim-") ? entry.at : null))
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1) ?? null, [state.cases]);

  const pause = useCallback(() => {
    setPaused(true);
    setAnnouncement("Automatic synthetic events paused.");
  }, []);
  const resume = useCallback(() => {
    setPaused(false);
    setAnnouncement("Automatic synthetic events resumed.");
  }, []);
  const updateSpeed = useCallback((next: SimulationSpeed) => {
    setSpeedState(next);
    setAnnouncement(`Automatic event interval set to ${SPEED_LABEL[next]}.`);
  }, []);
  const triggerSampleEvent = useCallback(() => {
    dispatchNextEvent();
    setAnnouncement("One synthetic sample event was triggered. Linked case data and the dashboard have been refreshed.");
  }, [dispatchNextEvent]);
  const resetSimulation = useCallback(() => {
    setPaused(false);
    setSpeedState("steady");
    sequenceRef.current = 0;
    dispatchRef.current({ type: "reset" });
    setAnnouncement("The local demonstration data has been restored to its initial fictional seed.");
  }, []);

  const value = useMemo<SimulationContextValue>(() => ({
    paused,
    speed,
    sequence: state.simulationSequence,
    latestEventAt,
    pause,
    resume,
    setSpeed: updateSpeed,
    triggerSampleEvent,
    resetSimulation,
  }), [paused, speed, state.simulationSequence, latestEventAt, pause, resume, updateSpeed, triggerSampleEvent, resetSimulation]);

  return <SimulationContext.Provider value={value}>
    {children}
    <span role="status" aria-live="polite" aria-atomic="true" className="sr-only">{announcement}</span>
  </SimulationContext.Provider>;
}

export function useSimulation() {
  const value = useContext(SimulationContext);
  if (!value) throw new Error("useSimulation must be used inside SimulationProvider");
  return value;
}
