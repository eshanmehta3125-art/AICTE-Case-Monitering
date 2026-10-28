import { lazy, Suspense } from "react";
import { MotionConfig } from "framer-motion";
import { Route, Switch, useLocation } from "wouter";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { DemoStoreProvider, useDemoStore } from "./contexts/DemoStore";
import { SimulationProvider } from "./contexts/SimulationContext";

const OverviewPage = lazy(() => import("./features/dashboard/OverviewPage").then((module) => ({ default: module.OverviewPage })));
const InstitutionRegistryPage = lazy(() => import("./features/institutions/InstitutionPages").then((module) => ({ default: module.InstitutionRegistryPage })));
const InstitutionProfilePage = lazy(() => import("./features/institutions/InstitutionPages").then((module) => ({ default: module.InstitutionProfilePage })));
const CaseRegistryPage = lazy(() => import("./features/cases/CasePages").then((module) => ({ default: module.CaseRegistryPage })));
const CaseDetailPage = lazy(() => import("./features/cases/CasePages").then((module) => ({ default: module.CaseDetailPage })));
const OverlapReviewPage = lazy(() => import("./features/overlaps/OverlapReviewPage").then((module) => ({ default: module.OverlapReviewPage })));
const WorkloadPage = lazy(() => import("./features/workload/WorkloadPage").then((module) => ({ default: module.WorkloadPage })));
const ReportsPage = lazy(() => import("./features/reports/ReportsPage").then((module) => ({ default: module.ReportsPage })));
const NotificationsPage = lazy(() => import("./features/notifications/NotificationsPage").then((module) => ({ default: module.NotificationsPage })));
const AdministrationPage = lazy(() => import("./features/administration/AdministrationPage").then((module) => ({ default: module.AdministrationPage })));
const GuideModePage = lazy(() => import("./features/presentation/GuideModePage").then((module) => ({ default: module.GuideModePage })));
const JudgeModePage = lazy(() => import("./features/presentation/JudgeModePage").then((module) => ({ default: module.JudgeModePage })));
const DemoEntryPage = lazy(() => import("./features/demo/DemoEntryPage").then((module) => ({ default: module.DemoEntryPage })));
const NotFound = lazy(() => import("./pages/NotFound"));

function AppRoutes() {
  const { state } = useDemoStore();
  const [, navigate] = useLocation();
  if (!state.enteredDemo) return <Suspense fallback={<div className="app-loading" role="status" aria-live="polite">Loading demonstration workspace…</div>}><DemoEntryPage onEnter={() => navigate("/overview")} /></Suspense>;
  return <Suspense fallback={<div className="app-loading" role="status" aria-live="polite"><span className="loading-indicator" />Loading demonstration workspace…</div>}>
    <Switch>
      <Route path="/" component={OverviewPage} />
      <Route path="/overview" component={OverviewPage} />
      <Route path="/institutions" component={InstitutionRegistryPage} />
      <Route path="/institutions/:institutionId">{(params) => <InstitutionProfilePage institutionId={params.institutionId} />}</Route>
      <Route path="/cases" component={CaseRegistryPage} />
      <Route path="/cases/:caseId">{(params) => <CaseDetailPage caseId={params.caseId} />}</Route>
      <Route path="/overlaps" component={OverlapReviewPage} />
      <Route path="/workload" component={WorkloadPage} />
      <Route path="/reports" component={ReportsPage} />
      <Route path="/alerts" component={NotificationsPage} />
      <Route path="/administration" component={AdministrationPage} />
      <Route path="/guide" component={GuideModePage} />
      <Route path="/judge" component={JudgeModePage} />
      <Route component={NotFound} />
    </Switch>
  </Suspense>;
}

function Application() {
  return <ErrorBoundary><ThemeProvider defaultTheme="dark" switchable><TooltipProvider><Toaster position="bottom-right" closeButton richColors /><DemoStoreProvider><SimulationProvider><MotionConfig reducedMotion="user"><AppRoutes /></MotionConfig></SimulationProvider></DemoStoreProvider></TooltipProvider></ThemeProvider></ErrorBoundary>;
}

export default Application;
