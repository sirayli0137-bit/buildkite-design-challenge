# Deck 3 — Design Exploration

**Audience:** Reviewers. This is the iteration narrative — how V2 became V7. The point is to show *thinking process*, not just outcomes.

**Length:** ~7–8 minutes spoken. ~10 slides.

**Companion doc:** [`DECISION_LOG.md`](../DECISION_LOG.md) has the full 15-decision narrative with rationale.

---

## Slide 1 — Title

**Design Exploration — From V2 to V7**

Each option tested a question, not proposed a solution.

---

## Slide 2 — Methodology

I built variants as **questions**, not candidates. Some I knew were stepping stones; others I built thinking they might be the answer and discovered they weren't.

For each iteration:

1. State the question the variant tests
2. Build it
3. Identify what works + what fails
4. Synthesise the next variant from what I keep + what I drop

The final architecture (V7) is the synthesis, not the first idea.

---

## Slide 3 — Option 2: Zoned

**Question:** Do background fills + uppercase section labels help non-experts?

**Result:** Heavy. Three coloured zones (rose / amber / white) made the component feel like a dashboard panel rather than a header overlay. Section labels (`WHAT FAILED`, `WHAT TO DO`) competed with the failure name for visual weight.

**Kept:** the explicit-section labelling idea — useful for non-experts.
**Dropped:** background fills as the main visual differentiator.

---

## Slide 4 — Option 3: Sectioned

**Question:** What if we use plain-language labels instead of icons or colour zones?

**Result:** Strong frame. "What failed / What it blocks / What to do" mapped directly to user questions. But action affordances were inconsistent — the Preview fix button was rendered as a primary blue CTA, which over-implied commitment.

**Kept:** plain-language section structure.
**Dropped:** card-elevation visual treatment (shadow), inconsistent button weights.

---

## Slide 5 — Option 4: Merged

**Question:** Can we combine V3's labels with V2's blast-radius treatment + flaky badge + Copy summary?

**Result:** Useful synthesis. Showed the whole "answer panel" working together. But still card-based, and the "WHAT FAILED" label was redundant — the failure name + AlertCircle icon already said it.

**Kept:** flaky indicator as inline pill, Copy summary in blast-radius zone, deep-link arrows on chips.
**Dropped:** redundant section labels, the per-section visual zones.

---

## Slide 6 — Option 5: Native

**Question:** What if we strictly mimic Buildkite's *existing* component primitives?

**Result:** Cleanest match to the codebase. Used PageSkeleton's solid-circle status pips, BuildHeader's chrome (`rounded-md border-zinc-200/60 bg-white/50`), BuildActionsComboButton's button class signature, the same 13px / 14px text sizes from breadcrumbs and step rows.

This was the baseline that influenced every later option — once we knew what "feels like Buildkite" was, we could deliberately stay close to it or deliberately depart.

**Kept:** the Buildkite-native primitives as the design system reference.
**Dropped:** nothing; this was a foundation, not a candidate.

---

## Slide 7 — Option 6: Refined

**Question:** What does V3 look like with a full lead-designer critique applied?

**Critique applied:**
1. Drop redundant "WHAT FAILED" label
2. Make the failure name itself the deep link (no separate ExternalLink icon)
3. Add inline flaky pill
4. Add Copy summary in Blocks row
5. Demote Preview fix from primary blue CTA → outlined; add Retry alongside
6. Promote AI explanation to a more visible button (then later, this got reconsidered)
7. Distinguish blocked from pending in pipeline strip
8. Add passed and running states
9. Remove dismiss X on suggestion (suggestions are contextual, not state)
10. Tighten suggestion copy

**Result:** Closer to production. But still card-based; didn't yet handle multi-failure scaling.

---

## Slide 8 — Option 7: Horizontal rows (production)

**Question:** What if the failure is a row, not a card?

**Result:** **Production.** Each failure is a self-contained row that:
- Stacks naturally for multi-failure scenarios
- Uses horizontal space (right side held actions, used to be empty)
- Co-locates action with its motivating cue
- Stays compact (strict 14px max, two type sizes only)

Pipeline strip at the top, failure rows in the middle, no trailing footer. One element per role, no duplication.

---

## Slide 9 — Five turning points

Decisions where the iteration shifted direction:

1. **"Why don't all step links look the same?"** → Three step-link patterns (chip with border, text+arrow, icon+name) became one (icon+name, no arrow, hover affordance).
2. **"Why is the action far from the trigger?"** → Initially Preview fix was top-right; disclosure expanded at bottom-left. Diagonal eye-track. Moved trigger near the disclosure.
3. **"Is suggestion + AI explanation two things or one?"** → Two accordions felt like two distinct things; they're the same content at different lengths. Merged into one disclosure with the suggestion as the headline.
4. **"Should AI be loud on the surface?"** → Initially yes (Sparkles + "Show more AI explanation" + "Preview AI fix"). Stripped back to ordinary labels; AI source acknowledged inside the disclosure only.
5. **"Pipeline shape: strip or bar?"** → Tried both visible. Redundant. Strip wins in expanded view (higher fidelity, deep links, blocked-vs-pending differentiation); bar stays for the collapsed Tier 1.

---

## Slide 10 — Pattern dispatch refactor

**Mid-iteration architecture change:**

The suggestion / explanation / fix had grown into three separate string-matching lookups. If anyone changed "CommonJS" to "ES Module" in the suggestion, the explanation and fix lookups would silently break.

```
function getSuggestion() { if (exit === 1 && isTest) return "..."; ... }
const aiExplanation = (() => { if (suggestion?.includes("CommonJS")) return "..."; ... })();
const fixPreview = (() => { if (suggestion?.includes("CommonJS")) return {...}; ... })();
```

Refactored to a typed pattern table:

```
const failurePatterns: FailurePattern[] = [
  { id, matches: predicate, suggestion, explanation, fix },
  ...
];
```

One entry per pattern. Suggestion + explanation + fix all coupled by typed identity, not string content.

This was the highest-leverage change in the whole iteration — every future failure type plugs in at one site.

---

## Slide 11 — Wrap

Iteration delivered:
- **Five visual variants** before we found the right one
- **Five scenario variants** to pressure-test it
- **One refactor** that future-proofs the architecture

Most decisions came from rejecting alternatives, not from the first idea. The variant switcher (still in the running app) lets a reviewer click through the iteration history.

**Next deck:** the production design + future scenarios.
