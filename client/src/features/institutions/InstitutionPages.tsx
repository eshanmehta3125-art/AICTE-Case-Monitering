import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, ArrowRight, Building2, CalendarClock, CircleCheck, FileText, MapPin, UsersRound } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { DataTable, EmptyState, FieldLabel, OutcomeBadge, Panel, SearchInput, SelectField, StatusBadge, type TableColumn } from "@/features/shared/ui";
import { useDemoStore } from "@/contexts/DemoStore";
import { caseAgeDays, findOverlapCandidates, formatDate, formatNumber, getCounts, institutionCases, isOverdue } from "@/services/analytics";
import type { CaseRecord, Institution } from "@/types/domain";
import { toast } from "sonner";

const bureauShort = (value: string) => value.replace("Public Grievance Redressal Cell (PGRC)", "PGRC").replace("Regulation Bureau (RB)", "RB").replace("Western Regional Office", "Western RO").replace("Academic Affairs Cell", "Academic Affairs");

export function InstitutionRegistryPage() {
  const { state } = useDemoStore();
  const [, navigate] = useLocation();
  const [nameQuery, setNameQuery] = useState("");
  const [idQuery, setIdQuery] = useState("");
  const [region, setRegion] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [bureau, setBureau] = useState("");
  const [caseStatus, setCaseStatus] = useState("");
  const [overlap, setOverlap] = useState("");
  const candidates = findOverlapCandidates(state.institutions, state.cases, state.reviewOutcomes);
  const overlapIds = new Set(candidates.flatMap((candidate) => candidate.institutionIds));
  const regions = [...new Set(state.institutions.map((item) => item.region))].sort();
  const states = [...new Set(state.institutions.map((item) => item.state))].sort();
  const bureaus = [...new Set(state.cases.map((item) => item.bureau))].sort();
  const filtered = useMemo(() => state.institutions.filter((item) => {
    const associated = institutionCases(state, item.id);
    if (nameQuery && !item.name.toLowerCase().includes(nameQuery.toLowerCase())) return false;
    if (idQuery && !item.permanentId.toLowerCase().includes(idQuery.toLowerCase())) return false;
    if (region && item.region !== region) return false;
    if (selectedState && item.state !== selectedState) return false;
    if (bureau && !associated.some((record) => record.bureau === bureau)) return false;
    if (caseStatus && !associated.some((record) => record.status === caseStatus)) return false;
    if (overlap === "Yes" && !overlapIds.has(item.id)) return false;
    if (overlap === "No" && overlapIds.has(item.id)) return false;
    return true;
  }), [state, nameQuery, idQuery, region, selectedState, bureau, caseStatus, overlap]);
  const clearFilters = () => { setNameQuery(""); setIdQuery(""); setRegion(""); setSelectedState(""); setBureau(""); setCaseStatus(""); setOverlap(""); };
  const columns: TableColumn<Institution>[] = [
    { key: "identity", header: "Institution", sortable: true, sortValue: (item) => item.name, render: (item) => <Link href={`/institutions/${item.id}`} className="institution-cell-link"><strong>{item.name}</strong><small>{item.permanentId}</small></Link> },
    { key: "region", header: "Region / state", sortable: true, sortValue: (item) => `${item.region} ${item.state}`, render: (item) => <span className="cell-stack"><strong>{item.region}</strong><small>{item.state}</small></span> },
    { key: "cases", header: "Cases", sortable: true, sortValue: (item) => institutionCases(state, item.id).length, render: (item) => { const cases = institutionCases(state, item.id); return <span className="number-pair"><strong>{formatNumber(cases.length)}</strong><small>{cases.filter((record) => record.status !== "Disposed").length} open</small></span>; } },
    { key: "bureaus", header: "Bureaus / cells", render: (item) => { const teams = [...new Set(institutionCases(state, item.id).map((record) => record.bureau))]; return teams.length ? <div className="compact-chip-list">{teams.map((team) => <span key={team} className="bureau-chip">{bureauShort(team)}</span>)}</div> : <span className="quiet-dash">No cases</span>; } },
    { key: "coordination", header: "Coordination", render: (item) => overlapIds.has(item.id) ? <span className="coordination-flag"><span />Review</span> : <span className="quiet-dash">—</span> },
    { key: "activity", header: "Last activity", sortable: true, sortValue: (item) => item.lastActivity, render: (item) => <span className="date-cell">{formatDate(item.lastActivity)}</span> },
    { key: "actions", header: "", render: (item) => <Button variant="ghost" size="sm" onClick={() => navigate(`/institutions/${item.id}`)} aria-label={`Open ${item.name} profile`}>Open <ArrowRight size={13} /></Button> },
  ];
  const activeCount = [nameQuery, idQuery, region, selectedState, bureau, caseStatus, overlap].filter(Boolean).length;
  return <AppShell title="Institution Registry" description="A consolidated directory of institution records and all associated case activity." eyebrow="INSTITUTION RECORDS" action={<div className="record-count"><Building2 size={15} />{filtered.length} of {state.institutions.length} institutions</div>}>
    <div className="institution-page">
      <div className="demo-banner"><span className="demo-banner-mark">D</span><span><strong>Demonstration records</strong><small>Fictional institution names and example Permanent IDs. No official directory is connected.</small></span></div>
      <Panel title="Search and filter institutions" description="Combine filters to narrow the directory." className="filter-panel"><div className="filters-grid institution-filters"><label className="filter-field"><span>Institution name</span><SearchInput value={nameQuery} onChange={setNameQuery} placeholder="Search institution name" /></label><label className="filter-field"><span>Permanent ID</span><SearchInput value={idQuery} onChange={setIdQuery} placeholder="DEMO-10024" /></label><SelectField label="Region" value={region} onChange={setRegion} options={regions} /><SelectField label="State" value={selectedState} onChange={setSelectedState} options={states} /><SelectField label="Bureau / Cell" value={bureau} onChange={setBureau} options={bureaus} /><SelectField label="Case status" value={caseStatus} onChange={setCaseStatus} options={["Pending", "Under process", "Transferred", "Escalated", "Disposed"]} /><SelectField label="Overlap detected" value={overlap} onChange={setOverlap} options={["Yes", "No"]} /></div>{activeCount > 0 && <div className="filter-summary"><span>{activeCount} active {activeCount === 1 ? "filter" : "filters"}</span><Button variant="ghost" size="sm" onClick={clearFilters}>Clear all</Button></div>}</Panel>
      <Panel title="Institutions" description="Open a record to view its consolidated 360° case history." className="registry-table-panel"><DataTable data={filtered} columns={columns} initialPageSize={12} emptyTitle="No institutions match these filters" emptyDetail="Clear or adjust filters to return to the full institution directory." /></Panel>
    </div>
  </AppShell>;
}

export function InstitutionProfilePage({ institutionId }: { institutionId: string }) {
  const { state } = useDemoStore();
  const [, navigate] = useLocation();
  const institution = state.institutions.find((item) => item.id === institutionId);
  if (!institution) return <AppShell title="Institution not found" description="This demonstration record could not be located."><EmptyState title="Institution record unavailable" detail="Return to the registry to choose an available synthetic institution." action={<Button variant="outline" onClick={() => navigate("/institutions")}>Back to institutions</Button>} /></AppShell>;
  const cases = institutionCases(state, institution.id).sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
  const counts = getCounts(cases);
  const overdue = cases.filter((item) => isOverdue(item)).length;
  const candidates = findOverlapCandidates(state.institutions, state.cases, state.reviewOutcomes).filter((candidate) => candidate.institutionIds.includes(institution.id));
  const teams = [...new Set(cases.map((item) => item.bureau))];
  const history = cases.flatMap((item) => item.history.map((entry) => ({ ...entry, caseId: item.id, category: item.category }))).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 12);
  const allAttachments = cases.flatMap((item) => item.attachmentNames.map((name) => ({ name, caseId: item.id })));
  const caseColumns: TableColumn<CaseRecord>[] = [
    { key: "id", header: "Case ID", sortable: true, sortValue: (item) => item.id, render: (item) => <Link className="record-link mono" href={`/cases/${item.id}`}>{item.id}</Link> },
    { key: "received", header: "Received", sortable: true, sortValue: (item) => item.receivedAt, render: (item) => <span className="date-cell">{formatDate(item.receivedAt)}</span> },
    { key: "category", header: "Category", sortable: true, sortValue: (item) => item.category, render: (item) => <span>{item.category}</span> },
    { key: "bureau", header: "Bureau / Cell", sortable: true, sortValue: (item) => item.bureau, render: (item) => <span className="bureau-short">{bureauShort(item.bureau)}</span> },
    { key: "status", header: "Status", sortable: true, sortValue: (item) => item.status, render: (item) => <StatusBadge status={item.status} /> },
    { key: "activity", header: "Last action", sortable: true, sortValue: (item) => item.lastActionAt, render: (item) => <span className="date-cell">{formatDate(item.lastActionAt)}</span> },
    { key: "open", header: "", render: (item) => <Link className="table-open-link" href={`/cases/${item.id}`}>View <ArrowRight size={13} /></Link> },
  ];
  const grouped = teams.map((bureau) => ({ bureau, items: cases.filter((item) => item.bureau === bureau) }));
  return <AppShell title="Institution 360° Profile" description="One institution record, consolidated across all Bureaus and Cells." eyebrow="INSTITUTION REGISTRY" action={<Button variant="outline" onClick={() => navigate("/institutions")}><ArrowLeft size={14} />Back to registry</Button>}>
    <div className="profile-page">
      <section className="institution-hero"><div className="institution-avatar"><Building2 size={22} /></div><div className="institution-hero-main"><div className="eyebrow">SYNTHETIC DEMONSTRATION INSTITUTION</div><h2>{institution.name}</h2><div className="institution-id-line"><span>{institution.permanentId}</span><span className="id-divider">·</span><span>{institution.institutionType}</span><span className="id-divider">·</span><span>{institution.city}, {institution.state}</span></div><div className="institution-teams"><span>Involved teams</span>{teams.length ? teams.map((team) => <span className="bureau-chip" key={team}>{bureauShort(team)}</span>) : <span className="quiet-dash">No cases yet</span>}</div></div><div className="profile-action"><Button variant="outline" onClick={() => { navigator.clipboard?.writeText(institution.permanentId); toast.success("Permanent ID copied to clipboard"); }}>Copy Permanent ID</Button></div></section>
      <div className="profile-metrics"><div><small>Associated cases</small><strong>{formatNumber(counts.total)}</strong><span>Across {teams.length} Bureaus / Cells</span></div><div><small>Open / pending</small><strong>{formatNumber(counts.pending + counts.inProcess + counts.transferred + cases.filter((item) => item.status === "Escalated").length)}</strong><span>All active statuses</span></div><div><small>Disposed</small><strong>{formatNumber(counts.disposed)}</strong><span>Response recorded</span></div><div className={overdue ? "profile-overdue" : ""}><small>Past expected date</small><strong>{formatNumber(overdue)}</strong><span>Illustrative demo dates</span></div></div>
      {candidates.length > 0 && <div className="profile-overlap-alert"><div className="alert-symbol">↔</div><div><strong>Coordination context is available for human review</strong><p>{candidates.map((candidate) => candidate.reason).join(" ")}</p></div><OutcomeBadge outcome={candidates[0].outcome} /><Link href={`/overlaps?candidate=${encodeURIComponent(candidates[0].id)}`} className="table-open-link">Open review <ArrowRight size={13} /></Link></div>}
      <div className="profile-grid"><div className="profile-main-column">
        <Panel title="Associated cases" description="Records remain separate; each case has its own official status." className="registry-table-panel"><DataTable data={cases} columns={caseColumns} initialPageSize={8} emptyTitle="No associated cases" emptyDetail="New case records for this institution will appear here." /></Panel>
        <Panel title="Activity history" description="Important actions across the institution's complete case history." className="history-panel">{history.length ? <ol className="timeline-list">{history.map((entry) => <li className="timeline-item" key={entry.id}><span className="timeline-dot" /><div className="timeline-copy"><div className="timeline-topline"><strong>{entry.summary}</strong><span className="timeline-date">{formatDate(entry.at)}</span></div><div className="timeline-meta"><Link href={`/cases/${entry.caseId}`}>{entry.caseId}</Link><span>·</span><span>{entry.bureau}</span><span>·</span><span>{entry.actor}</span></div></div></li>)}</ol> : <EmptyState title="No activity recorded" detail="Case actions will appear in this chronology." />}</Panel>
      </div><aside className="profile-side-column">
        <Panel title="Institution details" description="Synthetic demonstration profile."><dl className="detail-list"><div><dt><MapPin size={14} />Region</dt><dd>{institution.region}</dd></div><div><dt>State</dt><dd>{institution.state}</dd></div><div><dt>City</dt><dd>{institution.city}</dd></div><div><dt>Institution type</dt><dd>{institution.institutionType}</dd></div><div><dt>Established</dt><dd>{institution.established}</dd></div><div><dt><CalendarClock size={14} />Last activity</dt><dd>{formatDate(institution.lastActivity)}</dd></div></dl><div className="fake-record-note">Example identity only · not an official directory record.</div></Panel>
        <Panel title="Cases by Bureau / Cell" description="Separate workstreams across the same institution.">{grouped.length ? <div className="bureau-groups">{grouped.map((group) => <div className="bureau-group" key={group.bureau}><div><span className="bureau-group-name">{bureauShort(group.bureau)}</span><span className="bureau-group-count">{group.items.length} {group.items.length === 1 ? "case" : "cases"}</span></div><div className="bureau-group-status">{group.items.map((item) => <StatusBadge key={item.id} status={item.status} />)}</div></div>)}</div> : <EmptyState title="No Bureau activity" detail="There are no linked case records yet." />}</Panel>
        <Panel title="Supporting documents" description="Attachments from associated case records.">{allAttachments.length ? <div className="attachment-list">{allAttachments.map((attachment) => <Link key={`${attachment.caseId}-${attachment.name}`} href={`/cases/${attachment.caseId}`} className="attachment-item"><FileText size={15} /><span><strong>{attachment.name}</strong><small>{attachment.caseId} · synthetic sample</small></span><ArrowRight size={13} /></Link>)}</div> : <div className="inline-empty"><FileText size={17} /><span>No demonstration attachments are linked to this institution.</span></div>}</Panel>
        <Panel title="Case linkage" description="Cases linked by the demo reviewer or same identity."><div className="related-cases-list">{cases.flatMap((item) => item.relatedCaseIds.map((relatedId) => ({ item, relatedId }))).filter((entry, index, all) => all.findIndex((other) => other.relatedId === entry.relatedId && other.item.id === entry.item.id) === index).map(({ item, relatedId }) => <Link key={`${item.id}-${relatedId}`} href={`/cases/${relatedId}`} className="related-case-link"><UsersRound size={14} /><span>{item.id} ↔ {relatedId}</span><ArrowRight size={13} /></Link>)}</div>{cases.every((item) => item.relatedCaseIds.length === 0) && <p className="muted-copy">No case links are recorded; multiple cases do not imply a duplicate.</p>}</Panel>
      </aside></div>
      <p className="demo-note">Institution profiles aggregate synthetic cases by example institution identity. All shown names, ID values, activities, and attachments are for demonstration.</p>
    </div>
  </AppShell>;
}
