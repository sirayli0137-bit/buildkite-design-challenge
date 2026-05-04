# design-engineer-task

Technical reference for the design engineer exercise. See `README.md` for the task brief and evaluation criteria.

## Commands

```bash
npm ci
npm run dev    # http://localhost:5173
npm run build  # must pass when done
npm run lint   # must pass when done
```

## Stack

React 18 · TypeScript · Tailwind CSS 3 · Vite · `lucide-react` for icons.
Path alias: `@` → `src/`.

## Key files

| File | Role |
|------|------|
| `src/App.tsx` | Mounts `BuildHeader` with mock props. Entry point. |
| `src/components/BuildHeader.tsx` | **Task surface.** Search for `DESIGN ENGINEER TASK`. |
| `src/components/HeaderBreadcrumbStubs.tsx` | Stub breadcrumb navigation (don't modify). |
| `src/components/BuildActionsComboButton.tsx` | Stub action buttons (don't modify). |
| `src/components/PageSkeleton.tsx` | Skeleton of the full page below the header (don't modify). |
| `src/data/mockBuildSteps.ts` | Mock pipeline. 6 steps, realistic failure cascade. |
| `src/types/build.ts` | `BuildStep` / `Job` types. Extend as needed. |
| `src/lib/utils.ts` | `cn()` className merge utility (clsx + tailwind-merge). |
| `src/lib/buildStatus.ts` | Status helpers: labels, colors, duration parsing, build stats. |
| `src/index.css` | Tailwind base + `.animate-barber` keyframe for progress stripes. |

## Data flow

`mockBuildSteps.ts` → `App.tsx` (props) → `BuildHeader` → expanded region.

No backend. All data is mock. You may add fields to types or mock data as needed.

## Available utilities

- **`cn(...classes)`** merges Tailwind classes safely (handles conflicts).
- **`getStatusLabel(status)`** returns a human label: `"Passed"`, `"Running"`, `"Failed"`, `"Waiting"`.
- **`getStatusColors(status)`** returns `{ bgColor, borderColor, textColor, topBorderColorHex }` per status. Handles both build-level statuses (`"running"`, `"passed"`) and step-level statuses (`"in-progress"`, `"complete"`).
- **`parseDuration(d)`** parses `"4s"`, `"1m 20s"`, or `"--"` into total seconds.
- **`formatDuration(secs)`** formats seconds back to `"Xm Ys"` / `"Xs"`.
- **`computeBuildStats(steps)`** returns `{ duration, failedCount, blockedCount, summaryText }` derived from `BuildStep[]`. Already used in `BuildHeader` for the status line. Reuse freely.

## Mock data shape

6 pipeline steps with a failure cascade:
1. **Checkout** (command) - complete, 4s
2. **Dependencies** (parallel, 2 jobs) - complete, 45s
3. **Lint** (parallel, 2 jobs) - complete, 13s
4. **Test matrix** (matrix, 3 jobs) - **failed**: Node 18 fails (exit 1), Node 20 stays pending
5. **Bundle** (command) - pending (blocked by failure)
6. **Deploy** (command) - pending (blocked by failure)

Steps with `type: "parallel" | "matrix"` have nested `jobs[]`. Simple `command` steps do not.

## Design context

- **Color palette**: zinc/neutral base, status-driven accents (green/amber/red). Use `getStatusColors()`.
- **Existing patterns**: the header uses `group/pr` named hover states, `transition-all` animations, and responsive `sm:` breakpoints. Use `group-hover/pr:` for hover states scoped to the PR row. The expanded region sits inside this group, so the named group prevents unintended hover inheritance.
- **Expand/collapse**: controlled by `isExpanded` state. The progress bar is the at-a-glance view; the expanded region is the triage view. The progress bar hides when expanded because the detailed view supersedes it.
- **Expand region**: the outer `<div>` with `max-h-[600px]` / `max-h-0` is the transition wrapper. Keep it, it powers the animation. The `max-h` value can be increased if your content needs more space. Everything inside the wrapper is yours to structure however you want.
- **Dark mode**: not implemented. Don't add it.
