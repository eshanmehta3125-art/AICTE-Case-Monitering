import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Download, FileBarChart2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { DataTable, EmptyState, FieldLabel, Panel, PriorityBadge, SelectField, StatusBadge, type TableColumn } from "@/features/shared/ui";
import { useDemoStore } from "@/contexts/DemoStore";
import { bureauSummary, caseAgeDays, findOverlapCandidates, formatDate, formatNumber, getCounts, isOverdue, monthlyTrend, statusDistribution } from "@/services/analytics";
import type { CaseRecord } from "@/types/domain";
import { toast } from "sonner";

type SummaryRow = { label: string; value: number; detail: string };

const reports = ["Institution-wise complaint history", "Bureau / Cell workload", "Region-wise case distribution", "Status-wise distribution", "Pending-case ageing", "Past expected disposal dates", "Disposal rate", "Monthly case trend", "Quarterly case trend", "Potential and confirmed duplicate cases", "Overlap review outcomes"];
const shortBureau = (value: string) => value.replace("Public Grievance Redressal Cell (PGRC)", "PGRC").replace("Regulation Bureau (RB)", "RB").replace("Western Regional Office", "Western RO").replace("Academic Affairs Cell", "Academic Affairs");
const shortInstitution = (value: string) => value.length > 28 ? `${value.slice(0, 25).trimEnd()}…` : value;
const csvCell = (value: string | number) => `"${String(value ?? "").replace(/"/g, '""')}"`;
const daysAgo = (days: number) => new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);

export function ReportsPage() {
  const { state } = useDemoStore();
  const [report, setReport] = useState(reports[0]);
  const [period, setPeriod] = useState("All demonstration data");
  const [bureau, setBureau] = useState("");
  const [region, setRegion] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const reportKey = report.toLowerCase();
  const isInstitutionReport = reportKey.includes("institution-wise");
  const categories = [...new Set(state.cases.map((item) => item.category))].sort();
  const regions = [...new Set(state.institutions.map((item) => item.region))].sort();
  const bureaus = [...new Set(state.cases.map((item) => item.bureau))].sort();
  const candidates = useMemo(() => findOverlapCandidates(state.institutions, state.cases, state.reviewOutcomes), [state.institutions, state.cases, state.reviewOutcomes]);
  const overlapCaseIds = useMemo(() => new Set(candidates.flatMap((candidate) => candidate.caseIds)), [candidates]);
  const duplicateReportCaseIds = useMemo(() => new Set(candidates.filter((candidate) => candidate.outcome === "pending" || candidate.outcome === "duplicate").flatMap((candidate) => candidate.caseIds)), [candidates]);

  const filtered = useMemo(() => state.cases.filter((item) => {
    const institution = state.institutions.find((entry) => entry.id === item.institutionId);
    if (bureau && item.bureau !== bureau) return false;
    if (region && institution?.region !== region) return false;
    if (status && item.status !== status) return false;
    if (category && item.category !== category) return false;
    if (period === "Last 30 days" && item.receivedAt < daysAgo(30)) return false;
    if (period === "Last 90 days" && item.receivedAt < daysAgo(90)) return false;
    if (period === "Calendar year 2026" && !item.receivedAt.startsWith("2026")) return false;
    if (reportKey.includes("past expected") && !isOverdue(item)) return false;
    if (reportKey.includes("potential and confirmed duplicate") && !duplicateReportCaseIds.has(item.id)) return false;
    if (reportKey.includes("overlap review outcomes") && !overlapCaseIds.has(item.id)) return false;
    return true;
  }), [state.cases, state.institutions, bureau, region, status, category, period, reportKey, duplicateReportCaseIds, overlapCaseIds]);

  const counts = getCounts(filtered);
  const filteredIds = new Set(filtered.map((item) => item.id));
  const relevantCandidates = candidates.filter((candidate) => candidate.caseIds.some((id) => filteredIds.has(id)));
  const trend = reportKey.includes("quarterly")
    ? [1, 2, 3, 4].map((quarter) => {
      const received = filtered.filter((item) => Math.ceil(Number(item.receivedAt.slice(5, 7)) / 3) === quarter).length;
      const disposed = filtered.filter((item) => item.status === "Disposed" && item.lastActionAt && Math.ceil(Number(item.lastActionAt.slice(5, 7)) / 3) === quarter).length;
      return { month: `Q${quarter} 2026`, received, disposed };
    })
    : monthlyTrend(filtered);
  const distribution = statusDistribution(filtered);

  const summaryRows = useMemo<SummaryRow[]>(() => {
    if (reportKey.includes("institution-wise")) {
      const groups = new Map<string, CaseRecord[]>();
      filtered.forEach((item) => groups.set(item.institutionId, [...(groups.get(item.institutionId) ?? []), item]));
      return [...groups.entries()].map(([institutionId, items]) => {
        const institution = state.institutions.find((entry) => entry.id === institutionId);
        const active = items.filter((item) => item.status !== "Disposed").length;
        const teams = new Set(items.map((item) => item.bureau)).size;
        return { label: institution?.name ?? "Institution record", value: items.length, detail: `${active} active · ${teams} Bureaus/Cells · ${institution?.permanentId ?? "ID not recorded"}` };
      }).sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
    }
    if (reportKey.includes("bureau")) {
      return bureauSummary(filtered).map((item) => ({ label: shortBureau(item.bureau), value: item.pending + item.inProcess + item.transferred + item.overdue, detail: `${item.pending} pending · ${item.inProcess} under process · ${item.overdue} overdue` }));
    }
    if (reportKey.includes("region")) {
      return regions.map((item) => {
        const rows = filtered.filter((record) => state.institutions.find((institution) => institution.id === record.institutionId)?.region === item);
        return { label: item, value: rows.length, detail: `${new Set(rows.map((record) => record.institutionId)).size} institutions · ${rows.filter((record) => record.status !== "Disposed").length} active cases` };
      });
    }
    if (reportKey.includes("status")) return distribution.map((item) => ({ label: item.status, value: item.count, detail: "Cases in the filtered set" }));
    if (reportKey.includes("potential and confirmed duplicate")) {
      return [
        { label: "Potential overlap · pending review", value: relevantCandidates.filter((item) => item.outcome === "pending").length, detail: "Candidate groups · human review required" },
        { label: "Confirmed duplicate", value: relevantCandidates.filter((item) => item.outcome === "duplicate").length, detail: "Only after human verification" },
      ];
    }
    if (reportKey.includes("overlap review outcomes")) {
      return [
        { label: "Pending review", value: relevantCandidates.filter((item) => item.outcome === "pending").length, detail: "Candidate groups awaiting a decision" },
        { label: "Confirmed related", value: relevantCandidates.filter((item) => item.outcome === "related").length, detail: "Separate cases explicitly linked as related" },
        { label: "Reviewed — no conflict", value: relevantCandidates.filter((item) => item.outcome === "no-conflict").length, detail: "Legitimate parallel actions" },
        { label: "Confirmed duplicate", value: relevantCandidates.filter((item) => item.outcome === "duplicate").length, detail: "Human-verified underlying complaint" },
      ];
    }
    if (reportKey.includes("past expected")) {
      const overdue = [...filtered].sort((a, b) => (a.expectedDisposalDate ?? "").localeCompare(b.expectedDisposalDate ?? ""));
      return overdue.length ? overdue.map((item) => {
        const institution = state.institutions.find((entry) => entry.id === item.institutionId);
        const daysOverdue = Math.max(1, Math.floor((Date.now() - Date.parse(`${item.expectedDisposalDate}T00:00:00Z`)) / 86400000));
        return { label: item.id, value: daysOverdue, detail: `${institution?.name ?? "Institution record"} · ${daysOverdue} days past expected ${formatDate(item.expectedDisposalDate)}` };
      }) : [{ label: "No overdue cases", value: 0, detail: "No filtered active record is past its illustrative expected date." }];
    }
    if (reportKey.includes("ageing")) {
      const openCases = filtered.filter((item) => item.status !== "Disposed");
      const groups = [{ label: "0–7 days", min: 0, max: 7 }, { label: "8–14 days", min: 8, max: 14 }, { label: "15–30 days", min: 15, max: 30 }, { label: "31+ days", min: 31, max: Infinity }];
      return groups.map((group) => ({ label: group.label, value: openCases.filter((item) => { const age = caseAgeDays(item); return age >= group.min && age <= group.max; }).length, detail: "Open cases by time since receipt" }));
    }
    if (reportKey.includes("disposal rate")) {
      const rate = counts.total ? Math.round((counts.disposed / counts.total) * 100) : 0;
      return [
        { label: "Disposal rate", value: rate, detail: `${counts.disposed} of ${counts.total} filtered cases disposed` },
        { label: "Disposed", value: counts.disposed, detail: "Cases closed in the filtered set" },
        { label: "Not disposed", value: counts.total - counts.disposed, detail: "Pending or active work" },
      ];
    }
    if (reportKey.includes("disposal")) return [
      { label: "Disposed", value: counts.disposed, detail: "Cases closed in this filtered set" },
      { label: "Not disposed", value: counts.total - counts.disposed, detail: "Pending or active work" },
    ];
    if (reportKey.includes("trend")) return trend.map((item) => ({ label: item.month, value: item.received, detail: `${item.disposed} disposed` }));
    return [
      { label: "Total cases", value: counts.total, detail: "In this filtered set" },
      { label: "Overdue", value: filtered.filter((item) => isOverdue(item)).length, detail: "Past illustrative expected dates" },
      { label: "Potential candidates", value: relevantCandidates.filter((candidate) => candidate.outcome === "pending").length, detail: "Require human review" },
    ];
  }, [reportKey, filtered, state.institutions, regions, distribution, relevantCandidates, counts, trend]);

  const exportCsv = () => {
    const headers = ["Case ID", "Date received", "Institution name", "AICTE Permanent ID", "Region", "State", "Complaint category", "Bureau or Cell", "Assigned officer", "Current status", "Priority", "Last action", "Last action date", "Expected disposal date", "Days since received", "Overdue", "Overlap review outcome"];
    const rows = filtered.map((item) => {
      const institution = state.institutions.find((entry) => entry.id === item.institutionId);
      const candidate = candidates.find((entry) => entry.caseIds.includes(item.id));
      const outcome = !candidate ? "No candidate" : candidate.outcome === "pending" ? "Potential overlap — review required" : candidate.outcome === "duplicate" ? "Confirmed duplicate" : candidate.outcome === "related" ? "Confirmed related" : "Reviewed — no conflict";
      return [item.id, item.receivedAt, institution?.name ?? "Institution record", institution?.permanentId ?? "", institution?.region ?? "", institution?.state ?? "", item.category, item.bureau, item.officer, item.status, item.priority, item.lastAction, item.lastActionAt ?? "", item.expectedDisposalDate ?? "", caseAgeDays(item), isOverdue(item) ? "Yes" : "No", outcome];
    });
    const csv = [headers, ...rows].map((row) => row.map((item) => csvCell(item)).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `aicte-demo-${reportKey.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    toast.success(`Exported ${filtered.length} filtered demo records`);
  };

  const columns: TableColumn<CaseRecord>[] = [
    { key: "id", header: "Case ID", sortable: true, sortValue: (item) => item.id, render: (item) => <Link className="record-link mono" href={`/cases/${item.id}`}>{item.id}</Link> },
    { key: "institution", header: "Institution", sortable: true, sortValue: (item) => state.institutions.find((entry) => entry.id === item.institutionId)?.name, render: (item) => <Link className="institution-cell-link" href={`/institutions/${item.institutionId}`}><strong>{state.institutions.find((entry) => entry.id === item.institutionId)?.name ?? "Institution record"}</strong><small>{state.institutions.find((entry) => entry.id === item.institutionId)?.permanentId ?? "—"}</small></Link> },
    { key: "bureau", header: "Bureau / Cell", sortable: true, sortValue: (item) => item.bureau, render: (item) => <span>{shortBureau(item.bureau)}</span> },
    { key: "status", header: "Status", sortable: true, sortValue: (item) => item.status, render: (item) => <StatusBadge status={item.status} /> },
    { key: "priority", header: "Priority", sortable: true, sortValue: (item) => item.priority, render: (item) => <PriorityBadge priority={item.priority} /> },
    { key: "received", header: "Received", sortable: true, sortValue: (item) => item.receivedAt, render: (item) => <span>{formatDate(item.receivedAt)}</span> },
    { key: "expected", header: "Expected date", sortable: true, sortValue: (item) => item.expectedDisposalDate, render: (item) => <span>{formatDate(item.expectedDisposalDate)}</span> },
  ];
  const clear = () => { setBureau(""); setRegion(""); setStatus(""); setCategory(""); setPeriod("All demonstration data"); };
  const trendTitle = reportKey.includes("quarterly") ? "Quarterly trend" : "Monthly trend";

  return <AppShell title="Reports & Analytics" description="Operational reporting from a coherent set of synthetic complaint and case records." eyebrow="REPORTING" action={<Button onClick={exportCsv} disabled={!filtered.length}><Download size={15} />Export filtered CSV</Button>}>
    <div className="reports-page">
      <div className="demo-banner"><span className="demo-banner-mark">D</span><span><strong>Demonstration reports</strong><small>Every chart, count, and export is generated from fictional local records—not official performance data.</small></span></div>
      <Panel title="Report and filters" description="Exports follow the filters shown here."><div className="filters-grid report-filters"><SelectField label="Report category" value={report} onChange={setReport} options={reports} /><SelectField label="Reporting period" value={period} onChange={setPeriod} options={["All demonstration data", "Last 30 days", "Last 90 days", "Calendar year 2026"]} /><SelectField label="Bureau / Cell" value={bureau} onChange={setBureau} options={bureaus} /><SelectField label="Region" value={region} onChange={setRegion} options={regions} /><SelectField label="Status" value={status} onChange={setStatus} options={["Pending", "Under process", "Transferred", "Escalated", "Disposed"]} /><SelectField label="Complaint category" value={category} onChange={setCategory} options={categories} /><div className="report-filter-reset"><Button variant="outline" size="sm" onClick={clear}>Clear filters</Button></div></div></Panel>
      <div className="reports-kpis"><div><small>Filtered cases</small><strong>{formatNumber(filtered.length)}</strong></div><div><small>Pending</small><strong>{formatNumber(counts.pending)}</strong></div><div><small>Disposed</small><strong>{formatNumber(counts.disposed)}</strong></div><div><small>Past expected dates</small><strong className="text-critical">{formatNumber(filtered.filter((item) => isOverdue(item)).length)}</strong></div><div><small>Potential candidate cases</small><strong>{formatNumber(filtered.filter((item) => candidates.some((candidate) => candidate.caseIds.includes(item.id))).length)}</strong></div></div>
      <div className="reports-grid">
        <Panel title={report} description={`${summaryRows.length} grouped values · filtered synthetic data`} className="report-summary-panel">
          {summaryRows.length ? <><div className={`report-bar-chart ${isInstitutionReport ? "report-institution-chart" : ""}`} role="img" aria-label={`${report}: ${summaryRows.map((row) => `${row.label}: ${row.value}`).join("; ")}`}><ResponsiveContainer width="100%" height="100%"><BarChart data={summaryRows} layout={isInstitutionReport ? "vertical" : "horizontal"} margin={isInstitutionReport ? { left: 4, right: 15, top: 6, bottom: 0 } : { left: -16, right: 12, top: 6, bottom: 0 }} barCategoryGap={isInstitutionReport ? 7 : undefined}><CartesianGrid stroke="var(--chart-grid)" vertical={isInstitutionReport} horizontal={!isInstitutionReport} /><XAxis type={isInstitutionReport ? "number" : "category"} dataKey={isInstitutionReport ? undefined : "label"} tickLine={false} axisLine={false} tick={{ fill: "var(--chart-text)", fontSize: 10 }} allowDecimals={isInstitutionReport ? false : undefined} /><YAxis type={isInstitutionReport ? "category" : "number"} dataKey={isInstitutionReport ? "label" : undefined} width={isInstitutionReport ? 170 : undefined} tickLine={false} axisLine={false} tick={{ fill: "var(--chart-text)", fontSize: 10 }} interval={isInstitutionReport ? 0 : undefined} tickFormatter={isInstitutionReport ? shortInstitution : undefined} allowDecimals={!isInstitutionReport} /><Tooltip formatter={(value, name) => [formatNumber(Number(value)), name]} contentStyle={{ background: "#fff", border: "1px solid #e7e8e4", borderRadius: 8, fontSize: 12 }} /><Bar dataKey="value" name={reportKey.includes("disposal rate") ? "Percent or case count" : "Records"} fill="#347E83" radius={isInstitutionReport ? [0, 4, 4, 0] : [4, 4, 0, 0]} isAnimationActive={false} /></BarChart></ResponsiveContainer></div><div className="report-summary-list">{summaryRows.map((row) => <div key={row.label}><span><i className="legend-dot teal-dot" />{row.label}</span><small>{row.detail}</small><strong>{formatNumber(row.value)}{reportKey.includes("disposal rate") && row.label === "Disposal rate" ? "%" : ""}</strong></div>)}</div></> : <EmptyState title="No report data" detail="Adjust the report period or filters to include demonstration records." />}
        </Panel>
        <Panel title={trendTitle} description={`Received vs. disposed cases across the ${reportKey.includes("quarterly") ? "quarterly" : "monthly"} reporting period.`} className="report-trend-panel"><div className="report-line-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={trend} margin={{ left: -15, right: 8, top: 6, bottom: 0 }}><CartesianGrid stroke="#EEF0ED" vertical={false} /><XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "#7b858b", fontSize: 10 }} /><YAxis tickLine={false} axisLine={false} tick={{ fill: "#7b858b", fontSize: 10 }} allowDecimals={false} /><Tooltip contentStyle={{ background: "#fff", border: "1px solid #e7e8e4", borderRadius: 8, fontSize: 12 }} /><Bar dataKey="received" name="Received" fill="#18384c" radius={[3, 3, 0, 0]} isAnimationActive={false} /><Bar dataKey="disposed" name="Disposed" fill="#4C7962" radius={[3, 3, 0, 0]} isAnimationActive={false} /></BarChart></ResponsiveContainer></div><p className="report-chart-caption">Counts are derived from the current filter subset. No statutory targets are assumed.</p></Panel>
      </div>
      <Panel title="Filtered case records" description={`${filtered.length} records · matching the selected report and filters`} action={<Button variant="outline" size="sm" onClick={exportCsv} disabled={!filtered.length}><Download size={14} />Download CSV</Button>} className="registry-table-panel"><DataTable data={filtered} columns={columns} initialPageSize={12} emptyTitle="No report rows match these filters" emptyDetail="Change the report filters or period to include additional demonstration records." /></Panel>
      <div className="report-footnote"><FileBarChart2 size={15} /><span>Potential candidates and confirmed duplicate outcomes remain distinct. No case is merged based on this report.</span></div>
    </div>
  </AppShell>;
}
