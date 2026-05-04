# PRD: Build Header — Expanded Triage View

**Component:** `BuildHeader.tsx` expanded region
**Status:** Draft
**Author:** Siray Li
**Date:** 2026-04-30
**Strategy source:** `buildkite_product_company_profile_expansion_strategy.md`

---

## Part 1 — Company & Product Strategy Context

> This section summarises the Buildkite expansion strategy that this PRD is grounded in. All references to "Strategy §X" below point back to this document.

### Who Buildkite is today

> "Buildkite is a software delivery platform company focused on helping engineering teams build, test, and deploy software reliably at scale."
> — Strategy §1

Buildkite's core value proposition is its hybrid architecture: teams run builds on their own infrastructure while Buildkite provides the orchestration layer. This gives it a strong moat with enterprise and high-scale engineering organisations who need security, control, scalability, and deep workflow customisation.

> "Buildkite is the control plane for software delivery, while customers can choose where and how their build infrastructure runs."
> — Strategy §1

### Where Buildkite is going

The strategy identifies a significant expansion opportunity: moving from enterprise-only into small-to-medium organisations and individual developers. This requires reducing perceived complexity without sacrificing advanced power.

> "From powerful CI/CD for enterprises → To CI/CD that grows with you, from first project to global scale."
> — Strategy §2

> "The winning strategy is not to simplify Buildkite by removing power. The winning strategy is to progressively reveal power as users mature."
> — Strategy §9

The target positioning:

> "Start simple. Scale without limits."
> — Strategy §4.2

### Business goals that matter for this work

**Increase product-led growth (Strategy §3.3)**
> "This means improving: time to first successful pipeline, guided onboarding, in-product education, templates and defaults."

**Lower the barrier to entry (Strategy §3.4)**
> "The biggest blocker for smaller users is likely setup complexity. Buildkite should reduce friction by offering: faster setup, more guided pipeline creation, better defaults, clearer first-run experience."

**Create expansion loops (Strategy §3.5)**
> "Individual developers try Buildkite on side projects → small teams adopt it for early products → growing companies expand usage across teams → mature organisations upgrade into enterprise plans."
> Individual → Team → Business → Enterprise

### Key differentiators relevant to this work

**Developer-first experience (Strategy §4.3)**
> "Buildkite's current experience is powerful but can feel oriented toward platform engineers and DevOps experts. To expand down-market, Buildkite should also feel accessible to product engineers and individual developers. This means improving: error explainability, workflow guidance, visual understanding of build status, debugging support."

**Observability as a product differentiator (Strategy §4.4)**
> "Buildkite should not only help users run pipelines. It should help users understand software delivery health. Key observability opportunities: why builds are failing, which tests are flaky, where bottlenecks exist, how long pipelines take, which steps are slowing teams down."
> "This is valuable for individuals, SMBs, scaling teams, and enterprises."

### User segments and their needs

**Individual developers (Strategy §5.1)**
> Profile: indie hackers, freelancers, side-project builders, open-source maintainers, solo technical founders, developers learning CI/CD. They often have limited time and limited infrastructure maturity.

Core job most relevant here:
> "Debug failures easily — Help me understand what went wrong and how to fix it."

Key needs: clear error messages, fast feedback loops, good documentation, minimal configuration.

> "Product risk: Buildkite may currently feel too complex or infrastructure-heavy for this segment."

**SMB and startup teams (Strategy §5.2)**
> Profile: 3 to 50 person engineering teams, early-stage startups, product-led SaaS companies, teams without dedicated DevOps support.

Core job most relevant here:
> "Make delivery visible — Help everyone understand what is building, failing, blocked, or ready to deploy."

> "This is likely the highest-leverage growth segment because these teams can start small and expand usage over time."

**Mid-market teams (Strategy §5.3)**
Core job most relevant here:
> "Improve pipeline reliability — Help us reduce flaky tests, failed builds, and delivery interruptions."
> "Identify bottlenecks — Help us understand where time is being lost in the delivery process."

**Enterprise teams (Strategy §5.4)**
Core job most relevant here:
> "Improve engineering productivity — Help us reduce bottlenecks and improve developer velocity across the organisation."

### Product strategy implications for this work

**Dual-mode product experience (Strategy §7.1)**
The strategy calls for Buildkite to feel simple for individuals without removing its power for enterprise teams. In the context of the build header, this means the expanded triage view should be scannable and plain-language for a non-expert, while still being precise enough for a platform engineer.

> "Simple debugging" is explicitly listed as a feature of the simple-mode experience.

**Onboarding as a core product surface (Strategy §7.2)**
> "The target experience should be: first successful pipeline in minutes, not hours."

The build header is not onboarding, but this principle applies: understanding a failure should take seconds, not minutes. Steps 5 and 6 of the onboarding journey defined in the strategy — "Understand the result" and "Debug any issue" — are exactly what the expanded triage view must deliver.

**AI-assisted debugging (Strategy §7.3)**
> "AI could help Buildkite become more accessible to non-expert users. Potential AI-assisted features: explain failed builds in plain language, detect flaky tests, recommend pipeline optimisations."

This is a future capability, not in scope for this component. However, the expanded triage view is the natural entry point for an AI explanation layer — the design must not preclude it.

---

## Part 2 — Product Requirements

### 1. Problem Statement

*Linked to: Strategy §4.3, §4.4, §7.2*

When a developer clicks the PR row in the build header, they are signalling high intent: they want to understand what happened. Today, that click opens an empty placeholder. The developer has no choice but to scroll past the header and click into individual steps to find the failure — a 2–3 click detour that breaks their flow and increases time-to-resolution.

This directly contradicts the strategy's goal of improving error explainability and making the product feel accessible to non-expert users. It is a wasted moment of intent at the exact point where urgency is highest.

---

### 2. Strategic Fit

*Linked to: Strategy §4.3, §4.4, §7.3*

The expanded build header is a **micro-observability surface** — the fastest path from "something broke" to "I know what broke and what it blocked."

This directly supports two of Buildkite's key strategic differentiators:

- **Observability** (§4.4): surfacing why builds fail, where bottlenecks are, which steps blocked downstream — without requiring the developer to navigate into logs.
- **Developer-first experience** (§4.3): error explainability and visual understanding of build status, accessible to product engineers and individual developers — not only DevOps experts.

It also sets the foundation for the AI-assisted debugging direction (§7.3), where plain-language failure explanations become a natural next layer on top of this structured triage view.

---

### 3. User Archetypes

*Linked to: Strategy §5.1, §5.2, §5.3, §5.4*

**Primary: Product engineer / individual developer**
Solo or small team. Shipped a PR, build failed. In "fix mode" — wants the shortest path to understanding the failure so they can push a fix and move on. May not have DevOps expertise. Needs plain language, not log navigation.
*Emotional state: mild urgency, possibly anxious if blocking teammates.*

**Secondary: Reviewer / team lead**
Reviewing a PR or monitoring the build queue. Wants to understand blast radius without diving into logs — is this blocking others? Is it environment or code?

**Also served:** Mid-market and enterprise teams benefit from the same triage clarity — identifying bottlenecks and improving engineering velocity are core jobs for these segments too (§5.3, §5.4).

---

### 4. Jobs to Be Done

*Linked to: Strategy §5.1, §5.2, §5.3*

#### 4.1 Current scope

| Situation | Motivation | Expected outcome |
|---|---|---|
| When my build fails | I want to instantly see which job broke and why | So I can fix it and re-push without navigating into logs |
| When I see a failure on a PR I didn't author | I want to understand the blast radius | So I know if it's safe to merge other work or if the team is blocked |
| When multiple things are failing | I want to know which one is the root cause | So I don't waste time chasing symptoms |
| When I'm new to CI/CD | I want the failure explained in plain terms | So I don't have to decode log output or CI jargon |

#### 4.2 Extended jobs — future state

These represent the next layer of value beyond this component. They should inform how we design now so we don't paint ourselves into a corner.

**Performance**
*Linked to: Strategy §5.3, §5.4*

| Situation | Motivation | Expected outcome |
|---|---|---|
| When a large number of pipelines are running in parallel | I want to see build status across all of them without the UI slowing down or becoming overwhelming | So I can monitor multiple projects simultaneously without friction or cognitive overload |

Design implication: the triage view must be built with performance in mind — avoid rendering approaches that won't scale to high pipeline volume. Lazy loading, virtualisation, and efficient state management should be considered as the component evolves.

---

**Error Aggregation**
*Linked to: Strategy §4.4, §5.3*

| Situation | Motivation | Expected outcome |
|---|---|---|
| When multiple pipelines fail at the same time | I want a summarised view that surfaces a common root cause across failures — not a list of isolated errors | So I can prioritise where to focus and avoid fixing symptoms rather than the cause |

Design implication: the current view surfaces failure within a single build. A future aggregation layer would need to identify patterns across builds — e.g. all failures tracing back to the same flaky dependency or environment issue. The information hierarchy established here (what broke → blast radius → pipeline shape) should extend naturally to a cross-build view.

---

**Developer Onboarding and Support**
*Linked to: Strategy §4.3, §5.1, §7.2*

| Situation | Motivation | Expected outcome |
|---|---|---|
| When I'm new to CI/CD or engineering | I want the system to suggest what changes might fix the failure | So I can resolve issues and learn best practices without needing to escalate to a senior engineer |

Design implication: this is the in-product education role the strategy identifies in §7.2 — "onboarding is not just a setup flow, it is a conversion and education engine." The triage view is a natural teachable moment. Inline suggestions ("this exit code typically means…") or recommended next steps can be introduced progressively without cluttering the view for experienced users.

---

**AI Integration**
*Linked to: Strategy §7.3*

| Situation | Motivation | Expected outcome |
|---|---|---|
| When I encounter a failure I don't understand | I want to consult an AI copilot that can explain the failure and help me plan a fix | So I can resolve it faster without needing to leave Buildkite or search documentation |
| When I trust the AI's recommendation | I want the AI to propose — or execute — a fix autonomously | So I can focus on higher-value work and reduce manual back-and-forth |

The strategy explicitly calls this out:
> "Explain failed builds in plain language, recommend pipeline optimisations, detect flaky tests, suggest caching strategies, help migrate from GitHub Actions, CircleCI, or Jenkins."
> — Strategy §7.3

Design implication: AI integration operates on a confidence spectrum — from passive explanation, to active recommendation, to autonomous execution. The triage view should be designed as a container that can progressively accommodate this: the structured failure summary we build now becomes the context layer an AI model would read from and write back into. The design must leave a clear, uncluttered entry point for this future layer — likely as a section below the pipeline step list — and avoid tightly coupling the layout in ways that would require a redesign to accommodate it.

---

**Security**
*Linked to: Strategy §4.6*

| Situation | Motivation | Expected outcome |
|---|---|---|
| When I or an AI agent initiates a fix action from the triage view | I want to be confident that only authorised people or systems can execute changes to my pipeline | So I can trust that no unintended or unauthorised modification occurs — especially in shared team or enterprise environments |
| When a fix is being proposed or executed | I want a clear confirmation step before anything is applied | So I remain in control of what changes are made and have a record of who or what triggered them |
| When sensitive pipeline details are surfaced in the triage view | I want to be sure that secrets, credentials, and environment variables are never exposed — even in failure output | So the act of diagnosing a build does not become a security vulnerability in itself |

The strategy is explicit on this:
> "As AI-generated code and automation increase, teams will need more confidence in their delivery systems. Buildkite can differentiate through: secure execution, reliable pipelines, controlled infrastructure, scalable parallelisation, enterprise-grade governance, strong auditability."
> — Strategy §4.6

This is Buildkite's foundational moat with enterprise customers and must not be compromised as the product expands down-market or introduces AI-driven actions.

Design implication: Security in the triage view operates at three levels, and all three must coexist with — not replace — the failure information the developer needs:

1. **Authorisation gates** — any action (retry, AI-proposed fix, autonomous execution) must be gated by the user's permission level. The UI should make it clear what the user is authorised to do before they attempt it, not after.

2. **Confirmation and audit** — destructive or pipeline-modifying actions require an explicit confirmation step. That confirmation must be additive: it appears alongside the failure context, not in place of it. A modal or inline confirmation that obscures the failure summary is a UX failure and a trust failure simultaneously. All actions should produce an audit trail attributable to the triggering user or AI agent.

3. **Data exposure** — the triage view must never surface raw environment variables, secrets, or credentials, even when they appear in failure logs. Any failure output passed to an AI copilot must be sanitised before transmission. This is non-negotiable for enterprise adoption and applies equally to the SMB and individual segments where users may not realise what they are exposing.

---

### 5. The Three-Tier Architecture

*Linked to: Strategy §4.4, §7.1*

This component is the middle tier of a three-level information hierarchy that reflects the dual-mode product experience the strategy calls for (§7.1): simple enough for a non-expert to triage in seconds, precise enough for an expert to act on immediately.

| Tier | Surface | Time to read | Purpose |
|---|---|---|---|
| 1 | Progress bar (collapsed) | ~2 seconds | At-a-glance pipeline health |
| **2** | **Expanded header (this)** | **~10 seconds** | **Triage: what broke, where, what's blocked** |
| 3 | Step list + logs below | Minutes | Deep investigation |

**The expanded region must be faster than scrolling down.** It is a summary layer, not a duplicate of the step list below.

---

### 6. Success Metrics

*Linked to: Strategy §3.3, §4.4*

**Qualitative**

| Metric | What we're measuring |
|---|---|
| Net Promoter Score (NPS) | Would developers recommend Buildkite based on how easy it is to understand and recover from a failed build? Tracked via post-build or in-product survey. |
| Satisfaction score (CSAT) | How satisfied was the developer with the information available after a build failure? Measured at the point of interaction — e.g. a lightweight thumbs up/down or 1–5 rating on the expanded triage view. |

**Quantitative**

| Metric | What we're measuring |
|---|---|
| Customer Effort Score (CES) | How much effort did it take to find out what went wrong? Lower is better. Measured via survey prompt: "How easy was it to understand what failed in your build?" (1–7 scale). Target: reduction in average effort score after shipping this component. |

---

### 7. Scope

**In scope**
- The expanded region inside `BuildHeader.tsx` (the `DESIGN ENGINEER TASK` placeholder)
- Behaviour for **failed** build status — the primary case
- Behaviour for **passed** and **running** states (graceful, even if minimal)
- Semantic markup and keyboard accessibility within the component

**Out of scope**
- Log content — the step detail view below the header handles this
- Clicking into individual steps from this view — already handled by the step list below
- AI-assisted failure explanation — future capability (§7.3), but the design must not preclude it
- Flaky test detection — requires historical data not available in this scope
- Dark mode — explicitly out of scope per task brief
- Backend integration — all data is mocked

---

### 8. Design Principles

*Linked to: Strategy §4.2, §4.3, §7.1, §9*

1. **Failure-first.** In a failed build, the failure is the headline. It must be the most prominent element, immediately visible without scanning. *(Supports §4.3: error explainability)*

2. **Triage, not deep-dive.** Surface enough to make a decision. The step logs are one click away. *(Supports §7.1: simple mode — simple debugging)*

3. **Blast radius clarity.** Not just what failed — what it blocked downstream. *(Supports §5.2 JTBD: "Make delivery visible — help everyone understand what is building, failing, blocked, or ready to deploy")*

4. **Accessible to non-experts.** Plain language. Status communicated via text paired with colour, never colour alone. Exit codes visible but not the only signal. *(Supports §4.3: accessible to product engineers and individual developers, not only DevOps experts)*

5. **Status-aware.** The view adapts to build state. A passing build has a different triage story than a failing one. *(Supports §4.4: understand software delivery health across all states)*

6. **Compact and contained.** A header, not a dashboard. Proportionate to the surrounding UI. *(Supports §9: progressively reveal power — this is the summary layer, not the full investigation surface)*

---

### 9. Information Hierarchy (Failed Build)

*Linked to: Strategy §4.4*

Priority order for a developer scanning the expanded view:

1. **What broke** — specific step and job name, exit code
2. **Downstream impact** — how many steps are blocked
3. **Pipeline shape** — all steps with their statuses, the full picture
4. **Sub-job detail** — for matrix/parallel steps that failed, which specific job within the step

---

### 10. Open Questions

| Question | Notes |
|---|---|
| Should parallel steps always expand their sub-jobs, or only when failed? | Failed = always expand (critical context). Passed = collapse (not the focus). |
| What does this view show for a **passing** build? | Could show a clean summary — all steps passed, total duration. Lower priority for this scope. |
| Should individual jobs be clickable (deep link to logs)? | Would increase utility, adds scope. Natural future enhancement. |
| Where does the AI explanation layer live? | §7.3 names "explain failed builds in plain language" as a key AI feature. A third section below the pipeline list is the natural entry point. Design must leave room for it. |

---

### 11. What We Are Not Building (and Why)

| Not building | Reason |
|---|---|
| Log previews inline | Too much content for a header — the step list below handles this |
| Retry / cancel actions inside the expanded view | Already handled by `BuildActionsComboButton` above |
| Test failure details (assertion messages) | Requires log parsing outside mock data and component scope |
| Filtering or sorting steps | Overkill for a 6-step pipeline; premature abstraction |

---

### 12. Opportunity Prioritisation

#### 12.1 Future-state scenarios — what we are designing

Each scenario is written as a sequential future journey for the relevant user archetype. Scenarios marked *separate* are designed alongside the core component using assumed or mock data.

---

**Scenario 1 — Failure notification, triage, fix, and share**
*Archetypes: Product engineer / individual developer · Reviewer / team lead*
*Combines: rich failure notification + core triage view + inline fix suggestion + post-fix verification + shareable failure summary*

Jordan pushes a PR. The build fails. A notification arrives — not a generic "Build #17532 failed" but a contextual summary: "Test matrix › Test (Node 18) failed (exit 1) · Checkout, Dependencies, Lint all passed · Bundle and Deploy are blocked." Jordan arrives at Buildkite already oriented. They click the PR row and the expanded triage view confirms what the notification said: the failure spotlight names the specific job and exit code, the blast radius callout names the blocked steps, and the sub-job rows show exactly which Node version variant broke. A direct link beside the failure name takes Jordan to the exact step in the list below in one click. Progressive disclosure shapes the whole view — Jordan sees the right level of detail for their expertise without wading through noise.

Below the failure spotlight, a suggestion surfaces based on the known failure pattern: "This exit code typically means your test suite is using a CommonJS import pattern incompatible with Node 18. Suggested fix: update your import syntax in auth.js." Jordan is not immediately confident — the error is in a file a colleague owns. Before acting, Jordan clicks "Copy failure summary." A structured plain-text summary is copied to their clipboard: "Build #17532 — Test matrix › Test (Node 18) failed (exit 1). Bundle and Deploy are blocked. Checkout, Dependencies, and Lint all passed." Jordan pastes it into Slack in one action and asks their colleague to confirm the suggestion looks right.

The colleague confirms. Jordan returns to the triage view, clicks "Preview fix," and sees a code diff inline — the exact lines that would change. They review it, click "Apply," and the fix is committed directly from the triage view. The pipeline re-runs automatically. The triage view updates in place: the previously failed step shows "previously failing — now passing," the blast radius clears as Bundle and Deploy unblock. Jordan has gone from notification to fix to verified resolution without leaving the view or opening a code editor.

If Jordan is confident from the start, the share step is skippable — they click "Preview fix" directly. If the suggestion is wrong, they dismiss it and follow the direct link to the step logs instead. A confirmation step is always required before any code change is applied, and the action is attributed to Jordan's account in the audit trail.

Sam, reviewing a colleague's PR, receives the same notification and opens the same triage view. The blast radius callout names "Bundle and Deploy are blocked" — Sam knows immediately that deploy is off the table for this branch. The blocked step names are direct links so Sam can jump to either one in a single click to confirm.

---

**Scenario 2 — Unusual pipeline behaviour: recurring failure, stuck build, contextual retry, and verification**
*Archetypes: Product engineer / individual developer · Reviewer / team lead*
*Combines: recurring failure indicator + stuck build detection + contextual retry + post-fix verification*

**Variant A — Recurring failure**

Sam expands the triage view on a failed PR and notices an indicator alongside the failed step: "Failed in 3 of the last 5 builds." Sam immediately recognises this is likely a flaky environment, not a regression introduced by this PR. They flag it to the platform team and avoid blocking the author for a problem that is not theirs.

Jordan, seeing the same indicator on their own build, decides not to push a code fix — the failure looks environmental. They click "Retry job" directly on the failed job in the triage view. This is scoped to that specific job, not the whole pipeline, preserving the results of all the steps that already passed. The job status changes to in-progress in place. It resolves to passing — confirming the flaky environment theory. The triage view updates: the failure spotlight clears, the blast radius callout clears as the blocked steps unblock. Jordan has confirmed the issue was not their code without writing a single line.

If the retry fails again, the triage view shows "Still failing" with the new exit code, giving Jordan more signal about whether the issue is environmental or reproducible — and a clear basis for escalating to the platform team.

**Variant B — Stuck build**

Sam is reviewing the build queue and notices a PR whose build has been marked "running" for over three hours. No failure notification has fired — the build hasn't failed, it simply hasn't finished. Without our design, this goes undetected until someone notices the absence of a result.

Sam expands the triage view. The in-progress step shows a duration anomaly indicator alongside its elapsed time: "Running for 3h 24m — typically completes in 8m." Sam immediately recognises the build is stuck, not slow. They alert the platform team and retry the job directly from the triage view. The job restarts and completes in the expected time window. The triage view updates to show the step as passing.

This variant addresses a failure mode that generates no alert in any current CI tool: the build that never fails because it never finishes. The duration anomaly signal is the only thing that makes it visible without manual monitoring. *(Source: Buildkite feedback [#333](https://github.com/buildkite/feedback/issues/333) — user reports agents stalling for hours with no notification.)*

---

**Scenario 3 — AI explanation, copilot, and fix execution**
*Archetype: Product engineer / individual developer · New engineer / CI newcomer*
*Combines: AI explanation + recommendation + execution + in-place verification*

Jordan reads the failure spotlight — the structured summary is fully visible at the top. Below it, an AI explanation layer adds context: "This failure suggests your test suite is using a CommonJS import pattern that Node 18 handles differently from Node 16. You may need to update your import syntax or add a Node 18 compatibility configuration."

The AI operates on a confidence spectrum. Jordan reads the explanation and decides how far to take it. At the explain level, Jordan takes the insight and makes the fix themselves. At the recommend level, the AI surfaces a specific proposed code diff for Jordan to preview. At the execute level, Jordan approves the diff and the fix is applied to the branch from the triage view. The pipeline re-runs. The triage view updates in place — the failed step resolves to passing, the blast radius clears, and Jordan sees "previously failing — now passing" on the specific job without navigating away.

At no point does the AI layer replace or obscure the structured failure summary. The summary is the ground truth; AI is additive. A confirmation is required before any code change is applied. All actions are logged against Jordan's account. Secrets and environment variables are sanitised before any data is passed to the AI model.

---

**Scenario 4 — Cross-build failure aggregation and team escalation**
*Archetype: Reviewer / team lead*
*Combines: cross-build failure aggregation + shareable summary for team context*

Sam is monitoring the build queue and notices three separate PRs have all failed. Rather than expanding each one individually, the triage view surfaces a pattern: "Test (Node 18) has failed across 3 builds in the last hour — possible shared root cause." Sam can see the team-wide blast radius at a glance: which PRs are affected, which downstream steps are blocked across all of them, and a single shared failure signature pointing to the same job.

Sam clicks "Copy failure summary" from the aggregation view and pastes a consolidated report into Slack: the pattern, the affected PRs, the blocked steps across all three. The platform team receives one clear, actionable escalation instead of three separate failure reports. Sam can continue reviewing other PRs while the platform team investigates.

---

#### 12.2 Deferred — not designing now

| Deferred | Reason |
|---|---|
| Log previews inline | Too much content for this tier — the step list below handles deep investigation |
| Global retry / cancel in the expanded view | Already handled by `BuildActionsComboButton` above. Contextual job-level retry is covered in Scenario 2 (both variants). |
| Test failure details inline (assertion messages, stack traces) | Not surfaced inside the triage view — belongs in Tier 3. Made accessible via the direct link in the failure spotlight. |
| Filtering or sorting steps | Covered in the separate high-volume pipeline scenario alongside Scenarios 1–4. |
| Build comparison side by side | Post-fix verification embedded in Scenarios 1, 2, and 3 covers the core need without a full side-by-side view. |
| Slack / PR comment integration | Depends on external platform integration outside this component's scope. |
