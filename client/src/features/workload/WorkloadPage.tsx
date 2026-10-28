import { Link, useLocation } from "wouter";
import { ArrowRight, Clock3, FileText, ShieldAlert, UsersRound } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { DataTable, Panel, type TableColumn } from "@/features/shared/ui";
import { useDemoStore } from "@/contexts/DemoStore";
import { bureauSummary, findOverlapCandidates, formatNumber, isApproaching, isOverdue } from "@/services/analytics";

const compactName = (value: string) => value.replace("Public Grievance Redressal Cell (PGRC)", "PGRC").replace("Regulation Bureau (RB)", "RB").replace("Western Regional Office", "Western RO").replace("Academic Affairs Cell", "Academic Affairs");
export function WorkloadPage() {
  const { state } = useDemoStore();
  const [, navigate] = useLocation();
  const pendingOverlapCases = new Set(findOverlapCandidates(state.institutions, state.cases, state.reviewOutcomes).filter((candidate) => candidate.outcome === "pending").flatMap((candidate) => candidate.caseIds));
  const coordinationCount = new Set([...pendingOverlapCases, ...state.cases.filter((item) => item.awaitingBureau).map((item) => item.id)]).size;
  const rows = bureauSummary(state.cases).map((item) => ({ ...item, id: item.bureau, open: item.pending + item.inProcess + item.transferred + state.cases.filter((record) => record.bureau === item.bureau && record.status === "Escalated").length, disposed: item.disposed, overlaps: state.cases.filter((record) => record.bureau === item.bureau && pendingOverlapCases.has(record.id)).length }));
  const totalAssigned = state.cases.length;
  const pending = state.cases.filter((item) => item.status === "Pending").length;
  const underProcess = state.cases.filter((item) => item.status === "Under process").length;
  const overdue = state.cases.filter((item) => isOverdue(item)).length;
  const approaching = state.cases.filter((item) => isApproaching(item)).length;
  const awaiting = state.cases.filter((item) => item.awaitingBureau).length;
  const disposed = state.cases.filter((item) => item.status === "Disposed").length;
  const overlaps = pendingOverlapCases.size;
  const columns: TableColumn<(typeof rows)[number]>[] = [
    { key: "bureau", header: "Bureau / Cell", sortable: true, sortValue: (item) => item.bureau, render: (item) => <div className="team-cell"><span className="team-mark">{compactName(item.bureau).slice(0, 1)}</span><strong>{item.bureau}</strong></div> },
    { key: "assigned", header: "Assigned", sortable: true, sortValue: (item) => item.total, render: (item) => <strong className="tabular">{formatNumber(item.total)}</strong> },
    { key: "open", header: "Open workload", sortable: true, sortValue: (item) => item.open, render: (item) => <span className="workload-open">{formatNumber(item.open)}</span> },
    { key: "pending", header: "Pending", sortable: true, sortValue: (item) => item.pending, render: (item) => <span>{formatNumber(item.pending)}</span> },
    { key: "in-process", header: "Under process", sortable: true, sortValue: (item) => item.inProcess, render: (item) => <span>{formatNumber(item.inProcess)}</span> },
    { key: "overdue", header: "Overdue", sortable: true, sortValue: (item) => item.overdue, render: (item) => <span className={item.overdue ? "text-critical tabular" : "quiet-dash"}>{item.overdue ? formatNumber(item.overdue) : "—"}</span> },
    { key: "approaching", header: "Approaching", sortable: true, sortValue: (item) => item.approaching, render: (item) => <span className={item.approaching ? "text-warning tabular" : "quiet-dash"}>{item.approaching ? formatNumber(item.approaching) : "—"}</span> },
    { key: "awaiting", header: "Awaiting another team", sortable: true, sortValue: (item) => item.awaiting, render: (item) => <span>{formatNumber(item.awaiting)}</span> },
    { key: "disposed", header: "Disposed", sortable: true, sortValue: (item) => item.disposed, render: (item) => <span>{formatNumber(item.disposed)}</span> },
    { key: "overlaps", header: "Overlap queue", sortable: true, sortValue: (item) => item.overlaps, render: (item) => <span>{formatNumber(item.overlaps)}</span> },
    { key: "open-cases", header: "", render: (item) => <Button variant="ghost" size="sm" onClick={() => navigate(`/cases?search=${encodeURIComponent(item.bureau)}`)}>Open cases <ArrowRight size={13} /></Button> },
  ];
  const totalOpen = rows.reduce((sum, item) => sum + item.open, 0);
  const chartData = rows.map((item) => ({ ...item, label: compactName(item.bureau) }));
  return <AppShell title="Bureau Workload" description="Operational distribution of assigned, active, overdue, and coordination-dependent cases." eyebrow="TEAM OPERATIONS" action={<div className="record-count"><UsersRound size={15} />{rows.length} teams</div>}>
    <div className="workload-page"><div className="demo-banner"><span className="demo-banner-mark">D</span><span><strong>Illustrative workload values</strong><small>Expected dates are demonstration markers only; no statutory deadlines or performance targets are represented.</small></span></div>
      <div className="workload-kpis"><Link href="/cases" className="workload-kpi"><span><FileText size={15} />Assigned cases</span><strong>{formatNumber(totalAssigned)}</strong><small>Across all demo teams</small></Link><Link href="/cases?status=Pending" className="workload-kpi"><span><Clock3 size={15} />Pending</span><strong>{formatNumber(pending)}</strong><small>{formatNumber(underProcess)} under process</small></Link><Link href="/cases?overdue=true" className="workload-kpi kpi-warning"><span><ShieldAlert size={15} />Overdue</span><strong>{formatNumber(overdue)}</strong><small>{formatNumber(approaching)} approaching expected date</small></Link><Link href="/overlaps" className="workload-kpi"><span><UsersRound size={15} />Coordination items</span><strong>{formatNumber(coordinationCount)}</strong><small>{formatNumber(awaiting)} awaiting another team · {formatNumber(overlaps)} overlap cases</small></Link></div>
      <div className="workload-grid"><Panel title="Active workload by Bureau / Cell" description="Pending and under-process files; values derived from the synthetic register."><div className="workload-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{ left: 0, right: 10, top: 5, bottom: 0 }}><CartesianGrid stroke="var(--line)" vertical={false} /><XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} interval={0} /><YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} allowDecimals={false} /><Tooltip formatter={(value, name) => [formatNumber(Number(value)), name]} contentStyle={{ color: "var(--ink-soft)", background: "var(--glass-strong)", border: "1px solid var(--line-strong)", borderRadius: 8, boxShadow: "var(--glass-shadow)", fontSize: 12 }} /><Bar dataKey="pending" name="Pending" fill="var(--chart-pending)" stackId="a" radius={[3, 3, 0, 0]} isAnimationActive={false} /><Bar dataKey="inProcess" name="Under process" fill="var(--chart-processing)" stackId="a" radius={[3, 3, 0, 0]} isAnimationActive={false} /></BarChart></ResponsiveContainer></div><div className="chart-caption"><span><i className="legend-dot workload-pending-dot" />Pending</span><span><i className="legend-dot workload-process-dot" />Under process</span><span className="caption-note">{totalOpen} active files across teams</span></div></Panel>
      <Panel title="Operational notes" description="What contributes to attention today."><div className="workload-note-list"><Link href="/cases?overdue=true"><span className="note-count critical">{overdue}</span><span><strong>Past expected dates</strong><small>Demo cases need follow-up review</small></span><ArrowRight size={14} /></Link><Link href="/cases?awaiting=true"><span className="note-count neutral">{awaiting}</span><span><strong>Awaiting another Bureau</strong><small>Records with an explicit awaiting-team flag</small></span><ArrowRight size={14} /></Link><Link href="/overlaps"><span className="note-count teal">{overlaps}</span><span><strong>Overlap review queue</strong><small>Potential matches require human review</small></span><ArrowRight size={14} /></Link><div className="workload-note-muted"><span>Disposed</span><strong>{formatNumber(disposed)}</strong><small>Kept separate from open workload</small></div></div></Panel></div>
      <Panel title="Workload by Bureau / Cell" description="Open a team's assigned files with a filter applied." className="registry-table-panel"><DataTable data={rows} columns={columns} initialPageSize={8} /></Panel>
      <div className="workload-footnote"><span>Illustrative case counts are not official performance measures.</span><Link href="/reports">Open operational reports <ArrowRight size={13} /></Link></div>
    </div>
  </AppShell>;
}
