export interface GuideStep {
  title: string;
  path: string;
  query?: string;
  focus: string;
  description: string;
}

export const guideSteps: GuideStep[] = [
  {
    title: "Overview · operating picture",
    path: "/overview",
    focus: "Look at the linked status totals, priority queue, recent activity and deadline watch.",
    description: "Start with the shared view of synthetic case pressure. Every total is derived from the same local case records.",
  },
  {
    title: "Institution 360° · consolidated history",
    path: "/institutions/inst-10024",
    focus: "Follow the institution profile into its associated Bureau and Cell records.",
    description: "One fictional institution profile groups its identity, records and history without treating separate cases as duplicates.",
  },
  {
    title: "Case history · accountable actions",
    path: "/cases/PGRC-2026-0142",
    focus: "Read the case-specific action timeline, team assignment and current synthetic status.",
    description: "A case detail shows its own sequence of actions. Demo updates are local and are not submitted to an official system.",
  },
  {
    title: "Overlap Review · human coordination",
    path: "/overlaps",
    query: "candidate=institution:inst-10024",
    focus: "Inspect the institution-to-case relationships and the explicit review choices.",
    description: "A shared institution identity is a prompt for human review. Related cases stay separate; possible overlap never auto-merges records.",
  },
  {
    title: "Bureau Workload · operational distribution",
    path: "/workload",
    focus: "Compare pending, in-process, overdue and coordination-dependent demo records by team.",
    description: "The workload page uses illustrative expected dates only; it does not claim statutory deadlines or official performance targets.",
  },
  {
    title: "Reports · filtered evidence",
    path: "/reports",
    focus: "Review a filtered report and the downloadable synthetic CSV.",
    description: "Reports are derived from the current demo subset. Exported values remain synthetic and are not an official filing.",
  },
];

export function guideStepHref(index: number): string {
  const safeIndex = Math.min(Math.max(index, 0), guideSteps.length - 1);
  const step = guideSteps[safeIndex];
  const query = new URLSearchParams(step.query ?? "");
  query.set("guided", "1");
  query.set("step", String(safeIndex));
  return `${step.path}?${query.toString()}`;
}
