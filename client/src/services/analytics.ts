import type { ActionEntry, CaseRecord, DemoAlert, DemoState, Institution, OverlapCandidate, ReviewOutcome } from "@/types/domain";

const ACTIVE = new Set(["Pending", "Under process", "Transferred", "Escalated"]);
const todayISO = () => new Date().toISOString().slice(0, 10);
const dayDiff = (from: string, to: string) => Math.floor((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000);

export function normalizedName(name: string) {
  return name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

function similarity(left: string, right: string): number {
  const a = normalizedName(left).replace(/ /g, "");
  const b = normalizedName(right).replace(/ /g, "");
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const old = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = old;
    }
  }
  return 1 - row[b.length] / Math.max(a.length, b.length, 1);
}

export function findOverlapCandidates(
  institutions: Institution[],
  cases: CaseRecord[],
  outcomes: Record<string, ReviewOutcome>,
): OverlapCandidate[] {
  const result: OverlapCandidate[] = [];
  const byInstitution = new Map<string, CaseRecord[]>();
  cases.forEach((item) => byInstitution.set(item.institutionId, [...(byInstitution.get(item.institutionId) ?? []), item]));

  institutions.forEach((institution) => {
    const all = byInstitution.get(institution.id) ?? [];
    const active = all.filter((item) => ACTIVE.has(item.status));
    const bureaus = [...new Set(active.map((item) => item.bureau))];
    if (bureaus.length > 1 && active.length > 1) {
      const id = `institution:${institution.id}`;
      result.push({
        id,
        institutionIds: [institution.id],
        caseIds: active.map((item) => item.id),
        bureaus,
        reason: `Matched using the same AICTE Permanent ID (${institution.permanentId}). Multiple active Bureaus/Cells are involved; human coordination review is required.`,
        confidence: 1,
        source: "permanent-id",
        suggestedAction: "Compare active records and decide whether coordination is needed. Do not merge cases automatically.",
        outcome: outcomes[id] ?? "pending",
        lastActionAt: active.map((item) => item.lastActionAt).filter((date): date is string => Boolean(date)).sort().at(-1) ?? null,
      });
    }
  });

  for (let i = 0; i < institutions.length; i += 1) {
    for (let j = i + 1; j < institutions.length; j += 1) {
      const left = institutions[i];
      const right = institutions[j];
      if (left.permanentId === right.permanentId) continue;
      const score = similarity(left.name, right.name);
      if (score < 0.89) continue;
      const leftCases = byInstitution.get(left.id) ?? [];
      const rightCases = byInstitution.get(right.id) ?? [];
      if (!leftCases.length || !rightCases.length) continue;
      const ordered = [left.id, right.id].sort();
      const id = `names:${ordered[0]}:${ordered[1]}`;
      result.push({
        id,
        institutionIds: [left.id, right.id],
        caseIds: [...leftCases, ...rightCases].map((item) => item.id),
        bureaus: [...new Set([...leftCases, ...rightCases].map((item) => item.bureau))],
        reason: `Possible institution-name variation (${Math.round(score * 100)}% string similarity). Permanent IDs differ (${left.permanentId} / ${right.permanentId}); manual verification required. Similar names alone do not establish identity.`,
        confidence: score,
        source: "name-variation",
        suggestedAction: "Verify institution identity against an approved directory before linking or coordinating records.",
        outcome: outcomes[id] ?? "pending",
        lastActionAt: [...leftCases, ...rightCases].map((item) => item.lastActionAt).filter((date): date is string => Boolean(date)).sort().at(-1) ?? null,
      });
    }
  }
  return result.sort((a, b) => Number(a.outcome !== "pending") - Number(b.outcome !== "pending") || (b.lastActionAt ?? "").localeCompare(a.lastActionAt ?? ""));
}

export function institutionCases(state: DemoState, institutionId: string) {
  return state.cases.filter((item) => item.institutionId === institutionId);
}

export function caseAgeDays(item: CaseRecord, now = todayISO()) {
  return dayDiff(item.receivedAt, now);
}

export function isOverdue(item: CaseRecord, now = todayISO()) {
  return item.status !== "Disposed" && Boolean(item.expectedDisposalDate) && item.expectedDisposalDate! < now;
}

export function isApproaching(item: CaseRecord, now = todayISO()) {
  if (item.status === "Disposed" || !item.expectedDisposalDate) return false;
  const remaining = dayDiff(now, item.expectedDisposalDate);
  return remaining >= 0 && remaining <= 7;
}

export function getCounts(cases: CaseRecord[], now = todayISO()) {
  return {
    total: cases.length,
    pending: cases.filter((item) => item.status === "Pending").length,
    inProcess: cases.filter((item) => item.status === "Under process").length,
    disposed: cases.filter((item) => item.status === "Disposed").length,
    transferred: cases.filter((item) => item.status === "Transferred").length,
    overdue: cases.filter((item) => isOverdue(item, now)).length,
  };
}

export function getAlerts(state: DemoState, now = todayISO()): DemoAlert[] {
  const overlaps = findOverlapCandidates(state.institutions, state.cases, state.reviewOutcomes);
  const alerts: DemoAlert[] = [];
  const addCaseAlert = (item: CaseRecord, kind: DemoAlert["kind"], title: string, reason: string, critical = false) => {
    const id = `${kind}:${item.id}`;
    alerts.push({ id, kind, title, reason, date: item.lastActionAt ?? item.receivedAt, caseId: item.id, institutionId: item.institutionId, read: state.readAlertIds.includes(id), critical });
  };
  state.cases.forEach((item) => {
    const institution = state.institutions.find((entry) => entry.id === item.institutionId);
    const name = institution?.name ?? "Institution record";
    if (isOverdue(item, now)) addCaseAlert(item, "Overdue", `${item.id} is past its expected date`, `${name} · expected ${item.expectedDisposalDate}`, item.priority === "Critical" || item.status === "Escalated");
    else if (isApproaching(item, now)) addCaseAlert(item, "Approaching due date", `${item.id} is approaching its expected date`, `${name} · due ${item.expectedDisposalDate}`);
    if (item.status !== "Disposed" && item.lastActionAt && dayDiff(item.lastActionAt, now) >= 21) addCaseAlert(item, "No recent action", `${item.id} has no recent action`, `${name} · last activity ${item.lastActionAt}`);
    if (item.status === "Escalated") addCaseAlert(item, "Escalation", `${item.id} is escalated`, `${name} · assigned to ${item.officer}`, item.priority === "Critical");
    const handoff = item.history.find((entry) => entry.kind === "Transfer" || entry.kind === "Assignment");
    if (handoff) {
      const id = `Transfer or reassignment:${item.id}:${handoff.id}`;
      const title = handoff.kind === "Assignment" ? `${item.id} was assigned or reassigned` : `${item.id} was transferred`;
      alerts.push({ id, kind: "Transfer or reassignment", title, reason: `${name} · ${handoff.summary}`, date: handoff.at, caseId: item.id, institutionId: item.institutionId, read: state.readAlertIds.includes(id), critical: false });
    } else if (item.status === "Transferred") addCaseAlert(item, "Transfer or reassignment", `${item.id} was transferred`, `${name} · ${item.lastAction}`);
    if (item.awaitingBureau) addCaseAlert(item, "Awaiting coordination", `${item.id} is awaiting another Bureau/Cell`, `${name} · awaiting ${item.awaitingBureau}`);
    item.history.filter((entry) => entry.id.startsWith("sim-") || entry.id.startsWith("action-")).forEach((entry) => {
      if (entry.kind === "Overlap detection") return;
      const kind = entry.kind === "Received" ? "New complaint received"
        : entry.kind === "Coordination" || (entry.kind === "Note" && /coordination/i.test(entry.summary)) ? "Coordination action recorded"
          : entry.kind === "Status update" && /disposed/i.test(entry.summary) ? "Case disposed" : null;
      if (!kind) return;
      const id = `${kind}:${item.id}:${entry.id}`;
      const title = kind === "New complaint received" ? `New synthetic complaint received · ${item.id}`
        : kind === "Case disposed" ? `Case disposed · ${item.id}` : `Coordination action recorded · ${item.id}`;
      alerts.push({ id, kind, title, reason: `${name} · ${entry.summary}`, date: entry.at, caseId: item.id, institutionId: item.institutionId, read: state.readAlertIds.includes(id), critical: false });
    });
  });
  overlaps.filter((item) => item.outcome === "pending").forEach((item) => {
    const institution = state.institutions.find((entry) => entry.id === item.institutionIds[0]);
    const latestDetection = state.cases
      .filter((record) => item.caseIds.includes(record.id))
      .flatMap((record) => record.history.filter((entry) => entry.kind === "Overlap detection").map((entry) => ({ record, entry })))
      .sort((a, b) => b.entry.at.localeCompare(a.entry.at))[0];
    const id = latestDetection ? `Potential overlap:${item.id}:${latestDetection.entry.id}` : `Potential overlap:${item.id}`;
    alerts.push({
      id,
      kind: "Potential overlap",
      title: latestDetection ? `Potential overlap detected · ${latestDetection.record.id}` : "Potential overlap awaits review",
      reason: latestDetection ? `${institution?.name ?? "Institution match"} · ${latestDetection.entry.summary}` : `${institution?.name ?? "Institution match"} · ${item.bureaus.length} Bureaus/Cells`,
      date: latestDetection?.entry.at ?? item.lastActionAt,
      caseId: latestDetection?.record.id ?? item.caseIds[0],
      institutionId: item.institutionIds[0],
      read: state.readAlertIds.includes(id),
      critical: false,
    });
  });
  return alerts.sort((a, b) => Number(b.critical) - Number(a.critical) || (a.date ?? "").localeCompare(b.date ?? ""));
}

export function formatDate(date: string | null | undefined, options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" }) {
  if (!date) return "Not recorded";
  const value = new Date(`${date.slice(0, 10)}T12:00:00Z`);
  if (Number.isNaN(value.getTime())) return "Not recorded";
  return new Intl.DateTimeFormat("en-IN", options).format(value);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value);
}

export function monthlyTrend(cases: CaseRecord[], period: 3 | 6 | 8 = 8) {
  const months = ["Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"];
  return months.map((month, index) => {
    const monthNumber = String(index + 3).padStart(2, "0");
    const received = cases.filter((item) => item.receivedAt.slice(5, 7) === monthNumber).length;
    const disposed = cases.filter((item) => item.status === "Disposed" && item.lastActionAt?.slice(5, 7) === monthNumber).length;
    return { month, received, disposed };
  }).slice(-period);
}

export interface ActivityFeedItem {
  id: string;
  caseId: string;
  institutionId: string;
  institutionName: string;
  bureau: ActionEntry["bureau"];
  actor: string;
  kind: ActionEntry["kind"];
  summary: string;
  at: string;
}

export function recentActivity(state: Pick<DemoState, "cases" | "institutions">, limit = 8): ActivityFeedItem[] {
  const names = new Map(state.institutions.map((institution) => [institution.id, institution.name]));
  return state.cases.flatMap((item) => item.history.map((entry) => ({
    id: `${item.id}::${entry.id}`,
    caseId: item.id,
    institutionId: item.institutionId,
    institutionName: names.get(item.institutionId) ?? "Institution record",
    bureau: entry.bureau,
    actor: entry.actor,
    kind: entry.kind,
    summary: entry.summary,
    at: entry.at,
  }))).sort((left, right) => right.at.localeCompare(left.at)).slice(0, limit);
}

export function formatTimestamp(value: string | null | undefined) {
  if (!value) return "Not recorded";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not recorded";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(parsed);
}

export function bureauSummary(cases: CaseRecord[]) {
  const bureaus = [...new Set(cases.map((item) => item.bureau))];
  return bureaus.map((bureau) => {
    const items = cases.filter((item) => item.bureau === bureau);
    return { bureau, ...getCounts(items), approaching: items.filter((item) => isApproaching(item)).length, awaiting: items.filter((item) => item.awaitingBureau).length };
  }).sort((a, b) => b.pending + b.inProcess - (a.pending + a.inProcess));
}

export function statusDistribution(cases: CaseRecord[]) {
  const statuses = ["Pending", "Under process", "Transferred", "Escalated", "Disposed"] as const;
  return statuses.map((status) => ({ status, count: cases.filter((item) => item.status === status).length }));
}

export function ageingDistribution(cases: CaseRecord[]) {
  const pending = cases.filter((item) => item.status !== "Disposed");
  const groups = [{ label: "0–7 days", min: 0, max: 7 }, { label: "8–14 days", min: 8, max: 14 }, { label: "15–30 days", min: 15, max: 30 }, { label: "31+ days", min: 31, max: Infinity }];
  return groups.map((group) => ({ band: group.label, count: pending.filter((item) => { const age = caseAgeDays(item); return age >= group.min && age <= group.max; }).length }));
}

export function candidateForCase(candidates: OverlapCandidate[], caseId: string) {
  return candidates.find((candidate) => candidate.caseIds.includes(caseId));
}
