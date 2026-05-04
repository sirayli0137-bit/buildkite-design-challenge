# Deck 4 — Production Design & Future

**Audience:** Reviewers. The final state walkthrough + scenarios + future work.

**Length:** ~7–8 minutes spoken. ~10–11 slides.

---

## Slide 1 — Title

**The Production Design — Option 7**

What ships, what's deferred, and what plugs in next.

---

## Slide 2 — V7 walkthrough (annotated)

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

**Reading order matches user attention:**

1. Pipeline strip (orientation)
2. Failure card → name + meta (the answer)
3. Suggestion (diagnostic in plain prose)
4. Show more explanation (optional deeper context)
5. Preview fix → diff → Apply (the action)
6. Per-row Copy summary + Retry in top-right (share + environmental retry)

---

## Slide 3 — One element per role

| Element | Communicates |
|---|---|
| Pipeline strip | Pipeline shape (visual gestalt + blast radius via amber pending) |
| Failure card | What broke + diagnostic + action gate |
| Per-row Copy summary | Share that specific failure's context |
| Per-row Retry | Re-run that specific job |

No element duplicates another's job. The PRD's "summary layer, not a duplicate of the step list below" framing held.

---

## Slide 4 — Visual rules

**Two type sizes only.** Strict 14px max.

- `text-sm` (14px) — body, headings
- `text-xs` (12px) — meta, buttons, labels
- `font-mono` — exit codes, durations only

**Highlight only the highest-value signals.**

- Red AlertCircle, semibold failure name, exit code badge → highlighted
- Duration, parent step, matrix context → plain neutral text
- Flaky pill → just text (no badge / border / dot)

**Affordance vocabulary maps to commitment level.**

- Outlined buttons → reversible actions (Retry, Preview fix)
- Solid black → only Apply fix (the one committed action)
- Ghost buttons → soft actions (Copy summary)
- Inline text links → content disclosure (Show more explanation)

---

## Slide 5 — Scenario: V7.1 Stuck build (PRD Scenario 2 Variant B)

```
⚠ Test (Node 18)   3h 24m · 8m typical · 25× over    [↻ Retry job]  [✕ Cancel]
   in Test matrix · Node 16 passed · Node 20 pending
   Likely an unresponsive agent or stuck process — the step is far past its
   typical duration. Retry the job, or cancel and re-run the build. Show more
   explanation ▾
```

The build *never fails* — only the duration anomaly makes it visible. Without surfacing this, stuck builds stay invisible until a human notices the absence of a result.

Cancel button has a red border to encode commitment level.

---

## Slide 6 — Scenario: V7.2 Verified (PRD Scenarios 1 + 2 verification)

```
[Pipeline strip — all green]

✓ All steps passed                       Completed in 1m 22s

✓ Test (Node 18) was previously failing — now passing.  Show more explanation ▾    1m 14s
   Fix applied 2 minutes ago by Alex Rivera · view previous build
```

Carries forward context from the previous build. The developer / reviewer immediately knows the fix landed correctly without diffing two builds manually.

---

## Slide 7 — Scenario: V7.4 Multi-failure (scalability)

```
⚠ Lint                exit 2  5s                       📋 Copy summary  [↻ Retry]
   ESLint found 12 violations across 3 files. Most are auto-fixable.  Show more
   explanation ▾
   [Preview fix ▾]

⚠ Test (Node 18)      exit 1  1m 12s · prev 1m 18s  flaky · 3 of 5    [↻ Retry]
   in Test matrix · Node 16 passed · Node 20 pending
   Likely a CommonJS/ESM import mismatch on Node 18.  Show more explanation ▾
   [Preview fix ▾]
```

Each row is self-contained: own suggestion, own explanation, own diff, own Copy summary, own Retry.

The pattern scales to N failures without restructuring.

---

## Slide 8 — Scenario: V7.5 Cross-build aggregation (PRD Scenario 4)

```
⚠ Test (Node 18) has failed across 3 builds in the last hour — possible shared
  root cause.   View pattern   ✕

[Pipeline strip]

⚠ Test (Node 18)  exit 1  1m 12s · prev 1m 18s    📋 Copy summary  [↻ Retry]
  ...
```

Banner at the top primes interpretation: *this isn't your build alone.*

The flaky pill in the failure row is suppressed when the banner is present — the higher-scope signal subsumes the per-pipeline one.

---

## Slide 9 — Architecture highlights

**Typed pattern dispatch** — one table, one match function:

```ts
const failurePatterns: FailurePattern[] = [
  { id: "commonjs-esm-mismatch", matches: ..., suggestion, explanation, fix },
  { id: "eslint-violations",     matches: ..., suggestion, explanation, fix },
  { id: "oom-kill",              matches: (_, exit) => exit === 137, ..., null, null },
];
```

**Scenario data** — one source of truth in `data/mockBuildSteps.ts`:

```
mockBuildSteps          → default failed
verifiedScenarioSteps   → V7.2
stuckScenarioSteps      → V7.1
multiFailScenarioSteps  → V7.4
```

App.tsx's `getScenarioForVariant()` selects the right dataset, so the **whole** build header (collapsed bar AND expanded panel) reflects the scenario.

**Shared composition primitives** — `V7FailureRow`, `V7PipelineStrip`, `V7AIExplanationTrigger`, `V7AIExplanationCard`, `V7CopySummary`. Each variant composes from these.

---

## Slide 10 — Accessibility wins

- WCAG AA contrast (zinc-500 minimum on white, verified amber-700, red-700)
- Status icons paired with `aria-label` on links — screen readers hear "Test matrix, Failed" not just "Test matrix"
- Copy summary state change announced via visually-hidden `aria-live="polite"`
- All disclosure triggers carry `aria-expanded`
- Decorative icons consistently `aria-hidden="true"`
- Focus-visible rings on every interactive element (`ring-2 ring-blue-600 ring-offset-2`)
- Semantic HTML: `<nav><ol>` for pipeline strip, real `<button>` / `<a>` correctly distinguished
- Status communicated via icon + text label, never colour alone

---

## Slide 11 — Trade-offs and deferred work

**Conscious trade-offs** (worth discussing):

- AI labelling: implicit on surface, explicit inside disclosure. Could go either way.
- Per-row Copy summary in multi-failure: granular sharing vs slight redundancy when sharing the whole build.
- Pipeline strip vs progress bar: strip wins in expanded view (higher fidelity, deep links).

**Polish I'd take with more time:**

- Amber overload (used for 6 different concepts)
- Stronger headline weight (currently capped at 14px by my own rule)
- Pattern dispatch as a separate data file

**Out-of-scope per PRD §12.2** (deferred deliberately):

- Real telemetry (flaky count, typical duration, cross-build count are mocked)
- Real AI service integration (pattern dispatch is the contract)
- Inline log preview (lives in Tier 3)
- Cross-build aggregation as a separate product surface (V7.5 is the entry point only)

---

## Slide 12 — What plugs in next

The architecture is designed so the next round of work doesn't require redesign:

- **Real build history API** → `flaky · 3 of 5 runs` and `prev 1m 18s` and the "across 3 builds" count become real
- **Real LLM integration** → suggestion, explanation, fix come from a service rather than the pattern table; pattern table becomes the schema
- **Cross-build aggregation surface** → V7.5's banner is the entry point; the actual aggregation view (affected builds, inferred root cause, escalation path) is a sibling component

---

## Slide 13 — What I'd do differently with more time

1. **Real-user testing** — three iterations of polish equals one good observation session
2. **Test the strip on wide pipelines (15–30 steps)** — there's a step-count threshold above which the bar is the better expanded-view choice
3. **Build the AI explanation as a real LLM call** — surface uncertainty, capture user accept/reject feedback
4. **Cross-build aggregation as a sibling component** — design the actual aggregation view, not just the entry banner

---

## Slide 14 — Walkthrough Q&A points (for the live conversation)

If we have 30 minutes of follow-up:

1. **The PRD as scaffolding** — how the strategy doc shaped what to design and what to defer
2. **Why iteration was valuable** — most decisions came from rejecting alternatives, not from the first idea
3. **The pattern dispatch refactor** — concrete example of refactoring under iteration pressure
4. **Trade-offs I'm uncertain about** — AI labelling, per-row vs build-level Copy summary, amber overload
5. **What changes for production** — where the real telemetry plugs in, where the AI service plugs in, what stays the same
