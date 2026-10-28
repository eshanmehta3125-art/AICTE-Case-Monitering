import { describe, expect, it } from "vitest";
import { createSeedState } from "../data/seed";
import { getAlerts, getCounts, findOverlapCandidates } from "./analytics";
import { simulateDemoEvent } from "./simulation";

function occurredAt(sequence: number) {
  return new Date(Date.UTC(2026, 9, 27 + Math.floor((sequence - 1) / 4), 12)).toISOString();
}

describe("demo simulation event engine", () => {
  it("creates a coherent synthetic complaint with a valid institution and identity-based overlap candidate", () => {
    const seed = createSeedState();
    const next = simulateDemoEvent(seed, 1, "2026-10-27T12:00:00.000Z");
    const created = next.cases.find((item) => item.id === "SIM-2026-00001");

    expect(next.cases).toHaveLength(seed.cases.length + 1);
    expect(created?.institutionId).toBe("inst-10024");
    expect(next.institutions.some((item) => item.id === created?.institutionId)).toBe(true);
    expect(created?.history[0]?.kind).toBe("Received");
    expect(created?.history[0]?.at).toBe("2026-10-27T12:00:00.000Z");
    expect(findOverlapCandidates(next.institutions, next.cases, next.reviewOutcomes)
      .some((candidate) => candidate.caseIds.includes(created?.id ?? ""))).toBe(true);
    expect(getCounts(next.cases).total).toBe(next.cases.length);
  });

  it("is deterministic and ignores duplicate or out-of-order sequence numbers", () => {
    const seed = createSeedState();
    const first = simulateDemoEvent(seed, 1, "2026-10-27T12:00:00.000Z");
    const replay = simulateDemoEvent(seed, 1, "2026-10-27T12:00:00.000Z");
    const duplicate = simulateDemoEvent(first, 1, "2026-10-27T12:00:00.000Z");

    expect(replay.cases.map((item) => item.id)).toEqual(first.cases.map((item) => item.id));
    expect(duplicate).toBe(first);
  });

  it("records operational actions, updates counts and keeps per-case history bounded", () => {
    let state = createSeedState();
    for (let sequence = 1; sequence <= 46; sequence += 1) {
      state = simulateDemoEvent(state, sequence, occurredAt(sequence));
    }

    expect(state.simulationSequence).toBe(46);
    expect(state.cases.filter((item) => item.status === "Transferred").length).toBeGreaterThan(0);
    expect(state.cases.some((item) => item.expectedDisposalDate !== null && item.history[0]?.kind === "Deadline update")).toBe(true);
    expect(state.cases.filter((item) => item.id.startsWith("SIM-")).length).toBeLessThanOrEqual(5);
    expect(state.cases.every((item) => item.history.length <= 40)).toBe(true);
    expect(getCounts(state.cases).total).toBe(state.cases.length);
  });

  it("derives stable action alerts and one pending-review alert per overlap candidate", () => {
    const seed = createSeedState();
    let state = simulateDemoEvent(seed, 1, "2026-10-27T12:00:00.000Z");
    const generated = state.cases.find((item) => item.id === "SIM-2026-00001");
    const received = getAlerts(state).filter((alert) => alert.kind === "New complaint received" && alert.caseId === generated?.id);

    expect(received).toHaveLength(1);
    expect(received[0]?.institutionId).toBe(generated?.institutionId);
    expect(getAlerts({ ...state, readAlertIds: [received[0]!.id] }).find((alert) => alert.id === received[0]!.id)?.read).toBe(true);

    for (let sequence = 2; sequence <= 8; sequence += 1) {
      state = simulateDemoEvent(state, sequence, occurredAt(sequence));
    }
    const statusesBeforeDetection = state.cases.map((item) => [item.id, item.status]);
    state = simulateDemoEvent(state, 9, occurredAt(9));

    expect(getAlerts(state).some((alert) => alert.kind === "Coordination action recorded")).toBe(true);
    expect(getAlerts(state).some((alert) => alert.kind === "Case disposed")).toBe(true);
    expect(state.cases.some((item) => item.history[0]?.kind === "Overlap detection")).toBe(true);
    expect(getAlerts(state).some((alert) => alert.kind === "Potential overlap" && alert.id.includes(":sim-9-"))).toBe(true);
    expect(getAlerts(state).filter((alert) => alert.kind === "Potential overlap" && alert.institutionId === generated?.institutionId)).toHaveLength(1);
    expect(state.cases.map((item) => [item.id, item.status])).toEqual(statusesBeforeDetection);
    expect(getCounts(state.cases).total).toBe(state.cases.length);
  });
});
