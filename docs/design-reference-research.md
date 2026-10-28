# Design and motion research index

**Research completed:** 2026-10-27 for the existing AICTE Integrated Case Monitoring React/TypeScript application. The official documentation and interactive examples were inspected source by source; search-result snippets were used only for discovery, never as evidence of APIs or licensing. See the detailed decisions linked below.

## Core documentation inspected

- [Motion for React](https://motion.dev/docs/react), [layout animations](https://motion.dev/docs/react-layout-animations), [scroll progress (`useScroll`)](https://motion.dev/docs/react-use-scroll), [accessibility](https://motion.dev/docs/react-accessibility), [installation](https://motion.dev/docs/react-installation), and [shared-layout example](https://examples.motion.dev/react/shared-layout-animation).
- [Aceternity UI Liquid Glass](https://ui.aceternity.com/components/liquid-glass), its [live demo](https://ui.aceternity.com/live-preview/liquid-glass-demo), and the vendor [licensing page](https://ui.aceternity.com/licence); [Tracing Beam docs/demo](https://ui.aceternity.com/components/tracing-beam).
- [Magic UI Number Ticker](https://magicui.design/docs/components/number-ticker), [Animated List](https://magicui.design/docs/components/animated-list), and [Animated Theme Toggler](https://magicui.design/docs/components/animated-theme-toggler), including relevant official source/registry material and the [Magic UI MIT license](https://github.com/magicuidesign/magicui/blob/main/LICENSE.md).
- [React Bits interactive component catalog](https://reactbits.dev/) and repository; the reviewed Count Up example's actual source and [license](https://github.com/DavidHDev/react-bits/blob/main/LICENSE.md).
- [Recharts animation guide](https://recharts.github.io/en-US/guide/animations/), the [Line API](https://recharts.github.io/en-US/api/Line/), installed-version considerations, and the [Recharts license](https://github.com/recharts/recharts/blob/main/LICENSE).
- [Emil Kowalski's design-engineering skills](https://github.com/emilkowalski/skills) and requested local skill modules; also the catalogued official examples for Aceternity Animated Modal, Card Spotlight, Animated Tabs, Background Beams, Stateful Button, Animated Sidebar, and Magic UI Animated Beam and Progressive Blur.

## Verified source-specific conclusions

- `docs/design-reference-implementation.md` records component APIs, official example behavior, installed-stack compatibility, selected adaptations, exclusions, exact license caveats, and the destination source files for the core eight references. A locally authored Motion scroll-progress trace is used in case history instead of copying Aceternity Tracing Beam source whose component-specific license/dependencies were not verified.
- `docs/extra-component-exploration.md` records the official documentation/demo observations, verified or unverified APIs, license status, accessibility/performance caveats, and casework-specific decision for each of eight additional requested components. The exact Aceternity Animated Sidebar page returned 404; a different component page was not treated as equivalent evidence.
- React Bits Count Up was inspected but intentionally not copied: its verified license is MIT plus Commons Clause, not a plain permissive MIT-only grant. Magic UI and Motion source reuse is documented in `THIRD_PARTY_NOTICES.md` where applicable.
- Only a small selected number-ticker/motion/list/theme patterns were appropriate. Unsupported or unverified library code, decorative background beams, spotlight, blur, broad animated templates and extra packages were excluded. The application uses its existing Radix, Motion/Framer Motion, Recharts and Lucide stack and retains its synthetic, browser-local data boundary.
