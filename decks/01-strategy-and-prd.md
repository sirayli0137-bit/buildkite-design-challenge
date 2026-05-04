# Deck 1 — Strategy & PRD Framing

**Audience:** Reviewers from Buildkite. The point of this deck is to show the work *was anchored on Buildkite's actual strategic direction*, not designed in a vacuum.

**Length:** ~6–7 minutes spoken. ~10 slides.

---

## Slide 1 — Title

**Build Header Triage View — Strategic Context**

How a small component sits inside a much bigger product story.

---

## Slide 2 — Where Buildkite stands today

> "Buildkite is the control plane for software delivery, while customers can choose where and how their build infrastructure runs."

- Hybrid architecture is the moat: enterprise-grade control + scale + security
- Strong position with mature engineering teams who care about flexibility, secure execution, customisable workflows

*Cite PRD §1 / Strategy §1*

---

## Slide 3 — The expansion challenge

> "From powerful CI/CD for enterprises → To CI/CD that grows with you, from first project to global scale."

- Buildkite wants to expand into SMB and individual developers
- The product currently feels oriented to platform engineers / DevOps experts
- Down-market expansion ≠ removing power. It means **progressively revealing power as users mature**

*Cite Strategy §2, §9*

---

## Slide 4 — The positioning shift

**Old**: powerful CI/CD for enterprises
**New**: *"Start simple. Scale infinitely."*

For this component specifically:

- **Individuals** — debug failures easily; clear error messages; minimal jargon
- **SMB teams** — make delivery visible; no DevOps team needed
- **Mid-market** — improve reliability; identify bottlenecks
- **Enterprise** — strong governance + flexibility; nothing taken away

The same expanded-region component has to serve all four. Different read at different fidelities.

---

## Slide 5 — Why this component matters

The expanded build header is a **micro-observability surface** — the fastest path from "something broke" to "I know what broke and what it blocked."

Two of Buildkite's strategic differentiators converge here:

- **Observability (Strategy §4.4)** — *why* builds are failing, *which* steps blocked downstream
- **Developer-first experience (Strategy §4.3)** — error explainability, accessible to product engineers, not only DevOps experts

Plus it's the natural entry point for the **AI-assisted debugging** future (Strategy §7.3).

---

## Slide 6 — The PRD's three-tier architecture

| Tier | Surface | Time to read | Purpose |
|---|---|---|---|
| 1 | Progress bar (collapsed) | ~2 seconds | At-a-glance pipeline health |
| **2** | **Expanded header (this)** | **~10 seconds** | **Triage: what broke, what's blocked** |
| 3 | Step list + logs below | Minutes | Deep investigation |

**Tier 2 must be faster than scrolling down.** It's a summary layer, not a duplicate of the step list below.

---

## Slide 7 — Six design principles

Each one comes back as a deciding vote in the iteration:

1. **Failure-first** — failure is the headline
2. **Triage, not deep-dive** — logs are one click away
3. **Blast radius clarity** — what's blocked, by name
4. **Accessible to non-experts** — plain language + colour + text
5. **Status-aware** — passed / running / failed each have their own framing
6. **Compact and contained** — a header, not a dashboard

---

## Slide 8 — Information hierarchy (failed builds)

Priority order for a developer scanning:

1. **What broke** — specific step + job + exit code
2. **Downstream impact** — how many steps blocked, by name
3. **Pipeline shape** — all steps, full picture
4. **Sub-job detail** — for matrix/parallel: which variant

This priority list directly drove what V7 surfaces first vs later.

---

## Slide 9 — How strategy translated into the work

| Strategy lever | What I built |
|---|---|
| Developer-first experience | Plain-language suggestion line; AI source acknowledged but not loud; failure name is its own headline |
| Observability differentiation | Pipeline strip + per-row Copy summary + structured failure data as the foundation for cross-build aggregation (V7.5) |
| Start simple, scale infinitely | Same component handles 1 failure, 5 failures, stuck builds, post-fix verification — same primitives, different states |
| AI-assisted debugging (future) | Pattern dispatch table is the contract; real LLM plugs in here |
| Security & trust | Apply fix is a deliberate two-step disclosure with attribution + audit-trail framing |

---

## Slide 10 — Wrap

The PRD wasn't bureaucratic scaffolding — it was the constraint that made every design decision easier.

When I had to choose between two options, the principle that won was the strategically-aligned one. That's why almost every decision in the next deck has a PRD principle attached.

**Next deck:** how the user journey + design rationale flow from the strategy.
