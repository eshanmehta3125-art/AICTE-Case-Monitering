import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll } from "framer-motion";
import { Link, useLocation } from "wouter";
import { ArrowLeft, ArrowRight, BellRing, CalendarClock, Check, ClipboardList, FileText, Link2, MessageSquareText, ShieldAlert, UsersRound } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AppShell } from "@/components/layout/AppShell";
import { useDemoStore } from "@/contexts/DemoStore";
import { DataTable, EmptyState, FieldLabel, Panel, PriorityBadge, SearchInput, SelectField, StatusBadge, type TableColumn } from "@/features/shared/ui";
import { caseAgeDays, findOverlapCandidates, formatDate, getCounts, isApproaching, isOverdue } from "@/services/analytics";
import type { Bureau, CaseRecord, CaseStatus, Role } from "@/types/domain";
import { BUREAUS } from "@/types/domain";
import { toast } from "sonner";

const shortBureau = (value: string) => value.replace("Public Grievance Redressal Cell (PGRC)", "PGRC").replace("Regulation Bureau (RB)", "RB").replace("Western Regional Office", "Western RO").replace("Academic Affairs Cell", "Academic Affairs");
const officers = ["Meera Rao", "Arjun Menon", "Kavita Shah", "Sana Iqbal", "Devika Nair", "Rohan Das", "Nikhil Patil"];
const allStatuses: CaseStatus[] = ["Pending", "Under process", "Transferred", "Escalated", "Disposed"];

function initialFilters() {
  const params = new URLSearchParams(window.location.search);
  return { search: params.get("search") ?? "", status: params.get("status") ?? "", overdue: params.get("overdue") === "true", awaiting: params.get("awaiting") === "true" };
}

export function CaseRegistryPage() {
  const { state } = useDemoStore();
  const [, navigate] = useLocation();
  const initial = useMemo(initialFilters, []);
  const [query, setQuery] = useState(initial.search);
  const [caseStatus, setCaseStatus] = useState(initial.status);
  const [bureau, setBureau] = useState("");
  const [region, setRegion] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [category, setCategory] = useState("");
  const [officer, setOfficer] = useState("");
  const [receivedFrom, setReceivedFrom] = useState("");
  const [receivedTo, setReceivedTo] = useState("");
  const [onlyOverdue, setOnlyOverdue] = useState(initial.overdue);
  const [onlyAwaiting, setOnlyAwaiting] = useState(initial.awaiting);
  const [potentialOverlap, setPotentialOverlap] = useState("");
  const candidates = findOverlapCandidates(state.institutions, state.cases, state.reviewOutcomes);
  const overlapCaseIds = new Set(candidates.flatMap((candidate) => candidate.caseIds));
  const regions = [...new Set(state.institutions.map((item) => item.region))].sort();
  const states = [...new Set(state.institutions.map((item) => item.state))].sort();
  const bureaus = [...new Set(state.cases.map((item) => item.bureau))].sort();
  const categories = [...new Set(state.cases.map((item) => item.category))].sort();
  const filtered = useMemo(() => state.cases.filter((item) => {
    const institution = state.institutions.find((entry) => entry.id === item.institutionId);
    const haystack = `${item.id} ${item.category} ${item.bureau} ${item.officer} ${item.status} ${item.lastAction} ${item.awaitingBureau ?? ""} ${institution?.name ?? ""} ${institution?.permanentId ?? ""}`.toLowerCase();
    if (query && !haystack.includes(query.toLowerCase())) return false;
    if (caseStatus && item.status !== caseStatus) return false;
    if (bureau && item.bureau !== bureau) return false;
    if (region && institution?.region !== region) return false;
    if (selectedState && institution?.state !== selectedState) return false;
    if (category && item.category !== category) return false;
    if (officer && item.officer !== officer) return false;
    if (receivedFrom && item.receivedAt < receivedFrom) return false;
    if (receivedTo && item.receivedAt > receivedTo) return false;
    if (onlyOverdue && !isOverdue(item)) return false;
    if (onlyAwaiting && !item.awaitingBureau) return false;
    if (potentialOverlap === "Yes" && !overlapCaseIds.has(item.id)) return false;
    if (potentialOverlap === "No" && overlapCaseIds.has(item.id)) return false;
    return true;
  }), [state.cases, state.institutions, query, caseStatus, bureau, region, selectedState, category, officer, receivedFrom, receivedTo, onlyOverdue, onlyAwaiting, potentialOverlap, overlapCaseIds]);
  const activeFilters = [query, caseStatus, bureau, region, selectedState, category, officer, receivedFrom, receivedTo, onlyOverdue ? "Overdue" : "", onlyAwaiting ? "Awaiting another Bureau" : "", potentialOverlap].filter(Boolean).length;
  const clearFilters = () => { setQuery(""); setCaseStatus(""); setBureau(""); setRegion(""); setSelectedState(""); setCategory(""); setOfficer(""); setReceivedFrom(""); setReceivedTo(""); setOnlyOverdue(false); setOnlyAwaiting(false); setPotentialOverlap(""); };

  const columns: TableColumn<CaseRecord>[] = [
    { key: "caseId", header: "Complaint / case ID", sortable: true, sortValue: (item) => item.id, render: (item) => <Link href={`/cases/${item.id}`} className="record-link mono">{item.id}</Link> },
    { key: "received", header: "Received", sortable: true, sortValue: (item) => item.receivedAt, render: (item) => <span className="date-cell">{formatDate(item.receivedAt)}</span> },
    { key: "institution", header: "Institution", sortable: true, sortValue: (item) => state.institutions.find((entry) => entry.id === item.institutionId)?.name, render: (item) => { const institution = state.institutions.find((entry) => entry.id === item.institutionId); return <Link href={`/institutions/${item.institutionId}`} className="institution-cell-link"><strong>{institution?.name ?? "Institution record"}</strong><small>{institution?.permanentId ?? "—"}</small></Link>; } },
    { key: "category", header: "Category", sortable: true, sortValue: (item) => item.category, render: (item) => <span>{item.category}</span> },
    { key: "bureau", header: "Bureau / Cell", sortable: true, sortValue: (item) => item.bureau, render: (item) => <span className="bureau-short">{shortBureau(item.bureau)}</span> },
    { key: "officer", header: "Assigned officer", sortable: true, sortValue: (item) => item.officer, render: (item) => <span>{item.officer}</span> },
    { key: "status", header: "Status", sortable: true, sortValue: (item) => item.status, render: (item) => <StatusBadge status={item.status} /> },
    { key: "priority", header: "Priority", sortable: true, sortValue: (item) => item.priority, render: (item) => <PriorityBadge priority={item.priority} /> },
    { key: "last-action", header: "Last action", sortable: true, sortValue: (item) => item.lastActionAt, render: (item) => <span className="cell-stack"><strong>{item.lastAction}</strong><small>{formatDate(item.lastActionAt)}</small></span> },
    { key: "expected", header: "Expected date", sortable: true, sortValue: (item) => item.expectedDisposalDate, render: (item) => <span className="date-cell">{formatDate(item.expectedDisposalDate)}</span> },
    { key: "age", header: "Age / SLA", sortable: true, sortValue: (item) => caseAgeDays(item), render: (item) => <span className={`age-indicator ${isOverdue(item) ? "age-overdue" : isApproaching(item) ? "age-approaching" : ""}`}>{item.status === "Disposed" ? "Closed" : `${caseAgeDays(item)}d`}{isOverdue(item) && <small>Overdue</small>}</span> },
    { key: "overlap", header: "Overlap", render: (item) => { const candidate = candidates.find((entry) => entry.caseIds.includes(item.id)); return candidate ? <Link href={`/overlaps?case=${encodeURIComponent(item.id)}`} className={`coordination-flag overlap-${candidate.outcome}`}><span />{candidate.outcome === "pending" ? "Review" : candidate.outcome === "no-conflict" ? "Reviewed" : candidate.outcome === "duplicate" ? "Duplicate" : "Related"}</Link> : <span className="quiet-dash">—</span>; } },
  ];

  return <AppShell title="Complaint & Case Registry" description="Search and manage synthetic institution complaints across Bureaus and Cells." eyebrow="CASE RECORDS" action={<div className="record-count"><ClipboardList size={15} />{filtered.length} of {state.cases.length} cases</div>}>
    <div className="case-registry-page"><div className="demo-banner"><span className="demo-banner-mark">D</span><span><strong>Demo records only</strong><small>All expected dates and case details are illustrative, not statutory or connected to live records.</small></span></div>
      <Panel title="Search and filters" description="Filters combine across case ID, institution identity, assignment, status, and received date." className="filter-panel"><div className="filters-grid case-filters"><label className="filter-field filter-search-wide"><span>Case ID, institution, Permanent ID, or keyword</span><SearchInput value={query} onChange={setQuery} placeholder="e.g. PGRC-2026-0142 or DEMO-10024" /></label><SelectField label="Bureau / Cell" value={bureau} onChange={setBureau} options={bureaus} /><SelectField label="Status" value={caseStatus} onChange={setCaseStatus} options={allStatuses} /><SelectField label="Region" value={region} onChange={setRegion} options={regions} /><SelectField label="State" value={selectedState} onChange={setSelectedState} options={states} /><SelectField label="Category" value={category} onChange={setCategory} options={categories} /><SelectField label="Assigned officer" value={officer} onChange={setOfficer} options={[...new Set(state.cases.map((item) => item.officer))].sort()} /><FieldLabel label="Received from"><input type="date" value={receivedFrom} onChange={(event) => setReceivedFrom(event.target.value)} /></FieldLabel><FieldLabel label="Received to"><input type="date" value={receivedTo} onChange={(event) => setReceivedTo(event.target.value)} /></FieldLabel><SelectField label="Potential overlap" value={potentialOverlap} onChange={setPotentialOverlap} options={["Yes", "No"]} /><label className="filter-check"><input type="checkbox" checked={onlyOverdue} onChange={(event) => setOnlyOverdue(event.target.checked)} /><span>Overdue only</span></label><label className="filter-check"><input type="checkbox" checked={onlyAwaiting} onChange={(event) => setOnlyAwaiting(event.target.checked)} /><span>Awaiting another Bureau</span></label></div>{activeFilters > 0 && <div className="filter-summary"><span>{activeFilters} active {activeFilters === 1 ? "filter" : "filters"} · {filtered.length} matching records</span><Button variant="ghost" size="sm" onClick={clearFilters}>Clear all</Button></div>}</Panel>
      <Panel title="Case records" description="Select a case ID or open action to view its history and available demo workflows." className="registry-table-panel"><DataTable data={filtered} columns={columns} initialPageSize={12} emptyTitle="No cases match these filters" emptyDetail="Adjust the search or clear filters to see the synthetic case register." /></Panel>
      <p className="demo-note">Expected disposal dates are demonstration values. They do not represent statutory obligations, production SLAs, or real AICTE records.</p>
    </div>
  </AppShell>;
}

export function CaseDetailPage({ caseId }: { caseId: string }) {
  const { state, dispatch } = useDemoStore();
  const [, navigate] = useLocation();
  const item = state.cases.find((record) => record.id === caseId);
  const historyRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: historyRef, offset: ["start 82%", "end 24%"] });
  const [nextStatus, setNextStatus] = useState<CaseStatus>(item?.status ?? "Pending");
  const [targetBureau, setTargetBureau] = useState<Bureau>(() => BUREAUS.find((bureau) => bureau !== item?.bureau) ?? BUREAUS[0]);
  const [targetOfficer, setTargetOfficer] = useState("");
  const [note, setNote] = useState("");
  const [linkedCase, setLinkedCase] = useState("");
  const [confirm, setConfirm] = useState<"transfer" | "escalate" | null>(null);
  useEffect(() => {
    setNextStatus(item?.status ?? "Pending");
    setTargetBureau(BUREAUS.find((bureau) => bureau !== item?.bureau) ?? BUREAUS[0]);
    setTargetOfficer("");
    setNote("");
    setLinkedCase("");
    setConfirm(null);
  }, [caseId, item?.status, item?.bureau]);
  const canManage = state.role === "Administrator" || (state.role === "RB Officer" && item?.bureau === "Regulation Bureau (RB)") || (state.role === "PGRC Officer" && item?.bureau === "Public Grievance Redressal Cell (PGRC)") || (state.role === "Regional Office Officer" && item?.bureau === "Western Regional Office");
  const canEscalate = canManage || state.role === "Senior Management";
  const candidates = findOverlapCandidates(state.institutions, state.cases, state.reviewOutcomes);
  if (!item) return <AppShell title="Case not found" description="This demonstration record could not be located."><EmptyState title="Case record unavailable" detail="Return to the case registry to choose an available synthetic case." action={<Button variant="outline" onClick={() => navigate("/cases")}>Back to cases</Button>} /></AppShell>;
  const institution = state.institutions.find((entry) => entry.id === item.institutionId);
  const candidate = candidates.find((entry) => entry.caseIds.includes(item.id));
  const sameInstitution = state.cases.filter((entry) => entry.institutionId === item.institutionId && entry.id !== item.id);
  const otherCases = state.cases.filter((entry) => entry.id !== item.id);
  const history = [...item.history].sort((a, b) => b.at.localeCompare(a.at));
  const addNote = () => {
    if (!note.trim()) return;
    dispatch({ type: "add-note", caseId: item.id, note: note.trim() });
    setNote("");
    toast.success("Action note added to this demo record");
  };
  const updateStatus = () => {
    if (nextStatus === item.status) return;
    dispatch({ type: "update-status", caseId: item.id, status: nextStatus });
    toast.success(`Demo status updated to ${nextStatus}`);
  };
  const assignOfficer = () => {
    if (!targetOfficer) return;
    dispatch({ type: "assign", caseId: item.id, officer: targetOfficer });
    setTargetOfficer("");
    toast.success("Demo assignment updated");
  };
  const confirmTransfer = () => {
    dispatch({ type: "transfer", caseId: item.id, bureau: targetBureau });
    setTargetBureau(BUREAUS.find((bureau) => bureau !== targetBureau) ?? BUREAUS[0]);
    setConfirm(null);
    toast.success(`Demo case transferred to ${shortBureau(targetBureau)}`);
  };
  const confirmEscalation = () => {
    dispatch({ type: "escalate", caseId: item.id });
    setConfirm(null);
    toast.success("Demo case escalated for resolution");
  };
  const linkSelectedCase = () => {
    if (!linkedCase) return;
    dispatch({ type: "link-cases", caseId: item.id, otherCaseId: linkedCase });
    toast.success("Cases linked as related records; statuses remain separate");
  };

  return <AppShell title={item.id} description={`${item.category} · ${institution?.name ?? "Institution record"}`} eyebrow="CASE DETAIL" action={<Button variant="outline" onClick={() => navigate("/cases")}><ArrowLeft size={14} />Back to case registry</Button>}>
    <div className="case-detail-page"><div className="case-demo-notice"><span className="demo-banner-mark">D</span><span>Demonstration record · Actions are stored only in this browser and are not submitted to AICTE.</span><Link href={`/institutions/${item.institutionId}`}>Open institution profile <ArrowRight size={13} /></Link></div>
      <div className="case-detail-grid"><div className="case-detail-main">
        <Panel title="Case summary" description="Current record and illustrative timeline markers." className="case-summary-panel"><div className="case-summary-top"><div><div className="eyebrow">{item.id} <span>·</span> Received {formatDate(item.receivedAt)}</div><h2>{item.category}</h2><p>{item.description}</p></div><div className="case-badges"><StatusBadge status={item.status} /><PriorityBadge priority={item.priority} /></div></div><div className="summary-detail-grid"><div><small>Institution</small><Link href={`/institutions/${item.institutionId}`}><strong>{institution?.name ?? "Institution record"}</strong><span>{institution?.permanentId ?? "—"}</span></Link></div><div><small>Assigned Bureau / Cell</small><strong>{item.bureau}</strong></div><div><small>Assigned officer</small><strong>{item.officer}</strong></div><div><small>Expected disposal date</small><strong className={isOverdue(item) ? "text-critical" : isApproaching(item) ? "text-warning" : ""}>{formatDate(item.expectedDisposalDate)}</strong><span>Demonstration date, not statutory</span></div><div><small>Ageing</small><strong>{item.status === "Disposed" ? "Closed" : `${caseAgeDays(item)} calendar days`}</strong></div><div><small>Last action</small><strong>{item.lastAction}</strong><span>{formatDate(item.lastActionAt)}</span></div>{item.awaitingBureau && <div><small>Awaiting another team</small><strong>{item.awaitingBureau}</strong></div>}</div></Panel>
        {candidate && <Panel title="Institution-level coordination context" description="A match indicates possible related work, not an automatic duplicate." className="overlap-context-panel"><div className="overlap-context-head"><div className="overlap-context-icon"><UsersRound size={17} /></div><div><strong>{candidate.reason}</strong><p>{candidate.suggestedAction}</p></div><Link href={`/overlaps?candidate=${encodeURIComponent(candidate.id)}`} className="table-open-link">Review candidate <ArrowRight size={13} /></Link></div><div className="candidate-case-pills">{candidate.caseIds.map((id) => <Link key={id} href={`/cases/${id}`} className={`candidate-case-pill ${id === item.id ? "selected" : ""}`}>{id}</Link>)}</div></Panel>}
        <Panel title="Chronological action history" description="Latest case actions first. The orange trace follows the real recorded history as you scroll." className="history-panel"><div ref={historyRef} className="timeline-scroll-wrap">{history.length ? <><span className="timeline-progress-track" aria-hidden="true" /><motion.span className="timeline-progress-trace" aria-hidden="true" style={prefersReducedMotion ? { scaleY: 1 } : { scaleY: scrollYProgress }} /><ol className="timeline-list case-timeline">{history.map((entry, index) => <li key={entry.id} aria-current={index === 0 ? "step" : undefined} className={`timeline-item ${index === 0 ? "current" : ""} timeline-kind-${entry.kind.toLowerCase().replace(/\s+/g, "-")}`}><span className={`timeline-dot timeline-${entry.kind.toLowerCase().replace(/\s+/g, "-")}`} aria-hidden="true" /><div className="timeline-copy"><div className="timeline-topline"><strong>{entry.summary}</strong><time className="timeline-date" dateTime={entry.at}>{formatDate(entry.at)}</time></div><div className="timeline-meta"><span>{entry.kind}</span><span aria-hidden="true">·</span><span>{entry.actor}</span><span aria-hidden="true">·</span><span>{entry.bureau}</span></div></div></li>)}</ol></> : <EmptyState title="No action history" detail="Actions on this demonstration record will appear here." />}</div></Panel>
        <Panel title="Related cases" description="Related records remain separate cases with independent statuses." className="related-cases-panel">{item.relatedCaseIds.length ? <div className="related-record-list">{item.relatedCaseIds.map((id) => { const related = state.cases.find((entry) => entry.id === id); return related ? <Link key={id} href={`/cases/${id}`} className="related-record"><span className="related-record-icon"><Link2 size={15} /></span><span><strong>{id}</strong><small>{related.category} · {related.bureau}</small></span><StatusBadge status={related.status} /><ArrowRight size={14} /></Link> : null; })}</div> : <p className="muted-copy">No cases have been explicitly linked. Multiple cases at one institution are not automatically duplicates.</p>}</Panel>
        <Panel title="Supporting attachments" description="Synthetic attachments only; no real complainant files are present." className="attachments-panel">{item.attachmentNames.length ? <div className="attachment-list">{item.attachmentNames.map((name) => <div key={name} className="attachment-item"><FileText size={15} /><span><strong>{name}</strong><small>{item.id} · fictional sample document</small></span><span className="attachment-tag">DEMO</span></div>)}</div> : <div className="inline-empty"><FileText size={17} /><span>No supporting files are attached to this sample case.</span></div>}</Panel>
      </div><aside className="case-actions-column">
        <Panel title="Demo actions" description={canManage ? `Available to ${state.role}.` : `Read-only for ${state.role} in this demo role.`} className="action-panel">
          <div className="action-block"><div className="action-label">Update status</div><div className="action-control-row"><select value={nextStatus} onChange={(event) => setNextStatus(event.target.value as CaseStatus)} disabled={!canManage} aria-label="Select case status">{allStatuses.map((status) => <option key={status}>{status}</option>)}</select><Button size="sm" disabled={!canManage || nextStatus === item.status} onClick={updateStatus}><Check size={14} />Save</Button></div><small className="field-help">Changes are local to the demonstration workspace.</small></div>
          <div className="action-block"><div className="action-label">Assign / reassign officer</div><div className="action-control-stack"><select value={targetOfficer} onChange={(event) => setTargetOfficer(event.target.value)} disabled={!canManage} aria-label="Select a demo officer"><option value="">Choose officer</option>{officers.map((name) => <option key={name}>{name}</option>)}</select><Button variant="outline" size="sm" disabled={!canManage || !targetOfficer} onClick={assignOfficer}>Update assignment</Button></div></div>
          <div className="action-block"><div className="action-label">Transfer to another Bureau / Cell</div><div className="action-control-stack"><select value={targetBureau} onChange={(event) => setTargetBureau(event.target.value as Bureau)} disabled={!canManage} aria-label="Select transfer destination">{BUREAUS.filter((bureau) => bureau !== item.bureau).map((bureau) => <option key={bureau} value={bureau}>{bureau}</option>)}</select><Button variant="outline" size="sm" disabled={!canManage} onClick={() => setConfirm("transfer")}>Review transfer <ArrowRight size={13} /></Button></div></div>
          <div className="action-block"><div className="action-label">Add action note</div><Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Record a concise, synthetic action note…" rows={3} disabled={!canManage} maxLength={500} /><div className="action-bottom"><span>{note.length}/500</span><Button size="sm" disabled={!canManage || !note.trim()} onClick={addNote}><MessageSquareText size={14} />Add note</Button></div></div>
          <div className="action-block"><div className="action-label">Link a related case</div><div className="action-control-stack"><select value={linkedCase} onChange={(event) => setLinkedCase(event.target.value)} disabled={!canManage} aria-label="Select a case to link"><option value="">Choose case</option>{otherCases.map((other) => <option key={other.id} value={other.id}>{other.id} · {other.category}</option>)}</select><Button variant="outline" size="sm" disabled={!canManage || !linkedCase} onClick={linkSelectedCase}><Link2 size={13} />Link records</Button></div><small className="field-help">Linking records never merges them or changes their statuses.</small></div>
          <div className="action-block"><div className="action-label">Coordination decision</div><div className="action-control-stack"><select aria-label="Coordination decision" id="coordination-decision"><option value="">Choose decision</option><option value="Reviewed — coordination not required">Reviewed — coordination not required</option><option value="Coordination required; follow-up assigned">Coordination required</option><option value="Related case; retain separate records">Related case; keep records separate</option></select><Button variant="outline" size="sm" disabled={!canManage} onClick={() => { const select = document.getElementById("coordination-decision") as HTMLSelectElement | null; if (select?.value) { dispatch({ type: "add-note", caseId: item.id, note: `Coordination decision recorded: ${select.value}.` }); select.value = ""; toast.success("Coordination decision added to case history"); } }}><CalendarClock size={13} />Record decision</Button></div></div>
          <div className="action-block action-critical-block"><div className="action-label">Escalate for resolution</div><p>Escalation is recorded in the local case history and alerts only.</p><Button variant="outline" className="escalate-button" disabled={!canEscalate || item.status === "Escalated"} onClick={() => setConfirm("escalate")}><ShieldAlert size={14} />Escalate case</Button></div>
          {!canManage && <div className="permission-note"><BellRing size={14} />This role can view records. Switch to an assigned demo officer or Administrator to change this case.</div>}
        </Panel>
        <Panel title="Case at a glance" description="Institution context across current demo records."><div className="glance-list"><div><span>Other cases at this institution</span><strong>{sameInstitution.length}</strong></div><div><span>Involved teams</span><strong>{new Set(state.cases.filter((record) => record.institutionId === item.institutionId).map((record) => record.bureau)).size}</strong></div><div><span>Ageing</span><strong>{item.status === "Disposed" ? "Closed" : `${caseAgeDays(item)} days`}</strong></div><div><span>Expected date</span><strong>{item.expectedDisposalDate ? formatDate(item.expectedDisposalDate) : "Not recorded"}</strong></div></div><Link href={`/institutions/${item.institutionId}`} className="table-open-link">Open Institution 360° <ArrowRight size={13} /></Link></Panel>
      </aside></div>
      <AlertDialog open={confirm === "transfer"} onOpenChange={(open) => !open && setConfirm(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirm demo transfer?</AlertDialogTitle><AlertDialogDescription>Transfer {item.id} from {item.bureau} to {targetBureau}. The status will become Transferred and an action-history entry will be added. This change stays in this browser and does not update any official system.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmTransfer}>Confirm transfer</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
      <AlertDialog open={confirm === "escalate"} onOpenChange={(open) => !open && setConfirm(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Escalate this demo case?</AlertDialogTitle><AlertDialogDescription>{item.id} will be marked Escalated in the prototype and recorded in local history. No real AICTE notification or submission occurs.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmEscalation}>Escalate case</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
      <p className="demo-note">Case status, ownership, expected dates, and actions are synthetic. Real production deployment would require authenticated, server-side authorization and an approved institutional workflow.</p>
    </div>
  </AppShell>;
}
