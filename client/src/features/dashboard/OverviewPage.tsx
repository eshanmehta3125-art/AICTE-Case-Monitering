import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { Activity, AlertCircle, ArrowDownRight, ArrowRight, ArrowUpRight, ArrowUpRightFromSquare, BellRing, Building2, CalendarClock, CheckCircle2, Clock3, FilePlus2, FileSearch, GitCompareArrows, MessageSquareText, Send, ShieldAlert, UserRoundCheck, Zap } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { DataTable, EmptyState, OutcomeBadge, Panel, PriorityBadge, StatusBadge, type TableColumn } from "@/features/shared/ui";
import { NumberTicker } from "@/features/shared/NumberTicker";
import { SimulationControls } from "@/features/shared/SimulationControls";
import { useDemoStore } from "@/contexts/DemoStore";
import { useSimulation } from "@/contexts/SimulationContext";
import { useTheme } from "@/contexts/ThemeContext";
import { bureauSummary, findOverlapCandidates, formatDate, formatNumber, formatTimestamp, getCounts, isApproaching, isOverdue, monthlyTrend, recentActivity, statusDistribution, ageingDistribution } from "@/services/analytics";
import type { ActionKind, CaseRecord } from "@/types/domain";

const statusColors: Record<string, string> = { Pending: "var(--chart-pending)", "Under process": "var(--chart-processing)", Transferred: "var(--chart-transfer)", Escalated: "var(--chart-escalated)", Disposed: "var(--chart-disposed)" };
const curve: [number, number, number, number] = [0.22, 1, 0.36, 1];
type ChartPeriod = 3 | 6 | 8;

function shortBureau(value: string) {
  return value.replace("Public Grievance Redressal Cell (PGRC)", "PGRC").replace("Regulation Bureau (RB)", "RB").replace("Western Regional Office", "Western RO").replace("Academic Affairs Cell", "Academic Affairs");
}

function ActivityIcon({ kind }: { kind: ActionKind }) {
  if (kind === "Received") return <FilePlus2 size={15} aria-hidden="true" />;
  if (kind === "Assignment") return <UserRoundCheck size={15} aria-hidden="true" />;
  if (kind === "Transfer") return <Send size={15} aria-hidden="true" />;
  if (kind === "Overlap detection") return <GitCompareArrows size={15} aria-hidden="true" />;
  if (kind === "Escalation") return <AlertCircle size={15} aria-hidden="true" />;
  if (kind === "Coordination" || kind === "Related case") return <Building2 size={15} aria-hidden="true" />;
  if (kind === "Deadline update") return <CalendarClock size={15} aria-hidden="true" />;
  if (kind === "Status update") return <CheckCircle2 size={15} aria-hidden="true" />;
  if (kind === "Note") return <MessageSquareText size={15} aria-hidden="true" />;
  return <Activity size={15} aria-hidden="true" />;
}

function daysPastExpected(date: string | null) {
  if (!date) return 0;
  const today = new Date().toISOString().slice(0, 10);
  return Math.max(1, Math.floor((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${date.slice(0, 10)}T00:00:00Z`)) / 86400000));
}

export function OverviewPage() {
  const { state } = useDemoStore();
  const { paused, sequence, latestEventAt } = useSimulation();
  const { resolvedTheme } = useTheme();
  const [, navigate] = useLocation();
  const reduceMotion = useReducedMotion();
  const [trendPeriod, setTrendPeriod] = useState<ChartPeriod>(8);
  const counts = getCounts(state.cases);
  const candidates = useMemo(() => findOverlapCandidates(state.institutions, state.cases, state.reviewOutcomes), [state.institutions, state.cases, state.reviewOutcomes]);
  const pendingCandidates = candidates.filter((candidate) => candidate.outcome === "pending");
  const bureauData = useMemo(() => bureauSummary(state.cases), [state.cases]);
  const statuses = useMemo(() => statusDistribution(state.cases), [state.cases]);
  const trend = useMemo(() => monthlyTrend(state.cases, trendPeriod), [state.cases, trendPeriod]);
  const ageing = useMemo(() => ageingDistribution(state.cases), [state.cases]);
  const activity = useMemo(() => recentActivity(state, 9), [state.cases, state.institutions]);
  const recent = useMemo(() => [...state.cases].sort((a, b) => (b.lastActionAt ?? "").localeCompare(a.lastActionAt ?? "")).slice(0, 6), [state.cases]);
  const dueSoon = state.cases.filter((item) => isApproaching(item) || isOverdue(item)).sort((a, b) => (a.expectedDisposalDate ?? "").localeCompare(b.expectedDisposalDate ?? "")).slice(0, 5);
  const recentDecisions = activity.filter((item) => item.kind === "Coordination" && /Reviewed|Confirmed related|Confirmed duplicate/i.test(item.summary)).slice(0, 4);
  const dark = resolvedTheme === "dark";
  const tooltipStyle = useMemo(() => ({ background: dark ? "rgba(24,24,25,.97)" : "rgba(255,255,255,.98)", border: `1px solid ${dark ? "rgba(255,255,255,.14)" : "rgba(33,33,33,.13)"}`, borderRadius: 9, color: dark ? "#f1f1f1" : "#26282a", fontSize: 12, boxShadow: dark ? "0 14px 36px rgba(0,0,0,.35)" : "0 12px 30px rgba(40,30,22,.12)" }), [dark]);
  const tick = { fill: dark ? "#9a9aa0" : "#6e7072", fontSize: 10 };

  const metricItems = [
    { label: "Total cases", value: counts.total, href: "/cases", note: "All synthetic records", icon: FileSearch },
    { label: "Pending", value: counts.pending, href: "/cases?status=Pending", note: "Awaiting an initial action", icon: Clock3 },
    { label: "Under process", value: counts.inProcess, href: "/cases?status=Under%20process", note: "Active review in progress", icon: ArrowUpRight },
    { label: "Disposed", value: counts.disposed, href: "/cases?status=Disposed", note: "Response recorded", icon: ArrowDownRight },
    { label: "Transferred", value: counts.transferred, href: "/cases?status=Transferred", note: "Moved between teams", icon: ArrowUpRightFromSquare },
    { label: "Overdue", value: counts.overdue, href: "/cases?overdue=true", note: "Past illustrative dates", icon: ShieldAlert, critical: counts.overdue > 0 },
  ];

  const recentColumns: TableColumn<CaseRecord>[] = [
    { key: "id", header: "Case ID", sortable: true, sortValue: (item) => item.id, render: (item) => <Link className="record-link mono" href={`/cases/${item.id}`}>{item.id}</Link> },
    { key: "institution", header: "Institution", sortable: true, sortValue: (item) => state.institutions.find((entry) => entry.id === item.institutionId)?.name, render: (item) => { const institution = state.institutions.find((entry) => entry.id === item.institutionId); return <Link className="institution-cell-link" href={`/institutions/${item.institutionId}`}><strong>{institution?.name ?? "Institution"}</strong><small>{institution?.permanentId ?? "—"}</small></Link>; } },
    { key: "bureau", header: "Bureau / Cell", sortable: true, sortValue: (item) => item.bureau, render: (item) => <span className="bureau-short">{shortBureau(item.bureau)}</span> },
    { key: "status", header: "Status", sortable: true, sortValue: (item) => item.status, render: (item) => <StatusBadge status={item.status} /> },
    { key: "last-action", header: "Last action", sortable: true, sortValue: (item) => item.lastActionAt, render: (item) => <span className="date-cell">{formatDate(item.lastActionAt)}</span> },
  ];

  const periodLabel = trendPeriod === 3 ? "Aug–Oct 2026" : trendPeriod === 6 ? "May–Oct 2026" : "Mar–Oct 2026";
  const updatedLabel = latestEventAt ? formatTimestamp(latestEventAt) : "27 Oct 2026 · seed";

  return <AppShell title="Institution Complaint Monitoring" description="Track complaints, regulatory actions, and cross-bureau coordination in one place." eyebrow="OVERVIEW · DEMONSTRATION DATA" action={<div className="updated-chip"><span className={`demo-status-pip ${paused ? "paused" : ""}`} aria-hidden="true" /><span>{paused ? "Simulation paused" : "Synthetic workspace"}</span><strong>{updatedLabel}</strong><span className="updated-divider">·</span><span>{sequence} events</span></div>}>
    <div className="overview-content">
      <section className="metric-grid" aria-label="Case summary metrics">{metricItems.map((metric, index) => <Link key={metric.label} href={metric.href} className={`metric-card ${metric.critical ? "metric-critical" : ""} ${index === 0 ? "metric-primary" : ""}`}><div className="metric-top"><span>{metric.label}</span><metric.icon size={15} aria-hidden="true" /></div><div className="metric-value"><NumberTicker value={metric.value} label={metric.label} /></div><div className="metric-note"><span>{metric.note}</span><ArrowRight size={13} aria-hidden="true" /></div></Link>)}</section>

      <section className="coordination-block" aria-labelledby="coordination-title">
        <div className="coordination-heading"><div className="coordination-icon"><Activity size={17} aria-hidden="true" /></div><div className="coordination-heading-copy"><div className="coordination-overline">PRIORITY QUEUE · HUMAN REVIEW</div><h2 id="coordination-title">Potential Overlapping Cases — Coordination Required</h2><p>Same-institution records can represent separate actions. Review before coordinating; nothing is merged automatically.</p></div><Link href="/overlaps" className="view-all-link">Open review centre <ArrowRight size={14} aria-hidden="true" /></Link></div>
        {pendingCandidates.length ? <div className="coordination-list">{pendingCandidates.slice(0, 3).map((candidate) => {
          const institutions = candidate.institutionIds.map((id) => state.institutions.find((item) => item.id === id)).filter(Boolean);
          const relatedCases = candidate.caseIds.map((id) => state.cases.find((item) => item.id === id)).filter(Boolean);
          const isUncertain = candidate.source === "name-variation";
          return <article key={candidate.id} className="coordination-row"><div className="coordination-main"><div className="coordination-institution">{institutions.map((item) => item!.name).join(" / ")}</div><div className="coordination-identity">{institutions.map((item) => item!.permanentId).join(" · ")}<span>·</span>{relatedCases.length} related cases</div></div><div className="coordination-meta"><div className="bureau-chips">{candidate.bureaus.map((bureau) => <span key={bureau} className="bureau-chip">{shortBureau(bureau)}</span>)}</div><div className="coordination-reason">{isUncertain ? "Name variation · verify identity" : "Same institution ID · parallel actions"}</div></div><div className="coordination-last"><small>LAST ACTION</small><strong>{formatDate(candidate.lastActionAt)}</strong><OutcomeBadge outcome={candidate.outcome} /></div><Button className="review-button" variant="outline" size="sm" onClick={() => navigate(`/overlaps?candidate=${encodeURIComponent(candidate.id)}`)}>Review overlap<ArrowRight size={13} aria-hidden="true" /></Button></article>;
        })}</div> : <EmptyState title="No overlap reviews are pending" detail="Reviewed outcomes remain available in the Overlap Review Centre." action={<Link className="text-link" href="/overlaps">View review history <ArrowRight size={14} /></Link>} />}
        <div className="coordination-footnote"><span className="note-lock" aria-hidden="true">i</span> A matched institution is not a confirmed duplicate. Human review is required.</div>
      </section>

      <div className="overview-simulation-row"><SimulationControls /><div className="simulation-context-note"><BellRing size={17} aria-hidden="true" /><div><strong>One shared synthetic workspace</strong><span>Case history, charts, alerts and overlap candidates update from the same local records.</span></div></div></div>

      <div className="dashboard-grid dashboard-charts">
        <Panel title="Case volume by status" description={`${formatNumber(state.cases.length)} synthetic records · current status`} className="chart-panel"><div className="status-chart-layout"><div className="status-chart" role="img" aria-label={`Status distribution. ${statuses.map((item) => `${item.status}: ${item.count}`).join(", ")}`}><ResponsiveContainer width="100%" height="100%"><PieChart accessibilityLayer><Pie data={statuses.filter((item) => item.count > 0)} dataKey="count" nameKey="status" innerRadius={50} outerRadius={73} paddingAngle={2} stroke="none" isAnimationActive={!reduceMotion} animationDuration={420} animationEasing="ease-out">{statuses.filter((item) => item.count > 0).map((item) => <Cell key={item.status} fill={statusColors[item.status]} />)}</Pie><Tooltip contentStyle={tooltipStyle} formatter={(value, name) => [formatNumber(Number(value)), name]} /></PieChart></ResponsiveContainer><div className="donut-center"><strong><NumberTicker value={counts.total} label="Total cases" /></strong><small>cases</small></div></div><div className="chart-legend">{statuses.map((item) => <div key={item.status} className="legend-row"><span className="legend-dot" style={{ background: statusColors[item.status] }} /><span>{item.status}</span><small>{counts.total ? `${Math.round((item.count / counts.total) * 100)}%` : "0%"}</small><strong>{formatNumber(item.count)}</strong></div>)}</div></div></Panel>
        <Panel title="Workload by Bureau / Cell" description="Pending and under-process cases · select a Bureau to open its queue" action={<Link href="/workload" className="panel-action">View workload <ArrowRight size={13} aria-hidden="true" /></Link>} className="chart-panel"><div className="bar-chart-wrap"><ResponsiveContainer width="100%" height="100%"><BarChart data={bureauData} layout="vertical" margin={{ left: 4, right: 15, top: 3, bottom: 0 }} barCategoryGap={12} accessibilityLayer><CartesianGrid stroke="var(--chart-grid)" horizontal={false} /><XAxis type="number" tickLine={false} axisLine={false} tick={tick} allowDecimals={false} domain={[0, "dataMax + 1"]} /><YAxis type="category" dataKey="bureau" tickLine={false} axisLine={false} width={110} tick={tick} tickFormatter={shortBureau} /><Tooltip contentStyle={tooltipStyle} formatter={(value, name) => [formatNumber(Number(value)), name]} /><Bar dataKey="pending" name="Pending" stackId="a" fill="var(--chart-pending)" radius={[3, 0, 0, 3]} isAnimationActive={!reduceMotion} animationDuration={380} cursor="pointer" onClick={(_, index) => { const row = bureauData[index]; if (row) navigate(`/cases?bureau=${encodeURIComponent(row.bureau)}`); }} /><Bar dataKey="inProcess" name="Under process" stackId="a" fill="var(--chart-processing)" radius={[0, 3, 3, 0]} isAnimationActive={!reduceMotion} animationDuration={380} cursor="pointer" onClick={(_, index) => { const row = bureauData[index]; if (row) navigate(`/cases?bureau=${encodeURIComponent(row.bureau)}`); }} /></BarChart></ResponsiveContainer></div><div className="chart-caption"><span><i className="legend-dot" style={{ background: "var(--chart-pending)" }} />Pending</span><span><i className="legend-dot" style={{ background: "var(--chart-processing)" }} />Under process</span><span className="caption-note">Additional statuses in the team table</span></div></Panel>
        <Panel title="Received vs. disposed" description={`Monthly trend · ${periodLabel}`} action={<label className="chart-period-control"><span className="sr-only">Trend reporting period</span><select value={trendPeriod} onChange={(event) => setTrendPeriod(Number(event.target.value) as ChartPeriod)} aria-label="Trend reporting period"><option value={3}>Last 3 sample months</option><option value={6}>Last 6 sample months</option><option value={8}>Mar–Oct 2026</option></select></label>} className="chart-panel"><div className="line-chart-wrap" role="img" aria-label={`Monthly cases received and disposed. ${trend.map((item) => `${item.month}: ${item.received} received, ${item.disposed} disposed`).join("; ")}`}><ResponsiveContainer width="100%" height="100%"><LineChart data={trend} margin={{ left: -16, right: 8, top: 8, bottom: 0 }} accessibilityLayer><CartesianGrid stroke="var(--chart-grid)" vertical={false} /><XAxis dataKey="month" tickLine={false} axisLine={false} tick={tick} /><YAxis tickLine={false} axisLine={false} tick={tick} allowDecimals={false} domain={[0, "dataMax + 1"]} /><Tooltip contentStyle={tooltipStyle} formatter={(value, name) => [formatNumber(Number(value)), name]} /><Line type="monotone" dataKey="received" name="Received" stroke="var(--chart-received)" strokeWidth={2.2} dot={{ r: 3, fill: "var(--chart-received)", strokeWidth: 0 }} activeDot={{ r: 4.5 }} isAnimationActive={!reduceMotion} animationDuration={440} animationEasing="ease-out" /><Line type="monotone" dataKey="disposed" name="Disposed" stroke="var(--chart-disposed)" strokeWidth={2} dot={{ r: 3, fill: "var(--chart-disposed)", strokeWidth: 0 }} activeDot={{ r: 4.5 }} isAnimationActive={!reduceMotion} animationDuration={440} animationEasing="ease-out" /></LineChart></ResponsiveContainer></div><div className="chart-caption"><span><i className="legend-dot" style={{ background: "var(--chart-received)" }} />Received</span><span><i className="legend-dot" style={{ background: "var(--chart-disposed)" }} />Disposed</span><span className="caption-note">Counts derive from case history and dates</span></div></Panel>
        <Panel title="Pending-case ageing" description="Open cases · age since case registration" className="chart-panel"><div className="ageing-chart-wrap" role="img" aria-label={`Pending-case ageing. ${ageing.map((item) => `${item.band}: ${item.count}`).join(", ")}`}><ResponsiveContainer width="100%" height="100%"><BarChart data={ageing} margin={{ left: -17, right: 8, top: 6, bottom: 0 }} accessibilityLayer><CartesianGrid stroke="var(--chart-grid)" vertical={false} /><XAxis dataKey="band" tickLine={false} axisLine={false} tick={tick} /><YAxis tickLine={false} axisLine={false} tick={tick} allowDecimals={false} /><Tooltip contentStyle={tooltipStyle} formatter={(value) => [formatNumber(Number(value)), "Cases"]} /><Bar dataKey="count" fill="var(--chart-pending)" radius={[4, 4, 0, 0]} isAnimationActive={!reduceMotion} animationDuration={380} /></BarChart></ResponsiveContainer></div><div className="chart-footnote">Ageing uses received dates; deadlines use separate illustrative expected dates</div></Panel>
      </div>

      <div className="dashboard-grid dashboard-lists">
        <Panel title="Recently updated cases" description="Latest activity across Bureaus and Cells" action={<Link href="/cases" className="panel-action">All cases <ArrowRight size={13} aria-hidden="true" /></Link>} className="table-panel"><DataTable data={recent} columns={recentColumns} initialPageSize={6} /></Panel>
        <Panel title="Deadline watch" description="Approaching or past expected disposal dates" action={<Link href="/cases?overdue=true" className="panel-action">Review overdue cases <ArrowRight size={13} aria-hidden="true" /></Link>} className="deadline-panel">{dueSoon.length ? <div className="deadline-list">{dueSoon.map((item) => {
          const institution = state.institutions.find((entry) => entry.id === item.institutionId);
          const overdue = isOverdue(item);
          return <Link key={item.id} href={`/cases/${item.id}`} className={`deadline-item ${overdue ? "deadline-overdue" : ""}`}><span className="deadline-marker"><span /></span><span className="deadline-content"><strong>{institution?.name ?? "Institution"}</strong><small>{item.id} · {item.category}</small></span><span className="deadline-date"><small>{overdue ? `${daysPastExpected(item.expectedDisposalDate)}d past expected` : "EXPECTED"}</small><strong>{formatDate(item.expectedDisposalDate)}</strong><StatusBadge status={item.status} /></span></Link>;
        })}</div> : <EmptyState title="No dates need attention" detail="Cases with an approaching expected date will appear here." />}</Panel>
      </div>

      <div className="dashboard-grid dashboard-live-grid">
        <Panel title="Live activity" description="New actions from the same local case history" action={<Link href="/cases" className="panel-action">Open case registry <ArrowRight size={13} aria-hidden="true" /></Link>} className="live-activity-panel"><ol className="live-activity-list" aria-label="Recent synthetic case activity"><AnimatePresence initial={false}>{activity.map((item) => <motion.li key={item.id} layout className="live-activity-item" initial={reduceMotion ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: -4 }} transition={{ duration: 0.23, ease: curve }}><span className="live-activity-icon"><ActivityIcon kind={item.kind} /></span><span className="live-activity-body"><strong>{item.summary}</strong><Link href={`/cases/${item.caseId}`} className="live-activity-case">{item.caseId} · {item.institutionName}</Link><small>{shortBureau(item.bureau)} · {item.actor}</small></span><time className="live-activity-time" dateTime={item.at}>{formatTimestamp(item.at)}</time></motion.li>)}</AnimatePresence></ol>{!activity.length && <EmptyState title="No activity has been recorded" detail="Case updates will appear here." />}</Panel>
        <Panel title="Recent coordination decisions" description="Human-recorded review history; candidates are never merged automatically" className="coordination-decisions-panel">{recentDecisions.length ? <div className="decision-list">{recentDecisions.map((item) => <article key={item.id} className="decision-item"><span className="decision-mark"><CheckCircle2 size={15} aria-hidden="true" /></span><span><strong>{item.summary}</strong><Link href={`/cases/${item.caseId}`} className="live-activity-case">{item.caseId} · {item.institutionName}</Link><small>{shortBureau(item.bureau)} · {formatTimestamp(item.at)}</small></span></article>)}</div> : <EmptyState title="No review outcomes recorded yet" detail="Confirmed-related, duplicate, and no-conflict decisions appear here after a human reviewer records an outcome." action={<Link className="text-link" href="/overlaps">Review overlap candidates <ArrowRight size={14} /></Link>} />}</Panel>
      </div>
      <p className="demo-note">All figures, expected dates, institutions, officers, simulation activity, and case records shown here are synthetic demonstration data. Expected dates are illustrative, not statutory deadlines.</p>
    </div>
  </AppShell>;
}
