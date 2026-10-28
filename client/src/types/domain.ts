export const BUREAUS = [
  "Regulation Bureau (RB)",
  "Public Grievance Redressal Cell (PGRC)",
  "Western Regional Office",
  "Academic Affairs Cell",
] as const;

export type Bureau = (typeof BUREAUS)[number];
export type CaseStatus = "Pending" | "Under process" | "Transferred" | "Escalated" | "Disposed";
export type Priority = "Low" | "Normal" | "High" | "Critical";
export type ActionKind = "Received" | "Review" | "Status update" | "Assignment" | "Transfer" | "Escalation" | "Note" | "Coordination" | "Related case" | "Deadline update" | "Overlap detection";
export type ReviewOutcome = "pending" | "related" | "no-conflict" | "duplicate";
export type Role = "Senior Management" | "RB Officer" | "PGRC Officer" | "Regional Office Officer" | "Administrator";

export interface Institution {
  id: string;
  permanentId: string;
  name: string;
  region: string;
  state: string;
  city: string;
  institutionType: string;
  established: number;
  lastActivity: string | null;
  caseCountOverride?: number;
}

export interface ActionEntry {
  id: string;
  at: string;
  kind: ActionKind;
  summary: string;
  actor: string;
  bureau: Bureau;
}

export interface CaseRecord {
  id: string;
  receivedAt: string;
  institutionId: string;
  category: string;
  bureau: Bureau;
  officer: string;
  status: CaseStatus;
  priority: Priority;
  lastAction: string;
  lastActionAt: string | null;
  expectedDisposalDate: string | null;
  description: string;
  attachmentNames: string[];
  awaitingBureau?: Bureau;
  relatedCaseIds: string[];
  history: ActionEntry[];
}

export interface OverlapCandidate {
  id: string;
  institutionIds: string[];
  caseIds: string[];
  bureaus: Bureau[];
  reason: string;
  confidence: number;
  source: "permanent-id" | "mapped-record" | "normalized-name" | "name-variation";
  suggestedAction: string;
  outcome: ReviewOutcome;
  lastActionAt: string | null;
}

export type AlertKind = "New complaint received" | "Approaching due date" | "Overdue" | "No recent action" | "Potential overlap" | "Awaiting coordination" | "Coordination action recorded" | "Case disposed" | "Escalation" | "Transfer or reassignment";

export interface DemoAlert {
  id: string;
  kind: AlertKind;
  title: string;
  reason: string;
  date: string | null;
  caseId?: string;
  institutionId?: string;
  read: boolean;
  critical: boolean;
}

export interface DemoState {
  institutions: Institution[];
  cases: CaseRecord[];
  reviewOutcomes: Record<string, ReviewOutcome>;
  readAlertIds: string[];
  role: Role;
  enteredDemo: boolean;
  simulationSequence: number;
  resetEpoch: number;
}

export interface DemoAction {
  type: "enter" | "set-role" | "update-status" | "assign" | "transfer" | "escalate" | "add-note" | "link-cases" | "review-overlap" | "mark-read" | "reset" | "simulate-event";
  caseId?: string;
  otherCaseId?: string;
  status?: CaseStatus;
  officer?: string;
  bureau?: Bureau;
  note?: string;
  outcome?: ReviewOutcome;
  overlapId?: string;
  alertId?: string;
  role?: Role;
  simulationSequence?: number;
  occurredAt?: string;
}
