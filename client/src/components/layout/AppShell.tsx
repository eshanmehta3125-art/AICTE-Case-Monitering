import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Activity, Bell, BookOpenCheck, Building2, ChartNoAxesColumnIncreasing, ChevronDown, ClipboardList, Command, FileBarChart2, LayoutDashboard, Menu, PanelLeftClose, PanelLeftOpen, Presentation, Search, Settings2, ShieldAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ThemeSwitcher } from "@/components/layout/ThemeSwitcher";
import { GuidedTourOverlay } from "@/components/presentation/GuidedTourOverlay";
import { useDemoStore } from "@/contexts/DemoStore";
import { useSimulation } from "@/contexts/SimulationContext";
import { getAlerts } from "@/services/analytics";
import type { Role } from "@/types/domain";
import { PageHeading } from "@/features/shared/ui";

const navigation = [
  { label: "Overview", href: "/overview", icon: LayoutDashboard },
  { label: "Institution Registry", href: "/institutions", icon: Building2 },
  { label: "Complaint & Case Registry", href: "/cases", icon: ClipboardList },
  { label: "Overlap Review", href: "/overlaps", icon: Activity },
  { label: "Bureau Workload", href: "/workload", icon: ChartNoAxesColumnIncreasing },
  { label: "Reports & Analytics", href: "/reports", icon: FileBarChart2 },
  { label: "Alerts & Notifications", href: "/alerts", icon: ShieldAlert },
  { label: "Guide Mode", href: "/guide", icon: BookOpenCheck },
  { label: "Judge Mode", href: "/judge", icon: Presentation },
  { label: "Administration", href: "/administration", icon: Settings2 },
];
const roles: Role[] = ["Senior Management", "RB Officer", "PGRC Officer", "Regional Office Officer", "Administrator"];

function SidebarContent({ location, collapsed, mobile = false, unread, onClose, onToggleCollapse }: {
  location: string;
  collapsed: boolean;
  mobile?: boolean;
  unread: number;
  onClose?: () => void;
  onToggleCollapse?: () => void;
}) {
  return <>
    <div className="sidebar-brand">
      <Link href="/overview" className="brand-link" aria-label="AICTE Integrated Case Monitoring overview" onClick={onClose}>
        <span className="brand-symbol" aria-hidden="true"><img src="/case-mark.svg" alt="" /></span>
        {(!collapsed || mobile) && <span className="brand-copy"><strong>AICTE <span>|</span> CASE MONITORING</strong><small>Institution Grievance &amp; Regulatory Coordination System</small></span>}
      </Link>
      {mobile && <Button variant="ghost" size="icon" className="mobile-close" aria-label="Close navigation" onClick={onClose}><X size={18} /></Button>}
    </div>
    <div className="demo-ribbon" aria-label="Demonstration data"><span className="demo-dot" aria-hidden="true" />{(!collapsed || mobile) && <><span>DEMO INSTANCE</span><span className="ribbon-divider">·</span><span>synthetic data</span></>}</div>
    <nav className="side-nav" aria-label="Main navigation">
      {navigation.map((item) => {
        const active = location === item.href || (item.href !== "/overview" && location.startsWith(item.href));
        return <Link key={item.href} href={item.href} onClick={onClose} className={`nav-item ${active ? "active" : ""}`} aria-current={active ? "page" : undefined} aria-label={collapsed && !mobile ? item.label : undefined} title={collapsed && !mobile ? item.label : undefined}>
          {active && <motion.span layoutId={mobile ? "mobile-active-nav-pill" : "active-nav-pill"} className="nav-active-pill" aria-hidden="true" transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }} />}
          <item.icon size={17} strokeWidth={1.8} aria-hidden="true" /><span className="nav-item-label">{item.label}</span>
          {item.href === "/alerts" && unread > 0 && <span className="nav-count">{unread > 99 ? "99+" : unread}</span>}
        </Link>;
      })}
    </nav>
    <div className="sidebar-bottom">
      {!collapsed || mobile ? <><div className="sidebar-help"><BookOpenCheck size={16} /><span>Prototype workspace</span></div><div className="sidebar-disclaimer">Not connected to live AICTE systems</div></> : <span className="sr-only">Prototype workspace; not connected to live AICTE systems</span>}
      {!mobile && <Button variant="ghost" size={collapsed ? "icon" : "sm"} className="collapse-toggle" onClick={onToggleCollapse} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>{collapsed ? <PanelLeftOpen size={16} /> : <><PanelLeftClose size={16} /> Collapse</>}</Button>}
    </div>
  </>;
}

export function AppShell({ title, description, eyebrow, action, children }: { title: string; description?: string; eyebrow?: string; action?: ReactNode; children: ReactNode }) {
  const { state, dispatch } = useDemoStore();
  const { paused, resetSimulation } = useSimulation();
  const [location, navigate] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        document.querySelector<HTMLInputElement>(".global-search input")?.focus();
        setSearchOpen(true);
      } else if (event.key === "Escape") {
        setSearchOpen(false);
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  const alerts = getAlerts(state);
  const unread = alerts.filter((item) => !item.read).length;
  const matches = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    const institutions = state.institutions.filter((item) => `${item.name} ${item.permanentId}`.toLowerCase().includes(q)).slice(0, 3).map((item) => ({ type: "Institution", title: item.name, sub: item.permanentId, href: `/institutions/${item.id}` }));
    const cases = state.cases.filter((item) => {
      const institution = state.institutions.find((record) => record.id === item.institutionId);
      return `${item.id} ${item.category} ${item.bureau} ${item.officer} ${item.status} ${item.lastAction} ${institution?.name ?? ""}`.toLowerCase().includes(q);
    }).slice(0, 4).map((item) => ({ type: "Case", title: item.id, sub: `${item.category} · ${state.institutions.find((record) => record.id === item.institutionId)?.name ?? "Institution"}`, href: `/cases/${item.id}` }));
    return [...institutions, ...cases].slice(0, 6);
  }, [search, state.cases, state.institutions]);

  const routePath = location.split(/[?#]/)[0] || "/overview";
  const activeItem = navigation.find((item) => routePath === item.href || (item.href !== "/overview" && routePath.startsWith(item.href)));
  const selectedTitle = title || activeItem?.label || "Overview";

  return <div className={`app-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
    <aside className="sidebar"><SidebarContent location={routePath} collapsed={collapsed} unread={unread} onToggleCollapse={() => setCollapsed((value) => !value)} /></aside>
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
      <SheetContent side="left" className="mobile-navigation-sheet" aria-label="Main navigation">
        <SheetTitle className="sr-only">AICTE case monitoring navigation</SheetTitle>
        <SidebarContent location={routePath} collapsed={false} mobile unread={unread} onClose={() => setMobileOpen(false)} />
      </SheetContent>
    </Sheet>
    <div className="app-main">
      <header className="topbar">
        <div className="topbar-left">
          <Button variant="ghost" size="icon" className="mobile-menu-button" aria-label="Open navigation" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)}><Menu size={18} /></Button>
          <div className="breadcrumbs" aria-label="Breadcrumb"><span>Case monitoring</span><span className="crumb-slash" aria-hidden="true">/</span><strong>{selectedTitle}</strong></div>
        </div>
        <div className="topbar-right">
          <div className={`topbar-status ${paused ? "paused" : "running"}`} aria-label={`${paused ? "Simulation paused" : "Live demo simulation running"}. Synthetic data only.`} title={`${paused ? "Paused" : "Running"} · Synthetic data only`}>
            <span className={`demo-status-pip ${paused ? "paused" : "running"}`} aria-hidden="true" />
            <span className="topbar-status-copy"><strong>{paused ? "PAUSED" : "LIVE DEMO"}</strong><small>SIMULATED DATA</small></span>
          </div>
          <div className="global-search-wrap">
            <div className="global-search"><Search size={15} aria-hidden="true" /><input value={search} onFocus={() => setSearchOpen(true)} onChange={(event) => { setSearch(event.target.value); setSearchOpen(true); }} onKeyDown={(event) => { if (event.key === "Enter" && search.trim()) { navigate(`/cases?search=${encodeURIComponent(search.trim())}`); setSearchOpen(false); } if (event.key === "Escape") setSearchOpen(false); }} placeholder="Search cases or institutions" aria-label="Search cases and institutions" /><kbd>⌘ K</kbd></div>
            {searchOpen && search.trim() && <><button className="search-dismiss" aria-label="Close search results" onClick={() => setSearchOpen(false)} /><div className="search-results" role="listbox" aria-label="Search results">{matches.length ? matches.map((result) => <Link key={`${result.type}-${result.href}`} href={result.href} onClick={() => { setSearchOpen(false); setSearch(""); }} className="search-result" role="option"><span className="result-icon">{result.type === "Case" ? <ClipboardList size={15} /> : <Building2 size={15} />}</span><span className="result-copy"><strong>{result.title}</strong><small>{result.sub}</small></span><span className="result-type">{result.type}</span></Link>) : <div className="search-empty" role="status">No matching cases or institutions</div>}</div></>}
          </div>
          <ThemeSwitcher />
          <Button variant="ghost" size="icon" className="notification-button" aria-label={`${unread} unread notifications`} onClick={() => navigate("/alerts")}><Bell size={17} aria-hidden="true" />{unread > 0 && <span className="notification-dot">{unread > 9 ? "9+" : unread}</span>}</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" className="profile-trigger"><span className="avatar-initials" aria-hidden="true">{state.role.split(" ").map((word) => word[0]).slice(0, 2).join("")}</span><span className="profile-text"><strong>Demo User</strong><small>{state.role}</small></span><ChevronDown size={14} aria-hidden="true" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="profile-menu"><DropdownMenuLabel>Demo role view</DropdownMenuLabel><DropdownMenuSeparator />{roles.map((role) => <DropdownMenuItem key={role} onSelect={() => dispatch({ type: "set-role", role })}>{role}{state.role === role && <span className="menu-check">Selected</span>}</DropdownMenuItem>)}<DropdownMenuSeparator /><DropdownMenuItem onSelect={() => navigate("/administration")}>Administration</DropdownMenuItem><DropdownMenuItem className="text-destructive" onSelect={() => { if (window.confirm("Reset all local demo changes and restore the synthetic seed records?")) { resetSimulation(); navigate("/overview"); } }}>Reset demo data</DropdownMenuItem></DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main className="main-content"><motion.div className="content-inner" key={location} initial={{ opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}><PageHeading eyebrow={eyebrow ?? "DEMONSTRATION WORKSPACE"} title={selectedTitle} description={description} action={action} />{children}</motion.div><footer className="workspace-footer"><span>Demonstration data · Not a live AICTE system</span><span><Command size={12} aria-hidden="true" /> Prototype build · Updated locally</span></footer></main>
    </div>
    <GuidedTourOverlay />
  </div>;
}
