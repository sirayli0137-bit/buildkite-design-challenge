# Design Decision Log

A narrative of the iteration from first sketch to production. Each section captures a specific decision: what I considered, what I chose, and why.

This document is intended to support the follow-up conversation about the submission. It complements [`SUBMISSION.md`](./SUBMISSION.md), which describes the final state.

---

## Methodology

I treated this as an iterative design exploration. Each Option (V2–V7) was a test of a specific question, not a proposed solution. Some I built knowing they were stepping stones; others I built thinking they might be the answer and discovered they weren't.

The final architecture (V7) emerged from synthesising what worked across earlier options and rejecting what didn't.

I also:

- Re-read the PRD's six design principles before each major decision; almost every disagreement traced back to which principle should win
- Used the user archetypes (Jordan + Sam) as judges; if a change favoured one without disadvantaging the other, that was a green light
- Built scenarios as separate variants (V7.1–V7.5) to pressure-test that the design holds beyond the default failed-build case

---

## Iteration overview

| Option | Identity | Status |
|---|---|---|
| ~~V1 — Signal~~ | Minimal, typographic, border-led | Removed — felt too "designer-y," not Buildkite-native |
| V2 — Zoned | Background fills, uppercase section labels | Kept for comparison; rejected for production (heavy visual weight) |
| V3 — Sectioned | Card with "What failed / What it blocks / What to do" plain-language labels | Kept; strong frame but inconsistent action affordances |
| V4 — Merged | V3's labels + V2's blast radius treatment + flaky badge + Copy summary | Kept; useful synthesis, but structurally still card-based |
| V5 — Native | Strict mimicry of Buildkite's existing component primitives (PageSkeleton, BuildHeader chrome) | Kept; cleanest fit with codebase, baseline for production |
| V6 — Refined | V3 + a full lead-designer critique applied | Kept; closer to production |
| **V7 — Horizontal rows** | One row per failure, scales to N failures, action close to its motivating cue | **Production** |
| V7.1–V7.5 | Scenario variants of V7 | Production family |

---

## Key decisions

### 1. Layout: full-width vertical stack vs master-detail (sidebar + content)

**Considered:** A master-detail layout where the failed step is selected on a sidebar and its detail shows in the main area. This is the convention for the Tier 3 step list view that lives below the header.

**Chose:** Full-width vertical stack inside the expanded region.

**Why:** Tier 3 (the step list and logs view below the build header) already uses master-detail. Tier 2 (this expanded region) is conceptually a triage *summary*, not deep investigation. Repeating the master-detail pattern would compete visually with what's below and blur the tier boundary. A full-width stack reads as a distinct surface.

The PRD's three-tier architecture is what made this decision feel inevitable once articulated: each tier has its own purpose and shape.

---

### 2. Failure presentation: card vs row

**Considered:** A single elevated card with the failure as its hero, like a notification panel (V3 — Sectioned).

**Chose:** A horizontal row pattern (V7), where each failure is a self-contained row that can stack with siblings.

**Why:** The card pattern works for one failure but breaks down for two or more. Multi-failure builds (parallel test suites, parallel jobs) are realistic — the design has to scale to N. Rows stack naturally; cards don't. The reviewer (Sam) wants to compare exit codes and durations across failures; row alignment makes that easy.

There was also a horizontal-space argument: the right side of the failure card was empty in V3–V6. The row layout uses that horizontal space for inline metadata + per-row actions.

---

### 3. Pipeline shape: progress bar (visual) vs textual strip vs both

**Considered:** Three positions across the iteration:

1. Hide the bar when expanded; show a textual strip at the top of the expanded panel (the eventual choice)
2. Keep the bar visible always, drop the strip (intermediate exploration)
3. Show both — bar for visual gestalt, strip for deep links

**Chose:** Hide the bar when expanded; the textual strip at the top of the expanded panel takes its role.

**Why:** The bar and strip carry the same pipeline shape information at different fidelities. Showing both is redundant. The strip at higher fidelity (text labels + per-step deep links + blocked-vs-pending differentiation in amber) earns its place when the user is in triage mode. The bar's job — quick at-a-glance health when collapsed — is already done at that tier.

Doing this also unlocked removing the explicit "Blocks" row that earlier options had: the strip's amber pending labels carry the blast-radius signal, so an explicit list became redundant.

---

### 4. Action placement: top-right of the row vs below the suggestion

**Considered:** Initially I placed both Retry and Preview fix in the top-right of the failure row (twin outlined buttons). When the user pointed out that Preview fix's disclosure expands far below where the button sits — bad disclosure pattern — I had to decide where each action belonged.

**Chose:** Retry stays in the top-right (next to flaky indicator); Preview fix moved to live near the suggestion (its motivating cue), with the diff disclosure adjacent.

**Why:** The two actions have *different diagnostic cues*:

- Retry's cue is the flaky indicator (`flaky · 3 of 5 runs`) — environmental signal. Top row.
- Preview fix's cue is the suggestion text — code signal. Below the suggestion.

Pairing them in the top-right was a misleading symmetry that hid two different mental models. Splitting them by their cue made the design more honest.

---

### 5. AI labelling: implicit vs explicit on the surface

**Considered:** I went back and forth on this several times.

- Initial design: surface had Sparkles icon next to the suggestion + "Preview AI fix" + "Show more AI explanation" + "Apply AI fix" labels. AI was loud.
- Mid-iteration: dropped Sparkles from surface, kept "Show more explanation" / "Preview fix" / "Apply fix"
- Final: surface is AI-neutral; AI source is acknowledged only inside the expanded explanation card (header label "AI explanation" + Sparkles + "high confidence" + "Logs sanitized before AI processing.")

**Why:** Loud AI labelling everywhere felt like product marketing rather than diagnostic information. The user's job-to-be-done is "fix the build," not "interact with AI." The AI source is an implementation detail of how the suggestion is generated — it matters when the user wants to evaluate trust (which is exactly when they expand the explanation), but it's noise on the default scan.

The PRD §7.3 says the AI "adds context, it does not replace it" — the structured failure summary is the ground truth. That framing supports: surface presents the answer; AI provenance is one click away.

A different team might prefer the inverse (explicit branding of AI work). I think this is a judgement call where neither is clearly wrong.

---

### 6. Suggestion + explanation: two accordions or one?

**Considered:** Three structures at different points:

1. Suggestion text + a separate "AI explanation" accordion at the bottom of the expanded view (different content type, different scope)
2. Suggestion line itself as the disclosure trigger ("the one-liner is the headline; expanding shows the body")
3. Suggestion as plain prose with a separate "Show more explanation" inline trigger right after it

**Chose:** Option 3 — separate trigger.

**Why:** Option 1 was misleading because the suggestion line and the AI explanation are the *same content type at different lengths* (excerpt + body), not two different things. Separate accordions made them feel like distinct concerns.

Option 2 conflated two roles: the suggestion text is *content*, and making it the disclosure trigger gave it a hover underline that read as "navigate somewhere" rather than "expand in place." Mixing roles confused the user.

Option 3 keeps the suggestion as readable prose and adds an explicit trigger immediately after, scoped clearly: this is a click target, not a sentence to read.

---

### 7. Preview fix: single button or disclosure?

**Considered:** A `[Preview fix]` button that just shows a static label.

**Chose:** A disclosure pattern — `Preview fix ▾` opens an inline panel with the diff, then a separate `Apply fix` button confirms.

**Why:** PRD §4.2 (Security) is explicit: "destructive or pipeline-modifying actions require an explicit confirmation step. That confirmation must be additive: it appears alongside the failure context, not in place of it."

A single Preview fix button suggests one-click action. The actual flow needs two steps: show the user what would change, then have them confirm. The disclosure pattern handles this naturally — the diff appears in place, the Apply button is a deliberate second click.

The visual treatment also encodes commitment: outlined for Preview (reversible), solid black for Apply (committed). One Apply button in the entire view; that's the only place a code change happens.

---

### 8. The blocks row: keep or remove?

**Considered:** A separate "Blocks  Bundle  Deploy" row below the failure card with chip-style links.

**Chose:** Removed it; the pipeline strip's amber pending labels carry the same signal.

**Why:** The strip was already showing the same blocked steps with deep links. Listing them again as chips was duplication. The strip's amber colouring signals "blocked due to upstream failure" without needing an explicit label. Sam (the reviewer) gets blast radius from one element rather than two.

The trade-off: the explicit "Blocks" label was helpful for non-experts who might not infer "all the gray steps after the red one are blocked." I judged that the amber colouring + position + the failed step's red highlight together carry the meaning. If real-user testing showed otherwise, I'd put the explicit row back.

---

### 9. Copy summary: single (build-level) or per-row?

**Considered:** A single Copy summary at the bottom of the failure card (or as the card's footer), summarising the entire build.

**Chose:** Per-row Copy summary, in each failure row's top-right next to Retry.

**Why:** Retry is per-row (you don't retry every job when only one is flaky). Copy summary should be symmetric for the multi-failure case: each failure is a separate diagnostic conversation that might be shared with a different teammate. With one build-level Copy, Sam has to manually trim the text; with per-row Copy, each summary is already focused.

For single-failure builds (V7 default), this just means one Copy summary in one row — same behaviour, no overhead. The pattern shines in V7.4 (multi-failure).

The summary text per row leads with the row's specific failure but includes build-level context (blocked steps), so the recipient still understands the impact.

---

### 10. Step links: which pattern, with or without arrow?

**Considered:** Three different patterns in earlier iterations:

1. Outlined button chips with an arrow (Blocks chips)
2. Status icon + name + arrow as a text link (failure name)
3. Status icon + name, no arrow (pipeline strip steps, post-fix verification link)

**Chose:** Pattern 3 — status icon + name, hover affordance, no arrow indicator. Applied uniformly across all step links.

**Why:** The arrow was over-specifying what the hover already communicates. Buildkite's existing UI (PageSkeleton) treats step rows as inherently clickable surfaces with no arrow next to the name; the convention says "step names are links." Once you learn the convention (after seeing it once), the arrow is just visual noise.

Step links also became uniform across contexts: failed step in failure row, pipeline strip steps, blocked step references. Same vocabulary. The user reads one pattern once and the rest are immediately recognisable.

---

### 11. Hover underline colour: status-tinted or neutral?

**Considered:** Status-tinted underlines (red for failed, amber for warning, zinc for neutral) were in early V7 and V7.1.

**Chose:** A single neutral `decoration-zinc-400` everywhere.

**Why:** Status-tinted underlines were solving a problem that didn't exist. The status is already communicated by the icon next to the link name. The underline is a *navigation* affordance, not a *content* affordance — and navigation affordances in every design system I know use a single hover treatment. Splitting the pattern by status forces the user to decode colour semantics on every interaction.

This is one of the cases where the symmetry argument was strong on its own terms: design system consistency favours one link treatment.

---

### 12. Cross-build vs flaky indicator: redundancy

**Considered:** When the V7.5 cross-build aggregation banner is showing ("Test Node 18 has failed across 3 builds"), the failure row's flaky pill (`flaky · 3 of 5 runs`) reads as redundant. Both are recurring-failure signals at different scopes.

**Chose:** Suppress the flaky pill in V7.5 specifically. V7Refined accepts a `suppressFlaky` prop; V7_5_CrossBuild passes it.

**Why:** The cross-build banner subsumes the flaky pill at a higher scope. Showing both was duplicating the same idea. The PRD distinguishes "this pipeline's history" (flaky) from "across builds" (cross-build aggregation), and when the wider signal is present the narrower one is just noise.

A small thing, but it's the kind of cleanup that compounds: when each variant feels deliberate about what it shows, the whole component reads more thoughtfully.

---

### 13. Pattern dispatch refactor

**Considered:** During iteration, three lookups had grown brittle:

```ts
function getSuggestion(...) {
  if (exitCode === 1 && isTest) return "Likely a CommonJS/ESM mismatch...";
  if (exitCode === 2 && isLint) return "ESLint found...";
  if (exitCode === 137) return "Process killed...";
  return null;
}

// In V7FailureRow:
const aiExplanation = (() => {
  if (suggestion?.includes("CommonJS")) return "...";
  if (suggestion?.includes("ESLint")) return "...";
  return null;
})();

const fixPreview = (() => {
  if (suggestion?.includes("CommonJS")) return { file: "src/auth.js", ... };
  if (suggestion?.includes("ESLint")) return { file: "src/utils.js", ... };
  return null;
})();
```

The IIFE lookups were *string-matching against the suggestion text*. If anyone changed "CommonJS" to "ES Module" in the suggestion, the explanation and fix lookups silently broke. Three places to update for one logical unit.

**Chose:** A typed `failurePatterns` table at the top of the file. Each entry owns its match predicate, suggestion, explanation, and fix together.

```ts
const failurePatterns: FailurePattern[] = [
  { id, matches: (step, exitCode) => ..., suggestion, explanation, fix },
  ...
];

function matchFailurePattern(step, job): FailurePattern | null { ... }
```

**Why:** The previous architecture coupled three places by string content; the refactor couples them by typed identity. Adding a new pattern is one entry in one table. `getSuggestion()` is preserved as a thin compatibility wrapper for V2–V6.

This was the most code-architecture-y decision but it had the highest leverage: every future failure pattern (real telemetry, real AI service) plugs in at one site.

---

### 14. Type safety: `status?: string` vs `BuildStatus` union

**Considered:** Several variant components typed their `status` prop as `string` (loose). The exported `ExpandedTriageViewProps` type used the proper union, but inside V7Refined it was re-typed as `string` — losing the type safety from the entry point onward.

**Chose:** Defined a local `BuildStatus` type union and used it consistently in V7Refined.

**Why:** Type safety is a clarity win on its own — wrong status strings get caught at the boundary. It also documents the contract: a reader of V7Refined's signature now knows exactly which statuses are valid.

I didn't propagate this fix through V2–V6 since they're comparison artefacts, not production. For V7 it matters.

---

### 15. Accessibility: status announcement + state announcement

**Considered:** Step links rendered as `<a><Icon /><span>{name}</span></a>` — screen readers heard "Test matrix, link" but not "Failed." Status was conveyed through the icon's colour, which is invisible to AT.

**Chose:** Added `aria-label` on each step link using the existing `getStatusLabel(status)` helper, so screen readers hear "Test matrix, Failed." For Copy summary, added a visually-hidden `<span aria-live="polite">` that announces "Summary copied to clipboard" on state change.

**Why:** Status colour alone fails WCAG. The pre-existing helper made the fix mechanical: same vocabulary as the rest of the codebase, no new strings to maintain.

---

## What I'd revisit with more time

1. **Real-user testing** — I haven't watched a real Buildkite developer use this. Three iterations of polish equals one good observation session.
2. **Wide-pipeline strip behaviour** — the demo has 6 steps; real pipelines have 15–30. The textual strip would wrap heavily at scale; the progress bar handles wide pipelines better. Likely there's a step-count threshold above which the bar is the better expanded-view choice.
3. **Pattern dispatch as data file** — the `failurePatterns` table is currently inline in `ExpandedTriageView.tsx`. With more patterns it should move to its own file (`data/failurePatterns.ts`).
4. **Amber overload** — six concepts use amber. A tighter palette would reduce cognitive load.
5. **Stronger headline weight** — the failure name is `text-sm font-semibold` due to my own 14px-max rule. Whether breaking that rule for the headline (text-base, 16px) creates a cleaner anchor without disrupting compactness is a worth-testing question.
6. **AI integration honesty** — the current pattern dispatch is a stand-in for a real LLM. With actual integration I'd surface uncertainty (when the match is loose) and capture user feedback when they accept/reject the suggestion.
7. **Cross-build aggregation as its own surface** — V7.5's banner is the entry point; the actual aggregation view (affected builds, inferred root cause, escalation path) is a different component that I'd design next.

---

## What I learned from the iteration

A few principles that crystallised through the back-and-forth:

- **One element per role.** When two elements communicate the same thing at different fidelities, one is doing redundant work. The Blocks row vs the strip's amber labels was the clearest example.
- **Match commitment level to visual weight.** The `Apply fix` button is the only solid black button in the whole component; it's the only place a code change actually happens. Outlined for reversible actions, ghost for low-commitment ones, solid for committed.
- **Affordances should not lie.** The arrow-on-step-link, the underline-on-suggestion-text, the AI Sparkles on the surface — each was visually communicating something the design didn't actually do. Removing them clarified the design's actual contract.
- **Action lives next to its motivating cue.** Retry near the flaky indicator; Preview fix near the suggestion. Splitting them by their *diagnostic cue*, not by their *action category*, made the mental model match the visual layout.
- **Refactor under iteration pressure.** The pattern dispatch table emerged because three string-matching lookups had become a maintenance hazard. Refactoring midway through the iteration meant the next two changes were trivial; refusing to refactor would have made them painful.
