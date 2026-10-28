import { createContext, useContext, useEffect, useMemo, useReducer, type Dispatch, type ReactNode } from "react";
import { createSeedState } from "@/data/seed";
import { simulateDemoEvent } from "@/services/simulation";
import type { ActionEntry, CaseRecord, DemoAction, DemoState } from "@/types/domain";

const STORAGE_KEY = "aicte-demo-case-monitor-v1";
const DemoStoreContext = createContext<{ state: DemoState; dispatch: Dispatch<DemoAction> } | null>(null);

function loadInitialState(): DemoState {
  if (typeof window === "undefined") return createSeedState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createSeedState();
    const parsed = JSON.parse(raw) as DemoState;
    if (!Array.isArray(parsed.institutions) || !Array.isArray(parsed.cases) || !parsed.reviewOutcomes) return createSeedState();
    return {
      ...createSeedState(),
      ...parsed,
      simulationSequence: Number.isSafeInteger(parsed.simulationSequence) ? parsed.simulationSequence : 0,
      resetEpoch: Number.isSafeInteger(parsed.resetEpoch) ? parsed.resetEpoch : 0,
    };
  } catch {
    return createSeedState();
  }
}

const newEntry = (summary: string, kind: ActionEntry["kind"], actor: string, bureau: ActionEntry["bureau"]): ActionEntry => ({
  id: `action-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  at: new Date().toISOString(),
  kind,
  summary,
  actor,
  bureau,
});

function touchInstitutionActivity(institutions: DemoState["institutions"], institutionId: string, activityDate: string) {
  return institutions.map((institution) => institution.id === institutionId
    ? { ...institution, lastActivity: !institution.lastActivity || institution.lastActivity < activityDate ? activityDate : institution.lastActivity }
    : institution);
}

function updateCase(state: DemoState, caseId: string, update: (item: CaseRecord) => CaseRecord) {
  const current = state.cases.find((item) => item.id === caseId);
  if (!current) return state;
  const updated = update(current);
  const activityDate = updated.lastActionAt ?? new Date().toISOString().slice(0, 10);
  return {
    ...state,
    cases: state.cases.map((item) => item.id === caseId ? updated : item),
    institutions: touchInstitutionActivity(state.institutions, updated.institutionId, activityDate),
  };
}

function reducer(state: DemoState, action: DemoAction): DemoState {
  if (action.type === "reset") return { ...createSeedState(), resetEpoch: state.resetEpoch + 1 };
  if (action.type === "enter") return { ...state, enteredDemo: true };
  if (action.type === "set-role" && action.role) return { ...state, role: action.role };
  if (action.type === "simulate-event" && action.simulationSequence !== undefined && action.occurredAt) {
    return simulateDemoEvent(state, action.simulationSequence, action.occurredAt);
  }
  if (action.type === "mark-read" && action.alertId) return { ...state, readAlertIds: state.readAlertIds.includes(action.alertId) ? state.readAlertIds : [...state.readAlertIds, action.alertId] };
  if (action.type === "review-overlap" && action.overlapId && action.outcome) {
    const next = { ...state, reviewOutcomes: { ...state.reviewOutcomes, [action.overlapId]: action.outcome } };
    if (!action.caseId) return next;
    const reviewCase = state.cases.find((entry) => entry.id === action.caseId);
    if (!reviewCase) return next;
    const outcomeText = action.outcome === "no-conflict" ? "Reviewed — no conflict" : action.outcome === "duplicate" ? "Confirmed duplicate by human reviewer" : action.outcome === "related" ? "Confirmed related cases; records remain separate" : "Review returned to pending";
    const activityDate = new Date().toISOString().slice(0, 10);
    return {
      ...next,
      cases: state.cases.map((entry) => entry.id === reviewCase.id ? { ...entry, lastAction: `Overlap review: ${outcomeText}`, lastActionAt: activityDate, history: [newEntry(`${outcomeText}. Reviewer role: ${state.role}.`, "Coordination", state.role, entry.bureau), ...entry.history] } : entry),
      institutions: touchInstitutionActivity(next.institutions, reviewCase.institutionId, activityDate),
    };
  }
  if (!action.caseId) return state;
  const item = state.cases.find((entry) => entry.id === action.caseId);
  if (!item) return state;
  const actor = state.role;
  if (action.type === "update-status" && action.status) {
    return updateCase(state, item.id, (current) => ({ ...current, status: action.status!, lastAction: `Status updated to ${action.status}`, lastActionAt: new Date().toISOString().slice(0, 10), history: [newEntry(`Status updated to ${action.status}.`, "Status update", actor, current.bureau), ...current.history] }));
  }
  if (action.type === "assign" && action.officer) {
    return updateCase(state, item.id, (current) => ({ ...current, officer: action.officer!, lastAction: `Assigned to ${action.officer}`, lastActionAt: new Date().toISOString().slice(0, 10), history: [newEntry(`Assigned to ${action.officer}.`, "Assignment", actor, current.bureau), ...current.history] }));
  }
  if (action.type === "transfer" && action.bureau) {
    return updateCase(state, item.id, (current) => ({ ...current, bureau: action.bureau!, status: "Transferred", awaitingBureau: undefined, lastAction: `Transferred to ${action.bureau}`, lastActionAt: new Date().toISOString().slice(0, 10), history: [newEntry(`Transferred from ${current.bureau} to ${action.bureau}.`, "Transfer", actor, action.bureau!), ...current.history] }));
  }
  if (action.type === "escalate") {
    return updateCase(state, item.id, (current) => ({ ...current, status: "Escalated", lastAction: "Escalated for resolution", lastActionAt: new Date().toISOString().slice(0, 10), history: [newEntry("Escalated for resolution by demo user.", "Escalation", actor, current.bureau), ...current.history] }));
  }
  if (action.type === "add-note" && action.note?.trim()) {
    return updateCase(state, item.id, (current) => ({ ...current, lastAction: "Coordination note added", lastActionAt: new Date().toISOString().slice(0, 10), history: [newEntry(action.note!.trim(), "Note", actor, current.bureau), ...current.history] }));
  }
  if (action.type === "link-cases" && action.otherCaseId && action.otherCaseId !== item.id) {
    const target = state.cases.find((entry) => entry.id === action.otherCaseId);
    if (!target) return state;
    const activityDate = new Date().toISOString().slice(0, 10);
    const cases = state.cases.map((current) => {
      if (current.id === item.id) return { ...current, relatedCaseIds: [...new Set([...current.relatedCaseIds, target.id])], lastAction: `Linked related case ${target.id}`, lastActionAt: activityDate, history: [newEntry(`Linked related case ${target.id}.`, "Related case", actor, current.bureau), ...current.history] };
      if (current.id === target.id) return { ...current, relatedCaseIds: [...new Set([...current.relatedCaseIds, item.id])], lastAction: `Linked related case ${item.id}`, lastActionAt: activityDate, history: [newEntry(`Linked related case ${item.id}.`, "Related case", actor, current.bureau), ...current.history] };
      return current;
    });
    const institutions = touchInstitutionActivity(touchInstitutionActivity(state.institutions, item.institutionId, activityDate), target.institutionId, activityDate);
    return { ...state, cases, institutions };
  }
  return state;
}

export function DemoStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitialState);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* The demo remains usable if storage is unavailable. */ }
  }, [state]);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <DemoStoreContext.Provider value={value}>{children}</DemoStoreContext.Provider>;
}

export function useDemoStore() {
  const value = useContext(DemoStoreContext);
  if (!value) throw new Error("useDemoStore must be used inside DemoStoreProvider");
  return value;
}
