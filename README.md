# AICTE | Integrated Case Monitoring — Demonstration Prototype

A navigable, responsive administrative dashboard concept for institution-related complaints and regulatory cases. It brings synthetic records from RB, PGRC, Regional Offices, and an illustrative Academic Affairs Cell into one institution-centered view, with a human-reviewed cross-bureau coordination queue.

> **Prototype notice:** This is not an official AICTE application. All institutions, identifiers, officers, complaints, dates, reports, and attachments are fictional sample data. No AICTE system, live data feed, authenticated backend, semantic AI matching service, institutional email, or official submission channel is connected. Expected disposal dates are illustrative and are not statutory deadlines or service-level targets.

## Run locally

The project uses React 19, TypeScript, Vite, Tailwind CSS, Wouter, Lucide, Recharts, Radix UI primitives, and Sonner. Dependencies are pinned by `pnpm-lock.yaml` and `package.json`.

```bash
pnpm install --frozen-lockfile
pnpm dev:static
```

The static development server listens on the configured `PORT` (3000 by default). To check types and run existing tests/build:

```bash
pnpm check
pnpm test
pnpm build:static
```

## Demo features

- Demo-mode entry with a selectable presentation role; there is no real sign-in or credential collection.
- Overview dashboard with linked status metrics, coordination queue, workload, status/ageing charts, recent activity, and deadline watch.
- Institution registry with combined search/filters and an Institution 360° profile consolidating the associated cases, teams, timeline, links, and sample attachments.
- Complaint & Case Registry with combined text/date filters, sorting, pagination, and individual case histories.
- Case demo actions for status updates, assignment/reassignment, transfer, escalation, notes, explicit related-case linking, and coordination decisions. Transfers/escalations require confirmation.
- Overlap Review Centre compares records side by side and shows deterministic match reasons. It distinguishes related records, potential overlaps, confirmed duplicates (only after a human action), and reviewed-no-conflict outcomes. A match never automatically merges complaints or changes official case statuses.
- Bureau Workload, operational reports, filtered CSV exports, and a notification centre with record links and read state.
- Administration view for demo roles, presentational capability matrix, local-data status, and reset-to-seed action.
- SIH Guide Mode and Judge Mode provide a route-aware six-step walkthrough and a timed presentation brief that explicitly separates the local synthetic prototype from a proposed, unconnected production path.
- Root-owned simulated event engine with Pause/Resume, Fast/Normal/Slow interval, Trigger sample event, and Reset controls. Simulated intake, assignment, status/action, inter-Bureau transfer, deadline, coordination, escalation, disposal, and ninth-step possible-overlap detection update canonical case history; an overlap candidate produces one human-review notification, without duplicate notices, merging records, or changing status. Charts, live activity and alerts derive from the same local records; event history and generated-case growth are bounded.
- Dark-first black/orange appearance with persistent Dark, Light and System choices. The theme menu updates all app routes; the System choice follows the device appearance. Route-loading fallbacks inherit the resolved palette, preventing a white flash in dark mode. The topbar separates “LIVE DEMO” and “SIMULATED DATA”; its small orange light pulses only while the simulation runs. Institution-to-case arrows use restrained breathing motion, with static reduced-motion behavior.
- A live-activity feed drawn from the same recorded action history as the case detail. Generated alerts link to the relevant synthetic case and remain read-state aware. Automatic simulated records do not continuously interrupt screen readers; the live status region announces only direct user-controlled demo actions.

## Sample data and persistence

The seed dataset contains 18 fictional institutions and 38 synthetic case records. Several records share an institution identity and span teams; one possible name variation has distinct Permanent IDs and is explicitly treated as uncertain. Seed records include recent, past-due, approaching, missing-date, disposed, transferred, and escalated examples. Dashboard totals, profiles, tables, alerts, reports, and workload summaries are derived from the same local case list.

Updates are saved in browser `localStorage` for the current browser/device. Use **Administration → Reset demo data** (or the profile menu) to restore the original seed. Clearing browser site data also clears demo changes. Local storage is not a secure audit log or appropriate production persistence.

The simulation starts automatically in Demo mode. Pause it before completing slower manual case-review steps if a stable workspace is useful. Reset restores the seed and demo state. The simulated event service uses one root-level timer, deterministic sequence-based operations, stable IDs, a short bounded history, and at most five generated `SIM-` records.

## Architecture

- `client/src/types/domain.ts` — shared TypeScript data models.
- `client/src/data/seed.ts` — synthetic seed institutions/cases and initial human-review outcomes.
- `client/src/contexts/DemoStore.tsx` — local demo state, reducer actions, and persistence.
- `client/src/contexts/SimulationContext.tsx` — shared pauseable root timer, event interval, manual trigger and reset integration.
- `client/src/services/simulation.ts` — deterministic demo-event application to the canonical fictional records.
- `client/src/services/simulation.test.ts` — focused regression coverage for event and alert consistency.
- `client/src/services/analytics.ts` — overlap matching, metrics, workload, alerts, trends, and formatting.
- `client/src/components/layout/` — responsive navigation shell and global search.
- `client/src/components/presentation/` — shared tour steps and persistent route-aware guide overlay.
- `client/src/components/layout/ThemeSwitcher.tsx` — accessible Dark/Light/System menu.
- `client/src/dashboard-theme.css` — dark-first and warm-neutral light token systems, selected glass surfaces, and reduced-motion-safe transition styling.
- `client/src/features/` — dashboard, institution/case registries, overlap review, workload, reports, notifications, administration, demo entry, Guide Mode and Judge Mode.
- `client/src/components/ui/` — existing accessible Radix-based UI primitives.

## Production next steps

Before using real records, replace the browser-only demo data service with an approved authenticated backend, implement server-side role and record-level authorization, define institution identity and approved source-of-truth rules, add an auditable and retention-governed action log, review privacy/security requirements, introduce secure document storage, and formally configure service-level rules. Connect only through approved AICTE systems and never expose credentials to client code. The prototype's fuzzy institution-name candidate is deterministic and advisory; an AI integration is not present.


## Design reference

The user-supplied reference, [Emil Kowalski's design-engineering skills](https://github.com/emilkowalski/skills), informed the interaction and edge-case review. The dashboard keeps high-frequency filtering and chart reading immediate, uses restrained dialog/menu/toast feedback with reduced-motion support, and checks realistic empty, long-name, and missing-date states. The project keeps its already-installed accessible Radix primitives rather than adding a second component library.

Component/API decisions, actual interactive-doc findings, library versions, licensing, accessibility constraints and integration choices are recorded in [`docs/design-reference-implementation.md`](docs/design-reference-implementation.md) and [`docs/extra-component-exploration.md`](docs/extra-component-exploration.md). The implementation uses the existing Motion/Framer Motion-compatible stack, Recharts, Radix and Lucide. A small Motion-based NumberTicker adaptation and activity-list transitions were retained; their applicable Magic UI MIT notice is in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md). Aceternity copyable source was not imported where its component-specific license or runtime dependencies could not be verified; the case timeline uses a locally authored Motion scroll-progress trace instead. Selected project source patterns do not imply any live AICTE integration.

## Verification

The upgrade was checked with `pnpm check`, `pnpm test`, and `pnpm build:static`. The Vitest suite includes deterministic simulation, bounded growth, valid institution linking, shared counts, and stable read-aware alerts for synthetic intake, coordination, and disposal actions.
