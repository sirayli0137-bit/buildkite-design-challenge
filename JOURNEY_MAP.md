# Journey Map: Build Header Expanded Triage View

**Archetypes covered:** Product engineer / individual developer · Reviewer / team lead
**Scope:** Focused on the moments surrounding the build header expanded triage view
**Date:** 2026-04-30

---

## Archetype 1 — Product Engineer / Individual Developer

> Solo or small team. Shipped a PR, build failed. In "fix mode." May not have DevOps expertise. Emotional state: mild urgency, possibly anxious if blocking teammates.

---

### Stage 1: Push code and trigger build

The developer has pushed a PR. A build is triggered automatically.

| | Detail |
|---|---|
| **Needs** | Confidence that the build has started and will give timely feedback. A rough sense of how long it will take. |
| **Pain points** | No immediate feedback after pushing. Uncertain whether the build is queued, waiting for an agent, or actually running. Anxiety if no status appears quickly. |
| **Opportunities** | Clear build status visibility immediately after push. Pipeline start confirmation. *(Not in scope for this component but informs the emotional state the developer arrives with.)* |

---

### Stage 2: Build running

The developer is waiting — watching the progress bar, context-switching, or waiting for a notification.

| | Detail |
|---|---|
| **Needs** | Know the build is progressing. Estimate when it will finish so they can stay focused on other work. |
| **Pain points** | No ETA. If the build is slower than expected, no signal as to why. Anxiety if a step seems stuck. |
| **Opportunities** | The collapsed progress bar (Tier 1) already provides a live visual of pipeline shape and progress. Barber-pole animation on in-progress steps signals activity. *(Existing — no change required here.)* |

---

### Stage 3: Build fails — notification moment

The developer receives a failure signal: a red status check on GitHub, a Slack message, or an email.

| | Detail |
|---|---|
| **Needs** | Understand at a high level what failed. Decide whether to go investigate now or finish their current task first. |
| **Pain points** | Notifications are almost always generic — "Build #17532 failed." No failure detail, no indication of severity. Forces the developer to navigate to Buildkite before they know if it is worth interrupting their flow. |
| **Opportunities** | **Design now (indicative):** Rich failure notification showing contextual information about what happened before the step failed — e.g. which steps passed, which job broke, what exit code was returned. Designed as an indicative pattern using the triage view data as its source, so the developer arrives at Buildkite already oriented rather than starting cold. The notification is not a separate product — it is a projection of the same failure summary surfaced at an earlier touchpoint in the journey. |

---

### Stage 4: Arrive at the build view

The developer lands on the Buildkite build page and sees the header in its failed state.

| | Detail |
|---|---|
| **Needs** | Immediately understand what failed without scrolling. Confirm this is the right build and the right PR. |
| **Pain points** | The header shows overall build status (failed) and the PR title, but no failure detail. The developer sees "failed" but not "why." They must scan the progress bar to spot the red segment and infer where the break occurred. |
| **Opportunities** | The progress bar already signals the failure point visually. The PR row gives context on what triggered the build. Clicking to expand is the natural next action — which leads directly to our component. |

---

### Stage 5: Expand the triage view ← this component

The developer clicks the PR row. The expanded region opens.

| | Detail |
|---|---|
| **Needs** | What specifically broke — step name, job name, exit code. What is blocked downstream as a result. Whether this is a code failure or an environment/infrastructure issue. Enough context to decide the next action without leaving the header. |
| **Pain points** | **Currently:** the expanded region is an empty placeholder. There is no information. The developer must scroll past the header and navigate into individual step logs — a 2–3 click detour. **Risk with our design:** information overload if the hierarchy is not clear. Exit codes without context are meaningless to non-experts. Parallel/matrix failures can be confusing if sub-jobs are not surfaced. |
| **Opportunities** | Failure spotlight immediately names the specific job and exit code. Blast radius callout names the specific blocked steps — not just a count. Sub-job expansion for the failed step shows which environment variant broke. **Direct link from the triage view to the specific failed step in the list below — bridges Tier 2 and Tier 3 in one action, eliminating the scroll-and-hunt step.** **Progressive disclosure as the core design pattern** — the view reveals the right level of detail for the user's context, not a flat list of everything at once; novices see plain-language guidance, experts see precise technical detail, and additional layers (suggestions, history, AI) surface only when relevant. **Design now (separate scenario): Inline fix suggestions** based on assumed pattern data — common failure signatures (e.g. a test runner exit code, a missing dependency) surface a suggested next action without the developer having to leave the view. **Design now (separate scenario): Recurring failure indicator** — using assumed historical data, flag when the same step has failed repeatedly across recent builds, helping the developer distinguish a genuine regression from a flaky environment. **Design now (separate scenario): Filtering and sorting within the expanded view** — when a pipeline has many steps or a large job matrix, filter and sort controls scoped to the expanded view let the developer cut through volume without leaving it. Filter by status (All / Failed / Blocked) to reveal patterns across many jobs; sort by duration to surface timeouts or slow steps. The failure spotlight remains anchored and unchanged regardless of the active filter or sort state. **Design now (separate scenario): AI explanation and copilot** — designed as a separate version showing how an AI layer sits below the triage view, adds plain-language context and recommended actions without replacing the structured failure summary. |

---

### Stage 6: Understand and decide

The developer has read the triage view and is deciding what to do next.

| | Detail |
|---|---|
| **Needs** | Enough context to know if they can fix it themselves. A clear path to deeper investigation if needed. Confidence about whether they are blocking teammates. |
| **Pain points** | The triage view surfaces what broke but not why — the actual error message lives in the step logs. Even after reading the triage view, the developer still has to scroll past the header, scan the step list, and find the right step before they can see the logs. Less experienced developers may not know how to interpret an exit code even if it is visible. No guidance on what to change. |
| **Opportunities** | **A direct link from the failure spotlight to the corresponding step in the list below removes the scroll-and-hunt entirely. The triage view becomes a routing layer, not a dead end — one click bridges "I know what broke" to "I can see why it broke."** Inline fix suggestions (separate scenario) give non-experts a starting point without leaving the view. **Design now (separate scenario): Shareable failure summary** — a one-action way for the solo developer to copy or share the failure context, reducing the friction of describing the failure to a teammate, a forum, or an AI tool externally. Future: AI copilot recommendation and fix plan (designed as a separate version). |

---

### Stage 7: Fix, retry, and verify

The developer acts on the failure — either by applying a fix, retrying a flaky job, or pushing updated code — and confirms the result.

**Current steps (without our improvements):**
1. Read the empty expanded view → no information
2. Scroll past the header to find the failed step in the list below
3. Click into the step to open the raw log output
4. Read through the log to find the specific assertion or error
5. Switch to their code editor and find the relevant file
6. Write the fix
7. Commit and push
8. New build triggers — developer navigates back to Buildkite
9. Finds the new build and opens it
10. Checks whether the same step that failed now passes
11. If it fails again — back to step 3 with no context carried forward

| | Detail |
|---|---|
| **Needs** | Confidence the fix resolved the right thing — not just that the overall build passed, but that the specific step is now green. A way to retry a flaky job without re-running the full pipeline. Clear signal if the fix introduced a new problem elsewhere. |
| **Pain points** | After re-pushing, the developer must navigate back to Buildkite, find the new build, and manually remember which step they were fixing. There is no carried context between the failed build and the new one. A global retry re-runs the entire pipeline even when only one job needs to be re-tested, wasting time and compute. If the fix did not fully work, the developer has no comparison to understand what changed. |
| **Opportunities** | **Design now (Scenario 9): Contextual retry** — retry the specific failed job directly from the triage view without re-running the full pipeline. The job status updates in place. Useful when the recurring failure indicator suggests a flaky environment. **Design now (Scenario 10): Post-fix verification** — the new build's triage view carries forward context from the previous build, marking the previously failed step as "previously failing — now passing." Jordan sees immediately that the fix resolved exactly the right thing. If a new failure is introduced elsewhere, it is flagged as "new failure" rather than requiring the developer to diff the two builds manually. **Design now (Scenario 3 + 7): Fix directly from the triage view** — when an inline suggestion or AI recommendation is accepted, the fix is applied, the pipeline re-runs, and the triage view updates in place. Jordan never has to leave the view to complete the fix-and-verify loop. |

---

## Archetype 2 — Reviewer / Team Lead

> Reviewing PRs or monitoring the team's build queue. Not the author of the failing build. Wants to understand blast radius and team impact without going deep into logs.

---

### Stage 1: Monitoring the build queue or PR list

The reviewer is scanning the build queue or a list of open PRs, checking the health of the team's work.

| | Detail |
|---|---|
| **Needs** | A quick visual scan of build health across multiple PRs. An immediate sense of which failures are serious versus minor. |
| **Pain points** | Multiple failed builds at once create noise — hard to prioritise without drilling into each. No signal of severity from the collapsed header alone. |
| **Opportunities** | Progress bars and status icons provide at-a-glance health across the list (already exists). Future: cross-build failure aggregation surfaces patterns and recurring root causes at the list level. |

---

### Stage 2: Spot a failed build

The reviewer notices a PR in the list with a failed build status.

| | Detail |
|---|---|
| **Needs** | Immediately understand severity — is this a minor test failure or is the deploy pipeline blocked? Is main affected? |
| **Pain points** | The collapsed header shows "failed" but not the extent of the failure. The reviewer cannot tell from the list view whether it is a single job or a cascade that has blocked downstream steps. |
| **Opportunities** | The progress bar already shows the shape of the failure (red segment + grey blocked segments). This gives a rough severity signal before expanding. Improving the resolution of this signal is a future opportunity. |

---

### Stage 3: Expand the triage view ← this component

The reviewer clicks the PR row to understand what happened.

| | Detail |
|---|---|
| **Needs** | Blast radius — what is blocked and how many steps. Whether the failure is in code, tests, or infrastructure. Whether this is the author's problem alone or something affecting the whole team. Root cause at a glance — without reading logs. |
| **Pain points** | **Currently:** the expanded region is empty. The reviewer must dive into step logs to assess severity. This costs time they may not have if they are reviewing multiple PRs. **Risk with our design:** if the failure information is not scannable in 5–10 seconds, the reviewer will skip the triage view and go straight to logs anyway. |
| **Opportunities** | Blast radius callout names the specific blocked steps — "Bundle and Deploy are blocked" is more actionable than "2 steps blocked." Failure spotlight names the specific job so the reviewer knows whether it is likely a code or environment issue. Sub-job detail for matrix failures shows which environment variant failed (e.g. Node 18 vs Node 16) — critical for understanding whether this is a compatibility issue. **Direct links from blocked step names to the corresponding steps in the list below — lets the reviewer jump immediately to the relevant step without hunting through the full list.** |

---

### Stage 4: Assess and decide

The reviewer has enough information to decide what to do next.

| | Detail |
|---|---|
| **Needs** | Can they safely merge other PRs? Is the failure isolated to this branch or has it broken main? Should they alert the author or escalate? |
| **Pain points** | The triage view shows what broke in this build but not whether it is a recurring pattern or a first-time failure. No team-context information — who else is affected, has this step failed before. No way to communicate directly from the triage view. |
| **Opportunities** | **Design now (separate scenario): Recurring failure indicator** — using assumed historical data, flag when a step has failed repeatedly across recent builds ("this step has failed 3 times in the last 5 builds"), helping the reviewer immediately distinguish a flaky environment from a genuine regression introduced by this PR. **Design now (separate scenario): Cross-build failure aggregation** — a separate scenario showing how failures across multiple pipelines surface a common root cause, giving the reviewer team-wide impact at a glance rather than requiring them to check each build individually. |

---

### Stage 5: Communicate or escalate

The reviewer contacts the PR author, comments on the PR, or escalates to the platform team.

| | Detail |
|---|---|
| **Needs** | Shareable context about what broke and what is blocked. Enough information to write a clear, actionable message to the author. |
| **Pain points** | The reviewer has to manually describe the failure — copying from logs or reconstructing it from memory. No native way to share the triage summary directly. |
| **Opportunities** | **Design now (separate scenario): Shareable failure summary** — a one-action way to copy or share the structured failure context directly from the triage view, so the reviewer can hand it to the PR author, post it in Slack, or escalate with full context — without reconstructing it manually. The structured failure data we build in the core component is the foundation for this. Future: direct Slack or PR comment integration. |

---

## Future-State Archetypes — Key Journey Moments

These archetypes emerge from the extended JTBDs (§4.2 of the PRD) and are not in scope for the current component. They are included here to ensure the journey we design now does not close off these paths.

---

### New engineer / CI newcomer

**Critical moment:** Arrives at the triage view with no prior CI/CD knowledge. Sees "exit 1" and does not know what it means or what to do.

| | Detail |
|---|---|
| **Needs** | Plain-language explanation of what the failure means. A suggested next step — not just "look at the logs." |
| **Pain points** | Technical terminology (exit codes, matrix, parallel jobs) creates immediate confusion. No guidance on where to start. High risk of abandonment or escalation to a senior engineer. |
| **Opportunities** | Progressive disclosure: inline plain-language hints for common failure patterns. Future: AI copilot as a learning companion — "this usually means your tests are failing because…" Onboarding tooltips that explain CI concepts in context without cluttering the expert view. |

---

### AI-assisted engineer

**Critical moment:** Encounters a failure they understand at a high level but want help resolving faster. Initiates an AI fix flow from the triage view.

| | Detail |
|---|---|
| **Needs** | An AI explanation of the failure in context. A proposed fix plan. Confidence in the AI's recommendation before executing. A clear confirmation step before anything is applied — and full visibility of the failure context throughout. |
| **Pain points** | If the AI explanation replaces the structured failure summary, the engineer loses the factual ground truth. Security risk if the AI receives unsanitised log output containing secrets or credentials. Unclear what the AI is authorised to change on their behalf. |
| **Opportunities** | AI layer sits below the structured triage view — it adds context, it does not replace it. Confidence-level indicator on AI recommendations (explain → recommend → execute). Explicit confirmation gate before any pipeline change is applied, with audit trail. Secrets sanitisation before any data is passed to the AI model. |
