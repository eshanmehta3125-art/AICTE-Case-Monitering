import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Building2, CheckCheck, GitCompareArrows, Link2, ShieldAlert, UsersRound } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AppShell } from "@/components/layout/AppShell";
import { useDemoStore } from "@/contexts/DemoStore";
import { EmptyState, OutcomeBadge, Panel, PriorityBadge, StatusBadge } from "@/features/shared/ui";
import { findOverlapCandidates, formatDate } from "@/services/analytics";
import type { OverlapCandidate, ReviewOutcome } from "@/types/domain";
import { toast } from "sonner";

const shortBureau = (value: string) => value.replace("Public Grievance Redressal Cell (PGRC)", "PGRC").replace("Regulation Bureau (RB)", "RB").replace("Western Regional Office", "Western RO").replace("Academic Affairs Cell", "Academic Affairs");
const roles = ["Meera Rao", "Arjun Menon", "Kavita Shah", "Sana Iqbal", "Devika Nair", "Rohan Das", "Nikhil Patil"];

export function OverlapReviewPage() {
  const { state, dispatch } = useDemoStore();
  const relationshipMapRef = useRef<HTMLDivElement>(null);
  const [relationshipMetrics, setRelationshipMetrics] = useState({ width: 1000, leftColumnWidth: 200, gap: 44 });
  const prefersReducedMotion = useReducedMotion();
  const candidates = useMemo(() => findOverlapCandidates(state.institutions, state.cases, state.reviewOutcomes), [state.institutions, state.cases, state.reviewOutcomes]);
  const queryParams = new URLSearchParams(window.location.search);
  const queryCandidate = queryParams.get("candidate");
  const queryCase = queryParams.get("case");
  const [selected, setSelected] = useState<string | null>(() => queryCandidate ?? candidates.find((item) => item.caseIds.includes(queryCase ?? ""))?.id ?? candidates[0]?.id ?? null);
  const [filter, setFilter] = useState<"All" | "Pending" | "Reviewed">("All");
  const [coordinationNote, setCoordinationNote] = useState("");
  const [coordinator, setCoordinator] = useState("");
  const [escalate, setEscalate] = useState(false);
  const candidate = candidates.find((item) => item.id === selected) ?? candidates[0];
  const caseRows = candidate ? candidate.caseIds.map((id) => state.cases.find((item) => item.id === id)).filter((item) => item !== undefined) : [];
  const latestReview = caseRows.flatMap((item) => item.history).filter((entry) => entry.kind === "Coordination" && entry.summary.includes("Reviewer role:")).sort((a, b) => b.at.localeCompare(a.at))[0];
  const institutions = candidate ? candidate.institutionIds.map((id) => state.institutions.find((item) => item.id === id)).filter((item) => item !== undefined) : [];
  const sharedIdentity = candidate?.source !== "name-variation" && institutions.length === 1;
  useEffect(() => {
    const element = relationshipMapRef.current;
    if (!element) return;
    const measure = () => {
      const width = element.getBoundingClientRect().width;
      if (width <= 0) return;
      const styles = window.getComputedStyle(element);
      const firstTrack = styles.gridTemplateColumns.trim().split(/\s+/)[0];
      const leftColumnWidth = Number.parseFloat(firstTrack) || Math.max(148, width * 0.24);
      const gap = Number.parseFloat(styles.columnGap) || 18;
      setRelationshipMetrics((previous) => Math.abs(previous.width - width) < 0.5 && Math.abs(previous.leftColumnWidth - leftColumnWidth) < 0.5 && Math.abs(previous.gap - gap) < 0.5 ? previous : { width, leftColumnWidth, gap });
    };
    measure();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(element);
    if (!observer) window.addEventListener("resize", measure);
    return () => { observer?.disconnect(); window.removeEventListener("resize", measure); };
  }, [candidate?.id, sharedIdentity, caseRows.length]);
  const relationshipHeight = Math.max(76, caseRows.length * 64);
  const relationshipTargets = sharedIdentity ? caseRows.map((item, index) => ({ id: item.id, y: caseRows.length === 1 ? relationshipHeight / 2 : 32 + index * 64 })) : [];
  const relationshipArrowId = `relationship-arrow-${(candidate?.id ?? "selected").replace(/[^a-zA-Z0-9_-]/g, "-")}`;
  const visibleCandidates = candidates.filter((item) => filter === "All" || (filter === "Pending" ? item.outcome === "pending" : item.outcome !== "pending"));
  const canReview = state.role === "Administrator" || state.role === "Senior Management" || state.role.endsWith("Officer");

  const recordOutcome = (outcome: ReviewOutcome) => {
    if (!candidate) return;
    candidate.caseIds.forEach((caseId) => dispatch({ type: "review-overlap", overlapId: candidate.id, outcome, caseId }));
    toast.success(outcome === "no-conflict" ? "Review recorded — no conflict" : outcome === "duplicate" ? "Duplicate confirmed by demo reviewer" : "Cases confirmed as related; records remain separate");
  };
  const recordNote = () => {
    if (!candidate || !coordinationNote.trim()) return;
    const firstCase = caseRows[0];
    if (firstCase) dispatch({ type: "add-note", caseId: firstCase.id, note: `Coordination note (${state.role}): ${coordinationNote.trim()}` });
    setCoordinationNote("");
    toast.success("Coordination note recorded in the case history");
  };
  const assignCoordinator = () => {
    if (!candidate || !coordinator || !caseRows[0]) return;
    dispatch({ type: "assign", caseId: caseRows[0].id, officer: coordinator });
    dispatch({ type: "add-note", caseId: caseRows[0].id, note: `Coordinating officer assigned for overlap review: ${coordinator}.` });
    toast.success(`Coordinator assigned: ${coordinator}`);
  };
  const confirmEscalation = () => {
    if (!candidate) return;
    const firstActive = caseRows.find((item) => item.status !== "Disposed") ?? caseRows[0];
    if (firstActive) dispatch({ type: "escalate", caseId: firstActive.id });
    setEscalate(false);
    toast.success("Overlap item escalated in demo records");
  };
  const linkSelected = () => {
    if (!candidate || caseRows.length < 2) return;
    const left = caseRows[0];
    const right = caseRows.find((item) => item.id !== left.id);
    if (!right) return;
    dispatch({ type: "link-cases", caseId: left.id, otherCaseId: right.id });
    toast.success("Selected records linked as related; no case was merged");
  };

  return <AppShell title="Overlap Review Centre" description="Compare potential cross-bureau overlaps. Institution matches are a prompt for human review, not a duplicate decision." eyebrow="COORDINATION WORKFLOW" action={<div className="review-summary-count">{candidates.filter((item) => item.outcome === "pending").length} awaiting review</div>}>
    <div className="overlap-page"><div className="demo-banner"><span className="demo-banner-mark">D</span><span><strong>Deterministic demo matching</strong><small>Exact Permanent ID and institution identity come first. Similarity alone never confirms an institution or duplicate.</small></span></div>
      <div className="overlap-layout"><aside className="overlap-queue"><div className="queue-header"><div><strong>Review queue</strong><small>{candidates.length} potential candidate groups</small></div><div className="queue-tabs" role="group" aria-label="Filter review queue">{(["All", "Pending", "Reviewed"] as const).map((item) => <button key={item} className={filter === item ? "selected" : ""} onClick={() => setFilter(item)}>{item}</button>)}</div></div>
        <div className="queue-list">{visibleCandidates.length ? visibleCandidates.map((item) => {
          const primary = state.institutions.find((institution) => institution.id === item.institutionIds[0]);
          return <button key={item.id} className={`queue-item ${candidate?.id === item.id ? "selected" : ""}`} onClick={() => setSelected(item.id)}><span className={`queue-marker ${item.outcome !== "pending" ? "reviewed" : ""}`} /><span className="queue-copy"><strong>{item.institutionIds.length > 1 ? item.institutionIds.map((id) => state.institutions.find((record) => record.id === id)?.name).filter(Boolean).join(" / ") : primary?.name}</strong><small>{item.bureaus.map(shortBureau).join(" · ")}</small><span className="queue-metadata">{item.caseIds.length} cases · {item.source === "name-variation" ? "Name variation" : "Same institution ID"}</span></span><OutcomeBadge outcome={item.outcome} /></button>;
        }) : <EmptyState title="No candidates in this view" detail="Choose All or Pending to review candidate records." />}</div>
        <div className="queue-explainer"><span className="explainer-info">i</span><span>Potential overlap is not the same as a duplicate. Confirm identity and coordination need separately.</span></div>
      </aside>

      <div className="overlap-workspace">{candidate ? <>
        <Panel title={institutions.length > 1 ? institutions.map((item) => item!.name).join(" / ") : institutions[0]?.name ?? "Institution candidate"} description={institutions.length > 1 ? `${institutions.map((item) => item!.permanentId).join(" · ")} · possible name variation` : `${institutions[0]?.permanentId ?? "—"} · ${institutions[0]?.region ?? "Region not recorded"} region`} className="candidate-overview-panel"><div className="candidate-summary-strip"><div><small>Review status</small><OutcomeBadge outcome={candidate.outcome} /></div><div><small>Match confidence</small><strong>{Math.round(candidate.confidence * 100)}% <span className="quiet-inline">· rule-based, not AI</span></strong></div><div><small>Last action</small><strong>{formatDate(candidate.lastActionAt)}</strong></div><div><small>Involved teams</small><div className="bureau-chips">{candidate.bureaus.map((bureau) => <span className="bureau-chip" key={bureau}>{shortBureau(bureau)}</span>)}</div></div></div></Panel>

        <Panel title="Institution-to-case relationship" description={sharedIdentity ? "Follow one verified institution identity to its separate Bureau / Cell cases." : "These candidate institutions have different Permanent IDs; similarity alone does not establish identity."} className="relationship-visual-panel"><div ref={relationshipMapRef} className={`relationship-map ${sharedIdentity ? "shared-identity-map" : "name-match-map"}`} style={{ minHeight: relationshipHeight }}>
          {sharedIdentity && <svg className="relationship-connectors" viewBox={`0 0 ${relationshipMetrics.width} ${relationshipHeight}`} preserveAspectRatio="none" role="img" aria-label="Directional arrows connect the verified institution identity to its separate case records"><title>One shared institution identity with independent case records</title><defs><marker id={relationshipArrowId} viewBox="0 0 12 12" refX="10" refY="6" markerWidth="12" markerHeight="12" orient="auto" markerUnits="userSpaceOnUse"><path className="relationship-arrowhead" d="M 0 0 L 12 6 L 0 12 Z" /></marker></defs>{relationshipTargets.map((target, index) => {
            const startY = relationshipHeight / 2;
            const startX = relationshipMetrics.leftColumnWidth - 6;
            const endX = relationshipMetrics.leftColumnWidth + relationshipMetrics.gap - 12;
            const curve = relationshipMetrics.gap * 0.55;
            return <motion.path key={target.id} className="relationship-connector" d={`M ${startX} ${startY} C ${startX + curve} ${startY}, ${endX - curve} ${target.y}, ${endX} ${target.y}`} markerEnd={`url(#${relationshipArrowId})`} initial={prefersReducedMotion ? { pathLength: 1, opacity: 1, strokeWidth: 2.5 } : { pathLength: 0, opacity: 0.78 }} animate={prefersReducedMotion ? { pathLength: 1, opacity: 1, strokeWidth: 2.5 } : { pathLength: 1, opacity: [0.78, 1, 0.78], strokeWidth: [2.4, 2.8, 2.4] }} transition={prefersReducedMotion ? { duration: 0 } : { pathLength: { duration: 0.38, ease: [0.22, 1, 0.36, 1] }, opacity: { duration: 2.8, ease: "easeInOut", repeat: Infinity, delay: index * 0.14 }, strokeWidth: { duration: 2.8, ease: "easeInOut", repeat: Infinity, delay: index * 0.14 } }} />;
          })}</svg>}
          <div className="relationship-identity-column">{institutions.map((institution) => institution && <Link key={institution.id} href={`/institutions/${institution.id}`} className="relationship-institution"><Building2 size={15} aria-hidden="true" /><strong>{institution.name}</strong><small>{institution.permanentId} · {institution.region}</small><span>Open Institution 360°</span></Link>)}{!sharedIdentity && <div className="relationship-identity-warning"><strong>Separate identity records</strong><span>Verify Permanent IDs before treating a similar name as one institution.</span></div>}</div>
          <div className="relationship-case-list">{caseRows.map((item) => { const institution = state.institutions.find((entry) => entry.id === item.institutionId); return <Link key={item.id} href={`/cases/${item.id}`} className="relationship-case"><span className="relationship-case-bureau">{shortBureau(item.bureau)}</span><span className="relationship-case-content"><strong>{item.id}</strong><small>{item.category} · {institution?.name ?? "Institution record"}{!sharedIdentity && ` · ${institution?.permanentId ?? "—"}`}</small></span><StatusBadge status={item.status} /><ArrowRight size={14} aria-hidden="true" /></Link>; })}</div>
        </div><p className={`relationship-explanation ${sharedIdentity ? "" : "relationship-explanation-uncertain"}`}>{sharedIdentity ? "Both records reference the same institution. Separate actions may be in progress. Human review is required to decide whether coordination is necessary; no cases are merged and no official status changes automatically." : "Possible name variation · Different Permanent IDs. There is no identity connection between these nodes. Verify institution identity manually; similar descriptions or names alone do not prove that records belong to the same institution."}</p></Panel>

        <Panel title="Compare associated cases" description="Review side by side before documenting an outcome." className="comparison-panel"><div className="comparison-grid">{caseRows.map((item) => {
          const institution = state.institutions.find((entry) => entry.id === item.institutionId);
          return <article key={item.id} className="comparison-card"><div className="comparison-card-head"><div><span className="bureau-label">{shortBureau(item.bureau)}</span><Link className="record-link mono" href={`/cases/${item.id}`}>{item.id}</Link></div><StatusBadge status={item.status} /></div><dl className="comparison-fields"><div><dt>Institution</dt><dd><Link href={`/institutions/${item.institutionId}`}>{institution?.name ?? "Institution record"}</Link></dd></div><div><dt>Permanent ID</dt><dd className="mono">{institution?.permanentId ?? "—"}</dd></div><div><dt>Category</dt><dd>{item.category}</dd></div><div><dt>Assigned officer</dt><dd>{item.officer}</dd></div><div><dt>Received</dt><dd>{formatDate(item.receivedAt)}</dd></div><div><dt>Last action</dt><dd>{formatDate(item.lastActionAt)} · {item.lastAction}</dd></div><div><dt>Expected date</dt><dd>{formatDate(item.expectedDisposalDate)} <span className="quiet-inline">(demo)</span></dd></div><div><dt>Priority</dt><dd><PriorityBadge priority={item.priority} /></dd></div></dl><p className="comparison-description">{item.description}</p></article>;
        })}</div>{candidate.caseIds.length > 2 && <p className="multi-case-note">This group contains {candidate.caseIds.length} cases. The full list remains accessible through the case registry.</p>}</Panel>

        <div className={`match-explanation ${candidate.source === "name-variation" ? "match-uncertain" : ""}`}><div className="match-icon"><GitCompareArrows size={17} /></div><div><span className="eyebrow">WHY THESE RECORDS ARE TOGETHER</span><p>{candidate.reason}</p><strong>{candidate.source === "name-variation" ? "Different IDs · verify identity before linking" : "Same institution may still have separate, legitimate actions"}</strong></div></div>
        <Panel title="Human review outcome" description="A reviewer outcome is recorded in local case history. Case statuses are never changed by match detection." className="review-outcome-panel"><div className="review-action-cards"><button className="review-choice" disabled={!canReview} onClick={() => recordOutcome("related")}><UsersRound size={17} /><strong>Confirm related cases</strong><span>Related records remain separate complaint/case records.</span></button><button className="review-choice" disabled={!canReview} onClick={() => recordOutcome("no-conflict")}><CheckCheck size={17} /><strong>Reviewed — no conflict</strong><span>Parallel actions are legitimate; no further coordination needed.</span></button><button className="review-choice review-choice-caution" disabled={!canReview} onClick={() => recordOutcome("duplicate")}><ShieldAlert size={17} /><strong>Confirm duplicate</strong><span>Only select after human verification of the same underlying complaint.</span></button></div>
          <div className="review-tools"><div className="review-tool"><div className="action-label">Link related records</div><p>Explicitly link a pair without merging them or changing either status.</p><Button variant="outline" size="sm" disabled={!canReview || caseRows.length < 2} onClick={linkSelected}><Link2 size={14} />Link first two records</Button></div><div className="review-tool"><div className="action-label">Assign coordinating officer</div><p>The assignment and coordination note are added to case history.</p><div className="action-control-row"><select value={coordinator} onChange={(event) => setCoordinator(event.target.value)} aria-label="Choose coordinating officer" disabled={!canReview}><option value="">Choose officer</option>{roles.map((name) => <option key={name}>{name}</option>)}</select><Button variant="outline" size="sm" disabled={!canReview || !coordinator} onClick={assignCoordinator}>Assign</Button></div></div></div>
          <div className="review-note-block"><label className="action-label" htmlFor="coordination-note">Record a coordination note</label><Textarea id="coordination-note" rows={3} value={coordinationNote} onChange={(event) => setCoordinationNote(event.target.value)} maxLength={500} placeholder="Describe the next coordination step or why these actions remain separate…" disabled={!canReview} /><div className="action-bottom"><span>{coordinationNote.length}/500</span><Button size="sm" disabled={!canReview || !coordinationNote.trim()} onClick={recordNote}>Save coordination note</Button></div></div>
          <div className="review-escalate"><div><strong>Escalate for resolution</strong><small>Requires confirmation; records a demo escalation on one active case.</small></div><Button variant="outline" size="sm" disabled={!canReview || caseRows.every((item) => item.status === "Disposed")} onClick={() => setEscalate(true)}><ShieldAlert size={14} />Escalate</Button></div>
          {!canReview && <p className="permission-note">The current demo role is read-only for overlap review. Select Senior Management, an assigned officer, or Administrator to record an outcome.</p>}
        </Panel>
        <Panel title="Review record history" description="Status changes here do not automatically update associated case statuses."><div className="review-history-summary"><OutcomeBadge outcome={candidate.outcome} /><span>Last action date: {formatDate(candidate.lastActionAt)}</span><span>Reviewer role: {latestReview?.actor ?? (candidate.outcome === "pending" ? "No reviewer recorded" : "Seed demonstration outcome")}</span><Link href={`/cases/${candidate.caseIds[0] ?? ""}`} className="table-open-link">Open case history <ArrowRight size={13} /></Link></div></Panel>
      </> : <EmptyState title="No overlap candidates were detected" detail="Candidates appear when the synthetic records contain cross-Bureau activity at the same institution or a review-worthy name variation." />}</div></div>
      <p className="demo-note">Initial matching uses institution identity as its main signal. Similar descriptions alone never establish that cases share an institution. No case is automatically merged or marked duplicate.</p>
    </div>
    <AlertDialog open={escalate} onOpenChange={setEscalate}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Escalate this overlap item?</AlertDialogTitle><AlertDialogDescription>An active associated case will be marked Escalated in local demonstration state. This does not notify or submit anything to AICTE.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmEscalation}>Confirm escalation</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </AppShell>;
}
