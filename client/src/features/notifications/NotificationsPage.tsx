import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight, Bell, CheckCheck, Clock3, ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { DataTable, EmptyState, Panel, SelectField, type TableColumn } from "@/features/shared/ui";
import { useDemoStore } from "@/contexts/DemoStore";
import { formatDate, getAlerts } from "@/services/analytics";
import type { DemoAlert } from "@/types/domain";
import { toast } from "sonner";

export function NotificationsPage() {
  const { state, dispatch } = useDemoStore();
  const [, navigate] = useLocation();
  const [type, setType] = useState("");
  const [view, setView] = useState("");
  const allAlerts = useMemo(() => getAlerts(state), [state]);
  const types = [...new Set(allAlerts.map((item) => item.kind))];
  const filtered = allAlerts.filter((item) => (!type || item.kind === type) && (!view || (view === "Unread" ? !item.read : item.read)));
  const unread = allAlerts.filter((item) => !item.read).length;
  const markAllRead = () => { allAlerts.filter((item) => !item.read).forEach((item) => dispatch({ type: "mark-read", alertId: item.id })); toast.success("All visible demo alerts marked as read"); };
  const markAndOpen = (item: DemoAlert) => {
    dispatch({ type: "mark-read", alertId: item.id });
    if (item.caseId) navigate(`/cases/${item.caseId}`);
    else if (item.institutionId) navigate(`/institutions/${item.institutionId}`);
    else navigate("/overlaps");
  };
  const columns: TableColumn<DemoAlert>[] = [
    { key: "read", header: "", render: (item) => <span className={`read-marker ${item.read ? "read" : "unread"}`} aria-label={item.read ? "Read" : "Unread"} /> },
    { key: "kind", header: "Alert", sortable: true, sortValue: (item) => item.kind, render: (item) => <div className="alert-kind-cell"><span className={`alert-kind-icon ${item.critical ? "critical" : ""}`}>{item.critical ? <ShieldAlert size={15} /> : item.kind.includes("date") ? <Clock3 size={15} /> : <Bell size={15} />}</span><span><strong>{item.title}</strong><small>{item.kind}</small></span></div> },
    { key: "reason", header: "Reason", sortable: true, sortValue: (item) => item.reason, render: (item) => <span className="alert-reason">{item.reason}</span> },
    { key: "date", header: "Date", sortable: true, sortValue: (item) => item.date, render: (item) => <span className="date-cell">{formatDate(item.date)}</span> },
    { key: "record", header: "Record", render: (item) => item.caseId ? <Link className="record-link mono" href={`/cases/${item.caseId}`}>{item.caseId}</Link> : item.institutionId ? <Link className="record-link" href={`/institutions/${item.institutionId}`}>Institution record</Link> : <span className="quiet-dash">—</span> },
    { key: "action", header: "", render: (item) => <Button variant="ghost" size="sm" onClick={() => markAndOpen(item)}>{item.read ? "Open" : "Mark read & open"}<ArrowRight size={13} /></Button> },
  ];
  const approaching = allAlerts.filter((item) => item.kind === "Approaching due date").length;
  const overdue = allAlerts.filter((item) => item.kind === "Overdue").length;
  const overlaps = allAlerts.filter((item) => item.kind === "Potential overlap").length;
  return <AppShell title="Alerts & Notifications" description="Cases and coordination items that may need an operational follow-up." eyebrow="ATTENTION CENTRE" action={<Button variant="outline" disabled={!unread} onClick={markAllRead}><CheckCheck size={15} />Mark all read</Button>}>
    <div className="alerts-page"><div className="demo-banner"><span className="demo-banner-mark">D</span><span><strong>Computed from demo records</strong><small>Alerts are derived from illustrative dates, activity, local case state, and review outcomes.</small></span></div>
      <div className="alert-summary"><div className="alert-summary-main"><span className="alert-summary-icon"><Bell size={18} /></span><div><small>UNREAD ALERTS</small><strong>{unread}</strong><span>of {allAlerts.length} demo notifications</span></div></div><div><small>Approaching dates</small><strong>{approaching}</strong></div><div className="alert-summary-critical"><small>Overdue</small><strong>{overdue}</strong></div><div><small>Overlap review</small><strong>{overlaps}</strong></div></div>
      <Panel title="Notification filters" description="Open an alert to mark it read and navigate to the relevant record." className="filter-panel"><div className="filters-grid alert-filters"><SelectField label="Alert type" value={type} onChange={setType} options={types} /><SelectField label="Read status" value={view} onChange={setView} options={["Unread", "Read"]} /><Button variant="ghost" size="sm" onClick={() => { setType(""); setView(""); }}>Clear filters</Button></div></Panel>
      <Panel title="Alerts" description="Each notification identifies its reason, date, and affected record." className="registry-table-panel">{filtered.length ? <DataTable data={filtered} columns={columns} initialPageSize={12} emptyTitle="No alerts match these filters" emptyDetail="Try selecting another alert type or read status." /> : <EmptyState title="You’re all caught up" detail="No demo notifications match the current view. Alerts appear when sample records approach dates, remain inactive, or need overlap review." action={<Button variant="outline" onClick={() => { setType(""); setView(""); }}>Show all alerts</Button>} />}</Panel>
      <p className="demo-note">These notices are local demonstration cues only. They do not send an email, text message, or official AICTE notification.</p>
    </div>
  </AppShell>;
}
