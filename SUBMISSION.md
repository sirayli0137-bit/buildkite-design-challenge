# Submission — Build Header Expanded Triage View

**Author:** Siray Li
**Component:** `BuildHeader.tsx` expanded region
**Production variant:** Option 7 — Horizontal failure rows

## TL;DR

Replaced the placeholder `div` in `BuildHeader.tsx`'s expanded region with a triage view that surfaces **what failed, what's blocked, and what to do** in ~10 seconds.

The production version is `Option 7 — Horizontal rows`. Five scenario variants (`Option 7.1–7.5`) extend the design to stuck builds, post-fix verification, multi-failure pipelines, and cross-build aggregation. A variant switcher at the top of the running app lets a reviewer click between them; click the PR row to expand any.

## The problem

Full strategic framing in [`PRD.md`](./PRD.md). One paragraph: when a developer clicks a PR row in a failed build, they're signalling high intent — they want to understand what happened. Today, that click opens an empty placeholder, so they scroll past the header and click into individual step logs. That 2–3 click detour breaks flow exactly when urgency is highest. The expanded region needs to **be the answer**, not a stepping stone.

The PRD's six design principles:

1. **Failure-first** — failure is the headline
2. **Triage, not deep-dive** — the step logs are one click away
3. **Blast radius clarity** — what's blocked, by name, not just a count
4. **Accessible to non-experts** — plain language, colour + text not colour alone
5. **Status-aware** — passed / running / failed each have their own framing
6. **Compact and contained** — a header, not a dashboard

## User archetypes

Full journey map in [`JOURNEY_MAP.md`](./JOURNEY_MAP.md).

- **Jordan — product engineer / individual developer.** Solo or small team. Shipped a PR, build failed. In "fix mode." Wants the shortest path to "what broke and how do I fix it?" May not have DevOps expertise.
- **Sam — reviewer / team lead.** Reviewing PRs or monitoring the team's build queue. Wants blast radius and severity at a glance without diving into logs. Is this PR's author actually responsible for this?

## Design approach

I treated this as an iterative design exploration. Each option tested a specific question. Full narrative in [`DECISION_LOG.md`](./DECISION_LOG.md); short version:

| Option | Question it tested | Outcome |
|---|---|---|
| 2 — Zoned | Do background fills + uppercase section labels help non-experts? | Heavy on visual weight; rejected |
| 3 — Sectioned | What if we use plain-language labels: "What failed / What it blocks / What to do"? | Strong frame but inconsistent action affordances |
| 4 — Merged | Combine V3's labels with V2's blast radius + flaky badge + Copy summary | Useful exercise; structurally still card-based |
| 5 — Native | Strictly mimic Buildkite's existing component primitives (PageSkeleton, BuildHeader chrome) | Cleanest match to existing codebase; baseline for production |
| 6 — Refined | V3 with a full critique applied (drop the redundant "What failed" label, add flaky/copy/retry, demote Preview fix from primary CTA) | Closer to production but still card-based |
| **7 — Horizontal rows** | **Production:** scales to N failures, leverages horizontal space, action lives next to its motivating cue, strict 14px max + WCAG AA | **Production** |

Variants 7.1–7.5 then demonstrated the same pattern under specific PRD scenarios:

| Variant | Scenario | What it shows |
|---|---|---|
| **7.1 — Stuck build** | PRD §12.1 Scenario 2 Variant B | Duration anomaly (`3h 24m · 8m typical · 25× over`) with Retry / Cancel actions. The build never fails — only the anomaly makes it visible |
| **7.2 — Verified** | PRD §12.1 Scenario 1 + 2 verification | Post-fix carry-forward: "Test (Node 18) was previously failing — now passing" with attribution and link to previous build |
| **7.4 — Multi-failure** | Scalability of the row pattern | Two parallel failures (Lint + Test matrix) stacked, each with its own per-row Retry, Copy summary, suggestion, Show more, Preview fix |
| **7.5 — Cross-build** | PRD §12.1 Scenario 4 (deferred per §12.2 but design must accommodate) | Top banner "Test (Node 18) has failed across 3 builds in the last hour"; flaky pill suppressed in the failure row to avoid duplicating the higher-scope signal |

(Option 7.3 was removed mid-iteration; it just demonstrated the AI explanation accordion's open state, which the user can already see by clicking `Show more explanation` in any other variant.)

## The production design — Option 7

When the PR row is expanded:

```
✓ Checkout › ✓ Dependencies › ✓ Lint › ⚠ Test matrix › ○ Bundle › ○ Deploy
                                                          ↑ amber: blocked

┌─────────────────────────────────────────────────────────────────────┐
│ ⚠ Test (Node 18)  exit 1  1m 12s · prev 1m 18s  flaky · 3 of 5      │
│                                              📋 Copy summary  [↻ Retry] │
│   in Test matrix · Node 16 passed · Node 20 pending                  │
│   Likely a CommonJS/ESM import mismatch on Node 18. Check require()  │
│   calls.  Show more explanation ▾                                    │
│   [Preview fix ▾]                                                    │
└─────────────────────────────────────────────────────────────────────┘
```

### Reading order matches user attention

- **Pipeline strip** at top — orientation: where in the journey did this break? Pending steps after the failure render in amber so the strip itself communicates blast radius
- **Failure card** — the answer: what broke, exit code, duration vs typical, flakiness, deep link to the step's logs
- **Suggestion line** — diagnostic in plain prose; click `Show more explanation` for the longer paragraph (with confidence indicator + "Logs sanitized before AI processing." footer inside the disclosure)
- **`Preview fix`** disclosure — opens to show the proposed diff (`src/auth.js`) and an `Apply fix` button. Two-step gate: preview, then commit
- **Per-row actions** in top-right — `Copy summary` (ghost button, shareable text) and `Retry` (outlined, environmental retry)

### Information architecture: one element per role

| Element | Role |
|---|---|
| Progress bar (collapsed) → pipeline strip (expanded) | Pipeline shape (visual gestalt) |
| Failure card | What broke + diagnostic + action gate |
| Per-row Copy summary | Share that specific failure's context |
| Per-row Retry | Re-run that specific job |
| Pipeline strip's amber pending labels | Blast radius (which steps are blocked) |

No element duplicates another's job. The "Blocks" row that earlier versions had was removed once the strip's amber labelling carried the same signal.

### Visual rules

- **Two type sizes only**: `text-sm` (14px, max) for body + headings; `text-xs` (12px) for meta, buttons, labels. Plus `font-mono` for technical data (exit codes, durations).
- **Highlight only the highest-value signals**: red AlertCircle, semibold failure name, exit code badge (red-50 + red-200 + red-700 mono). Everything else stays neutral zinc-500/zinc-700.
- **Affordance vocabulary**:
  - Outlined buttons (`border-zinc-300 bg-white`) for actions
  - Solid black (`bg-zinc-900`) only for `Apply fix` — the only committed action
  - Ghost buttons (no border, hover bg-zinc-100) for soft actions like Copy summary
  - Inline text links (hover underline) for content disclosure ("Show more explanation")

### Status awareness

V7 ships a single component family that handles four build states:

- **Failed** → V7Refined (card with red border + failure rows)
- **Running** → V7Running (card with amber border + spinner + "X of Y steps complete")
- **Passed** → V7Passed (card with green border + "All steps passed" + total duration)
- **Stuck** (specialised running) → V7_1_Stuck (amber border, duration anomaly inline, Cancel action added)

## Architecture

### Tech

React 18 + TypeScript + Tailwind 3 + Vite + lucide-react. No new dependencies added.

### Typed pattern dispatch

A single table at the top of `ExpandedTriageView.tsx` declares each failure pattern as a typed unit:

```ts
type FailurePattern = {
  id: string;
  matches: (step, exitCode) => boolean;
  suggestion: string;
  explanation: string | null;
  fix: { file; before; after } | null;
};

const failurePatterns: FailurePattern[] = [
  { id: "commonjs-esm-mismatch", matches: ..., suggestion: ..., explanation: ..., fix: ... },
  { id: "eslint-violations",     matches: ..., suggestion: ..., explanation: ..., fix: ... },
  { id: "oom-kill",              matches: (_, exit) => exit === 137, ..., explanation: null, fix: null },
];
```

`matchFailurePattern(step, job)` returns the first matching pattern. The suggestion, longer explanation, and proposed diff all come from the same object — no string-matching against the suggestion text. Adding a new failure type is one entry in one table.

### Scenario data

`data/mockBuildSteps.ts` exports four scenario datasets:

- `mockBuildSteps` — the canonical failed build (default)
- `verifiedScenarioSteps` — every step passes, used by Option 7.2
- `stuckScenarioSteps` — Test (Node 18) running for 3h 24m, used by Option 7.1
- `multiFailScenarioSteps` — Lint + Test matrix both failed, used by Option 7.4

`App.tsx`'s `getScenarioForVariant()` picks the right dataset based on the selected variant, so the **whole** build header — collapsed progress bar AND expanded panel — reflects the scenario. No mismatched chrome.

### Shared composition primitives

V7's helpers are deliberately small and composable:

- `V7FailureRow` — one failure with metadata + actions + accordions
- `V7PipelineStrip` — horizontal pipeline shape signal
- `V7AIExplanationTrigger` — inline text-link disclosure trigger
- `V7AIExplanationCard` — bordered card with header / body / security footer
- `V7CopySummary` — ghost button with `aria-live` state announcement

V7Refined composes these. V7.1, V7.2, V7.4, V7.5 either reuse V7Refined directly (passing `topBanner` / `suppressFlaky` props) or build their own layout with the same primitives.

## Accessibility

Verified to pass WCAG AA basics:

- All body text ≥ `text-zinc-500` on white (4.6:1 contrast)
- Status colours never the only signal — every status indicator has accompanying text + screen-reader label
- Status icons: link `aria-label` reads `${name}, ${getStatusLabel(status)}` (e.g., "Test matrix, Failed", "Bundle, blocked")
- Copy summary state change announced via visually-hidden `<span aria-live="polite">`
- All disclosure triggers carry `aria-expanded`
- Decorative icons all `aria-hidden="true"`
- Focus-visible ring on every interactive element (`ring-2 ring-blue-600 ring-offset-2`)
- Semantic HTML: `<nav><ol>` for the pipeline strip, real `<button>` / `<a>` distinguished by role
- Keyboard order matches visual order

## Scenarios served

Mapping to PRD §12.1 future-state scenarios:

| PRD scenario | Variant(s) covering it |
|---|---|
| Scenario 1 (notification → triage → fix → share) | V7 default + V7.2 (verification) |
| Scenario 2A (recurring failure indicator) | V7 default (`flaky · 3 of 5 runs` pill) |
| Scenario 2B (stuck build / duration anomaly) | V7.1 |
| Scenario 2 (contextual retry) | All V7.* (per-row Retry button) |
| Scenario 2 (post-retry / post-fix verification) | V7.2 |
| Scenario 3 (AI explanation, copilot, fix execution) | V7 default — Show more explanation accordion + Preview fix → Apply fix |
| Scenario 4 (cross-build aggregation) | V7.5 (out-of-scope per PRD §12.2; included to demonstrate the design accommodates the future layer) |
| (cross-cutting) Multi-failure scalability | V7.4 |

## Trade-offs and deferred work

### Deferred (PRD §12.2 explicitly defers these)

- **Real telemetry** — the flaky indicator (`3 of 5 runs`), the typical-duration baseline (`prev 1m 18s`), the cross-build aggregation count (`across 3 builds`) are mocked. Production needs build history + cross-pipeline aggregation APIs.
- **Real AI** — the suggestion, explanation, and fix come from the typed pattern dispatch table. Production would integrate with the AI service that PRD §7.3 anticipates. The pattern dispatch is the contract: new patterns can be data-driven.
- **Inline log preview** — explicitly out of scope per PRD. Step logs live in Tier 3.
- **Cross-build aggregation as a separate product surface** — the V7.5 banner is a teaser of how the structured triage data extends; the aggregation layer itself is a separate component.

### Decisions I made consciously and would revisit

- **AI is implicit on the surface, explicit inside the disclosure.** The visible suggestion + Preview fix don't say "AI" — they read as ordinary diagnostic + action. The AI source is acknowledged only inside the explanation card (header + Sparkles icon + "Logs sanitized before AI processing"). I went back and forth on this. Keeping it implicit on the surface lets the design stay neutral; making it explicit makes the source honest. I landed on implicit to avoid the "AI everything" branding feel, but a different team might prefer the inverse.
- **Per-row Copy summary in multi-failure.** Each failure row in V7.4 has its own Copy summary. Each summary is scoped to that failure but includes build-level context (blocked steps). This is a deliberate trade-off versus a build-level summary — granular sharing for asymmetric audiences (Lint to JS team, Test to Node person), at the cost of some redundancy when the user wants the whole build.
- **Pipeline strip vs progress bar.** The collapsed progress bar is hidden when expanded; the textual strip takes its role. We considered keeping both but the strip carries the same shape information at higher fidelity (clickable per-step deep links, blocked vs pending differentiation). Showing both was redundant.

### Polish I'd take with more time

- **Amber overload.** Amber is currently used for: stuck warning, in-progress, flaky pill, blocked steps in strip, AI Sparkles inside the card, cross-build banner. Six different concepts on one hue. Differentiation works because of icons + position, but a tighter palette (e.g., reserve amber for "warning" only and use a different hue for "in-progress") would reduce cognitive load.
- **Stronger hierarchy on the failure name.** The failure name is `text-sm font-semibold` — capped by my own 14px-max rule. With more time I'd test whether breaking that rule for the headline (going to text-base) creates a cleaner first-glance anchor without making the whole component feel less compact.
- **Pattern dispatch as data file.** Currently inline in `ExpandedTriageView.tsx`. With more patterns, it should move to its own file (`data/failurePatterns.ts`) — the typed shape is already designed for it.

## What I'd do differently with more time

- **Real user testing.** I haven't watched a real Buildkite developer use this. The design choices are reasoned from PRD principles + journey maps, but a 30-minute test with one Jordan and one Sam would reveal more than the last three iterations combined.
- **Test the strip on wide pipelines.** The mock has 6 steps. Real Buildkite pipelines often have 15–30 steps. The textual strip would wrap heavily; the visual would degrade. The progress bar handles wide pipelines better (thinner segments). At some step count, switching back to the bar in the expanded view becomes the right call. I'd want to find that threshold empirically.
- **Build the AI explanation as a real LLM call.** The current pattern dispatch is a stand-in. With a real AI integration, I'd want to surface uncertainty (when the pattern matches loosely), and let the user accept/reject for feedback that improves future patterns.
- **Cross-build aggregation as a sibling product surface.** The banner in V7.5 is the entry point; the actual aggregation view (showing the affected builds, the inferred root cause, escalation path) is its own component. I'd design that next.

## Walkthrough — what I'd talk about in the conversation

If we have 30 minutes of follow-up:

1. **The PRD as scaffolding** — how the strategy doc shaped what to design and what to defer
2. **Why the iteration was valuable** — most decisions came from rejecting alternatives, not from the first idea
3. **The pattern dispatch refactor** — concrete example of refactoring under iteration pressure (started with three IIFE lookups, ended with a typed table)
4. **Trade-offs I'm uncertain about** — AI labelling implicit/explicit, per-row vs build-level Copy summary, the amber overload
5. **What changes for production** — where the real telemetry plugs in, where the AI service plugs in, what stays the same

## Running it locally

```bash
npm ci
npm run dev    # http://localhost:5173
```

Use the variant switcher at the top of the page to pick an option. Click the PR row in the build header to expand. The production version is `Option 7 — Horizontal rows`.

## File structure (key files)

```
src/
  App.tsx                              ← variant switcher + scenario selection
  components/
    BuildHeader.tsx                    ← unchanged shell + the expansion wrapper
    ExpandedTriageView.tsx             ← all variants (V2–V7.5) + helpers
    BuildActionsComboButton.tsx        ← unchanged (existing build-level actions)
    HeaderBreadcrumbStubs.tsx          ← unchanged
    PageSkeleton.tsx                   ← unchanged (page chrome below the header)
  data/
    mockBuildSteps.ts                  ← canonical + scenario datasets
  lib/
    buildStatus.ts                     ← unchanged (status helpers)
    utils.ts                           ← unchanged (cn helper)
  types/
    build.ts                           ← unchanged (BuildStep / Job types)
PRD.md                                 ← Product Requirements Doc (Part 1 strategy + Part 2 PRD)
JOURNEY_MAP.md                         ← User journey by archetype
DECISION_LOG.md                        ← Iteration narrative + decision rationale
SUBMISSION.md                          ← This document
README.md                              ← Original task brief (untouched)
AGENTS.md                              ← Original task notes (untouched)
```

## Reference

- **[`PRD.md`](./PRD.md)** — Product Requirements Doc (strategy → archetypes → JTBDs → scenarios → opportunity prioritisation)
- **[`JOURNEY_MAP.md`](./JOURNEY_MAP.md)** — User journey by archetype, stage by stage
- **[`DECISION_LOG.md`](./DECISION_LOG.md)** — Iteration narrative; the "why" behind each option
- **[`README.md`](./README.md)** — Original task brief (unmodified)
- **[`AGENTS.md`](./AGENTS.md)** — Original task notes (unmodified)
