# Deck 2 — Journey & Design Rationale

**Audience:** Reviewers. After establishing strategic context, this deck connects user research (archetypes + journey + JTBDs) to specific design choices.

**Length:** ~6–7 minutes spoken. ~10 slides.

---

## Slide 1 — Title

**User Journey & Design Rationale**

How the archetypes + journey map drove specific design choices.

---

## Slide 2 — Two archetypes (full map: `JOURNEY_MAP.md`)

### Jordan — Product Engineer / Individual Developer
- Solo or small team
- Shipped a PR, build failed, in "fix mode"
- Wants the shortest path to "what broke and how do I fix it?"
- May not have DevOps expertise
- *Emotional state: mild urgency, possibly anxious if blocking teammates*

### Sam — Reviewer / Team Lead
- Reviewing PRs or monitoring the build queue
- Not the author
- Wants blast radius and severity at a glance
- Doesn't want to read logs
- "Is this PR's author actually responsible for this?"

These two archetypes have **different priorities** for the same information. The design has to serve both.

---

## Slide 3 — Stage 5 of the journey: where this component lives

The collapsed progress bar (Tier 1) gave them a glimpse. They click. They expect an answer.

**Today**: empty placeholder. They scroll past the header and click into individual step logs.

**The intent moment is wasted at exactly the point urgency is highest.**

---

## Slide 4 — Pain points addressed

| Pain | Addressed by |
|---|---|
| "I see 'failed' but not 'why'" | Failure name + exit code + duration vs typical, all in the failure card top row |
| "I don't know if I'm blocking teammates" | Pipeline strip's amber pending labels show blast radius without expansion |
| "Exit codes are jargon to me" | Suggestion line in plain prose: "Likely a CommonJS/ESM import mismatch on Node 18. Check require() calls." |
| "Is this even my problem?" | Flaky pill (`flaky · 3 of 5 runs`) in the row; cross-build banner (V7.5) when wider pattern exists |
| "I have to scroll to find the right step" | Failure name is itself a deep link to the step in Tier 3 |
| "I don't have context to share with my team" | Per-row Copy summary in the top-right |

---

## Slide 5 — Jobs to be done (PRD §4.1)

| Situation | Motivation |
|---|---|
| Build fails | I want to instantly see which job broke and why |
| Failure on a PR I didn't author | I want to understand the blast radius |
| Multiple things failing | I want to know which is the root cause |
| New to CI/CD | Plain language, not log decoding |

These map almost directly to V7's elements:
- "What broke" → failure card top row
- "Blast radius" → pipeline strip's blocked labels (amber)
- "Multiple failures" → V7.4 (rows scale to N)
- "Plain language" → suggestion line + Show more explanation

---

## Slide 6 — Future-state JTBDs (PRD §4.2)

These I designed *with*, not *for*. The component shouldn't preclude them.

| Future JTBD | How the design accommodates it |
|---|---|
| Performance at scale | Compact and contained design; no perf-hostile rendering choices |
| Error aggregation | V7.5 cross-build banner; structured failure data is the foundation for the aggregation layer |
| Developer onboarding | Suggestion line as in-product education for non-experts |
| AI integration | Show more explanation accordion + Preview fix → Apply fix; pattern dispatch is the integration contract |
| Security | Apply fix is a deliberate two-step gate with attribution copy |

---

## Slide 7 — Opportunity prioritisation (PRD §12.1)

Four scenarios from the PRD, each anchored in a journey moment:

1. **Failure notification → triage → fix → share** (V7 default)
2. **Recurring failure / stuck build / contextual retry / verification** (V7.1 + V7.2)
3. **AI explanation / copilot / fix execution** (V7 default — Show more + Preview fix)
4. **Cross-build aggregation** (V7.5)

I built variants for the in-scope ones; V7.5 is a teaser of how the structured triage data extends to the future cross-build surface.

---

## Slide 8 — How a principle drives a specific choice

Pick a few high-leverage examples:

- **Principle 1 (Failure-first)** → red AlertCircle + semibold failure name + red exit-code badge are the only highlighted elements. Everything else stays neutral so the failure dominates the scan.
- **Principle 2 (Triage, not deep-dive)** → Removed the inline log preview consideration; failure name + suggestion + Preview fix are the surface. Logs are one click away in Tier 3.
- **Principle 3 (Blast radius clarity)** → Pipeline strip's amber pending labels carry the signal; an explicit "Blocks Bundle, Deploy" row was redundant once the strip did the job.
- **Principle 4 (Accessible to non-experts)** → Suggestion line in plain prose; status communicated via icon + colour + text (not colour alone); aria-labels for screen readers.
- **Principle 5 (Status-aware)** → V7Refined / V7Passed / V7Running / V7_1_Stuck — a single component family handles four states.
- **Principle 6 (Compact and contained)** → Strict 14px max font size; two type sizes total; ghost buttons for secondary actions.

---

## Slide 9 — Trade-offs we made consciously

Three I'd flag for discussion:

1. **AI labelling implicit on surface, explicit inside disclosure** — surface reads as ordinary diagnostic; AI source is acknowledged when the user expands. Could go either way.
2. **Per-row Copy summary in multi-failure** — granular sharing for asymmetric audiences, at the cost of slight redundancy when the user wants the whole build summary.
3. **Pipeline strip vs progress bar in expanded state** — strip carries the same shape information at higher fidelity; bar disappears on expand to avoid duplication.

---

## Slide 10 — Wrap

The journey map and JTBDs gave me concrete user moments to design against, not just abstract principles. When two design options were viable, the one that better served *both* archetypes won.

**Next deck:** the design exploration — how V2 became V7, and why each step happened.
