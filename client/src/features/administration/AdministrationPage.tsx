import { useState } from "react";
import { Link } from "wouter";
import { AlertTriangle, CheckCircle2, Database, LockKeyhole, RotateCcw, ShieldCheck, UserRoundCog } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/layout/AppShell";
import { useDemoStore } from "@/contexts/DemoStore";
import { useSimulation } from "@/contexts/SimulationContext";
import { Panel } from "@/features/shared/ui";
import { SimulationControls } from "@/features/shared/SimulationControls";
import { formatNumber } from "@/services/analytics";
import type { Role } from "@/types/domain";
import { toast } from "sonner";

const roles: { role: Role; view: boolean; manage: boolean; transfer: boolean; overlap: boolean; reports: boolean; access: boolean }[] = [
  { role: "Senior Management", view: true, manage: false, transfer: false, overlap: true, reports: true, access: false },
  { role: "RB Officer", view: true, manage: true, transfer: true, overlap: true, reports: true, access: false },
  { role: "PGRC Officer", view: true, manage: true, transfer: true, overlap: true, reports: true, access: false },
  { role: "Regional Office Officer", view: true, manage: true, transfer: true, overlap: true, reports: true, access: false },
  { role: "Administrator", view: true, manage: true, transfer: true, overlap: true, reports: true, access: true },
];
const permissionLabels = ["View records", "Manage assigned cases", "Transfer or escalate", "Review overlaps", "View reports", "Manage user access"];
const permissionValues = (row: (typeof roles)[number]) => [row.view, row.manage, row.transfer, row.overlap, row.reports, row.access];

export function AdministrationPage() {
  const { state, dispatch } = useDemoStore();
  const { resetSimulation } = useSimulation();
  const [resetOpen, setResetOpen] = useState(false);
  const current = roles.find((item) => item.role === state.role)!;
  const confirmReset = () => {
    resetSimulation();
    setResetOpen(false);
    toast.success("Synthetic seed records restored");
  };
  return <AppShell title="Administration" description="Prototype configuration, demo role presentation, and local data controls." eyebrow="WORKSPACE ADMINISTRATION">
    <div className="admin-page"><div className="demo-banner"><span className="demo-banner-mark">D</span><span><strong>Role views are for demonstration only</strong><small>Changing the demo role changes available presentation and action controls—not a real security boundary.</small></span></div>
      <div className="admin-grid"><Panel title="Current demo role" description="Select the user view used for this browser session." className="admin-role-panel"><div className="current-role-card"><div className="current-role-icon"><UserRoundCog size={21} /></div><div><small>ACTIVE DEMO ROLE</small><strong>{state.role}</strong><span>Role choice is stored locally with the synthetic workspace state.</span></div></div><label className="filter-field role-select-field"><span>Change demo role</span><select value={state.role} onChange={(event) => dispatch({ type: "set-role", role: event.target.value as Role })}>{roles.map((item) => <option key={item.role}>{item.role}</option>)}</select></label><div className="role-capability-summary"><span><CheckCircle2 size={14} />{current.view ? "Can view institution and case records" : "View access unavailable"}</span><span><CheckCircle2 size={14} />{current.reports ? "Can view demonstration reports" : "Reports unavailable"}</span><span><CheckCircle2 size={14} />{current.overlap ? "Can review coordination candidates" : "Review unavailable"}</span></div></Panel>
        <Panel title="Permission model" description="Illustrative UI capabilities; not enforced server-side." className="permission-matrix-panel"><div className="permission-matrix-wrap"><table className="permission-matrix"><thead><tr><th>Demo role</th>{permissionLabels.map((label) => <th key={label}>{label}</th>)}</tr></thead><tbody>{roles.map((role) => <tr key={role.role}><th scope="row">{role.role}</th>{permissionValues(role).map((enabled, index) => <td key={`${role.role}-${index}`}><span className={`permission-mark ${enabled ? "allowed" : "not-allowed"}`} aria-label={enabled ? "Demonstration capability enabled" : "Demonstration capability not enabled"}>{enabled ? "✓" : "—"}</span></td>)}</tr>)}</tbody></table></div><div className="permission-note admin-permission-note"><LockKeyhole size={15} /><span>This matrix controls only demo presentation. Production roles and every write action must be enforced on an authenticated server before real records are introduced.</span></div></Panel></div>
      <div className="admin-grid admin-info-grid"><Panel title="Data and persistence" description="This prototype uses synthetic local state only."><div className="admin-fact-list"><div><span className="admin-fact-icon"><Database size={16} /></span><span><strong>Source</strong><small>Fictional seed data, derived in the browser</small></span><em>DEMO</em></div><div><span className="admin-fact-icon"><CheckCircle2 size={16} /></span><span><strong>Persistence</strong><small>LocalStorage on this device/browser</small></span><em>LOCAL</em></div><div><span className="admin-fact-icon"><LockKeyhole size={16} /></span><span><strong>Live service connection</strong><small>No AICTE API, authentication service, or database</small></span><em>NONE</em></div><div><span className="admin-fact-icon"><AlertTriangle size={16} /></span><span><strong>Record count</strong><small>{formatNumber(state.institutions.length)} institutions · {formatNumber(state.cases.length)} cases</small></span><em>SYNTHETIC</em></div></div><SimulationControls compact /></Panel>
        <Panel title="Reset demonstration workspace" description="Restore the original seed records and clear local changes."><div className="reset-card"><span className="reset-symbol"><RotateCcw size={18} /></span><div><strong>Restore initial demo state</strong><p>Resets case status changes, transfers, assignments, notes, overlap outcomes, role selection, and notification read state in this browser.</p><Button variant="outline" className="reset-button" onClick={() => setResetOpen(true)}><RotateCcw size={14} />Reset demo data</Button></div></div></Panel></div>
      <Panel title="Production readiness boundary" description="The prototype is not suitable for official case handling or confidential information."><div className="production-boundary"><span className="boundary-icon"><ShieldCheck size={17} /></span><div><strong>Before production use</strong><p>Implement authenticated backend sessions; server-side authorization for every role and action; institution-approved source systems; durable audit history; privacy, security, and retention review; secure supporting-document storage; and formally approved service-level rules. Replace the local demo data service only after those controls are defined and verified.</p><Link href="/overview" className="table-open-link">Return to overview</Link></div></div></Panel>
      <p className="demo-note">No real user access, official AICTE records, external API credentials, or confidential attachments are present in this demo.</p>
    </div>
    <AlertDialog open={resetOpen} onOpenChange={setResetOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Reset all demonstration changes?</AlertDialogTitle><AlertDialogDescription>All local case actions, notes, assignments, review decisions, selected role, and notification read states will be replaced with the initial synthetic seed data. This does not affect an official system.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmReset}>Restore demo data</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </AppShell>;
}
